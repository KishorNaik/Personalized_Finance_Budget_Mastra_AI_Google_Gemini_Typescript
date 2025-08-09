import {
	RequestData,
	sealed,
	StatusCodes,
	DataResponse,
	requestHandler,
	RequestHandler,
	DataResponseFactory,
	PipelineWorkflowException,
	PipelineWorkflow,
	Container,
	AesResponseDto,
	AesRequestDto,
	TransactionsWrapper,
	defineParallelSteps,
	defineParallelStep,
	GuardWrapper,
	IAesEncryptResult,
	FireAndForgetWrapper,
	ResultFactory,
	delay,
	Result,
	CleanUpWrapper,
} from '@kishornaik/utils';
import { getTraceId, logger } from '@/shared/utils/helpers/loggers';
import { AddTransactionDbService, getQueryRunner, TransactionEntity } from '@kishornaik/db';
import { CreateTransactionRequestDto, CreateTransactionResponseDto } from '../contracts';
import { IsUserValidIntegrationPublishEventService } from '@/shared/services/users/isUserValidPublishEvent';
import { Request } from 'express';
import { UserTokenProviderService } from '@/shared/services/users/userTokenProvider.service';
import { CreateTransactionEntityMapperService } from './services/mapEntity';

Container.set<AddTransactionDbService>(AddTransactionDbService, new AddTransactionDbService());

// #region Command
@sealed
export class CreateTransactionCommand extends RequestData<
	DataResponse<CreateTransactionResponseDto>
> {
	private readonly _requestExpress: Request;
	private readonly _request: CreateTransactionRequestDto;

	public constructor(requestExpress: Request, request: CreateTransactionRequestDto) {
		super();
		this._requestExpress = requestExpress;
		this._request = request;
	}

	public get request(): CreateTransactionRequestDto {
		return this._request;
	}

	public get requestExpress(): Request {
		return this._requestExpress;
	}
}
// #endregion

// #region Pipeline Steps
enum pipelineSteps {
	GET_USER_ID_FROM_REQUEST = `getUserIdFromRequest`,
	IS_USER_VALID = `isUserValid`,
	VALIDATE_USER = `validateUser`,
	MAP_REQUEST_ENTITY = `mapRequestEntity`,
	SAVE_TRANSACTION = `saveTransaction`,
	MAP_RESPONSE = `mapResponse`,
}
// #endregion

// #region Command Handler
@sealed
@requestHandler(CreateTransactionCommand)
export class CreateTransactionCommandHandler
	implements RequestHandler<CreateTransactionCommand, DataResponse<CreateTransactionResponseDto>>
{
	private pipeline = new PipelineWorkflow(logger);
	private readonly _getUserIdFromRequestService: UserTokenProviderService;
	private readonly _isUserValidIntegrationPublishEventService: IsUserValidIntegrationPublishEventService;
	private readonly _createTransactionEntityMapperService: CreateTransactionEntityMapperService;
	private readonly _transactionDbService: AddTransactionDbService;

	public constructor() {
		this._getUserIdFromRequestService = Container.get(UserTokenProviderService);
		this._isUserValidIntegrationPublishEventService = Container.get(
			IsUserValidIntegrationPublishEventService
		);
		this._createTransactionEntityMapperService = Container.get(
			CreateTransactionEntityMapperService
		);
		this._transactionDbService = Container.get(AddTransactionDbService);
	}

	public async handle(
		value: CreateTransactionCommand
	): Promise<DataResponse<CreateTransactionResponseDto>> {
		const queryRunner = getQueryRunner();
		await queryRunner.connect();

		const response = await TransactionsWrapper.runDataResponseAsync({
			queryRunner: queryRunner,
			onTransaction: async () => {
				const { request, requestExpress } = value;

				// Guard Clause
				const guardResult = new GuardWrapper()
					.check(request, 'request')
					.check(requestExpress, 'requestExpress')
					.validate();
				if (guardResult.isErr())
					return DataResponseFactory.error(
						guardResult.error.statusCode,
						guardResult.error.message
					);

				// Get User Identifier from the request
				await this.pipeline.step(pipelineSteps.GET_USER_ID_FROM_REQUEST, async () => {
					const result =
						await this._getUserIdFromRequestService.getUserId(requestExpress);
					if (!result)
						return ResultFactory.error(StatusCodes.UNAUTHORIZED, 'Unauthorized');
					return ResultFactory.success(result);
				});

				// Is User Valid Pipeline Workflow
				await this.pipeline.step(pipelineSteps.IS_USER_VALID, async () => {
					const userIdentifierResult = this.pipeline.getResult<string>(
						pipelineSteps.GET_USER_ID_FROM_REQUEST
					);
					return await this._isUserValidIntegrationPublishEventService.handleAsync({
						identifier: userIdentifierResult,
						traceId: getTraceId(),
					});
				});

				// Map Request Entity
				await this.pipeline.step(pipelineSteps.MAP_REQUEST_ENTITY, async () => {
					const userIdentifierResult = this.pipeline.getResult<string>(
						pipelineSteps.GET_USER_ID_FROM_REQUEST
					);
					return await this._createTransactionEntityMapperService.handleAsync({
						request,
						userId: userIdentifierResult,
					});
				});

				// Save Transaction
				await this.pipeline.step(pipelineSteps.SAVE_TRANSACTION, async () => {
					const entityResult = this.pipeline.getResult<TransactionEntity>(
						pipelineSteps.MAP_REQUEST_ENTITY
					);
					return await this._transactionDbService.handleAsync(entityResult, queryRunner);
				});

				// Map Response
				await this.pipeline.step(pipelineSteps.MAP_RESPONSE, async () => {
					const transactionResult = this.pipeline.getResult<TransactionEntity>(
						pipelineSteps.SAVE_TRANSACTION
					);
					const transactionResponseDto = new CreateTransactionResponseDto();
					transactionResponseDto.identifier = transactionResult.identifier;
					return ResultFactory.success(transactionResponseDto);
				});

				// Return
				const response = this.pipeline.getResult<CreateTransactionResponseDto>(
					pipelineSteps.MAP_RESPONSE
				);
				return DataResponseFactory.success(StatusCodes.CREATED, response);
			},
		});

		return response;
	}
}
// #endregion
