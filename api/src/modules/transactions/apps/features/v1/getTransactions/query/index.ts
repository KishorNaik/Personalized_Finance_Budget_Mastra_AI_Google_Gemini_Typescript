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
import { Request } from 'express';
import { getTraceId, logger } from '@/shared/utils/helpers/loggers';
import {
	AddTransactionDbService,
	getQueryRunner,
	GetTransactionsByMonthAndYearDbService,
	GetTransactionsFilterDto,
	TransactionEntity,
} from '@kishornaik/db';
import { GetTransactionResponseDto, GetTransactionsRequestDto } from '../contracts';
import { UserTokenProviderService } from '@/shared/services/users/userTokenProvider.service';
import { IsUserValidIntegrationPublishEventService } from '@/shared/services/users/isUserValidPublishEvent';
import { GetTransactionRequestValidationService } from './services/validations';
import { GetTransactionsEntityMapperService } from './services/mapEntity';
import { GetTransactionsResponseMapperService } from './services/mapResponse';

Container.set<GetTransactionsByMonthAndYearDbService>(
	GetTransactionsByMonthAndYearDbService,
	new GetTransactionsByMonthAndYearDbService()
);

// #region Query
@sealed
export class GetTransactionsQuery extends RequestData<DataResponse<GetTransactionResponseDto>> {
	private readonly _requestExpress: Request;
	private readonly _request: GetTransactionsRequestDto;
	public constructor(requestExpress: Request, request: GetTransactionsRequestDto) {
		super();
		this._requestExpress = requestExpress;
		this._request = request;
	}

	public get requestExpress(): Request {
		return this._requestExpress;
	}

	public get request(): GetTransactionsRequestDto {
		return this._request;
	}
}
// #endregion

// #region pipeline steps
enum pipelineSteps {
	GET_USER_ID_FROM_REQUEST_SERVICE = `getUserIdFromRequestService`,
	IS_USER_VALID_SERVICE = `isUserValidService`,
	VALIDATION_SERVICE = `validationService`,
	MAP_ENTITY_SERVICE = `mapEntityService`,
	GET_TRANSACTIONS_BY_MONTH_AND_YEAR_SERVICE = `getTransactionsByMonthAndYearService`,
	MAP_RESPONSE = `mapResponse`,
}

// #endregion

// #region Query Handler
@sealed
@requestHandler(GetTransactionsQuery)
export class GetTransactionQueryHandler
	implements RequestHandler<GetTransactionsQuery, DataResponse<GetTransactionResponseDto>>
{
	private pipeline = new PipelineWorkflow(logger);
	private readonly _getUserIdFromRequestService: UserTokenProviderService;
	private readonly _isUserValidIntegrationPublishEventService: IsUserValidIntegrationPublishEventService;
	private readonly _GetTransactionRequestValidationService: GetTransactionRequestValidationService;
	private readonly _getTransactionsEntityMapperService: GetTransactionsEntityMapperService;
	private readonly _getTransactionsByMonthAndYearDbService: GetTransactionsByMonthAndYearDbService;
	private readonly _getTransactionsResponseMapperService: GetTransactionsResponseMapperService;

	public constructor() {
		this._getUserIdFromRequestService = Container.get(UserTokenProviderService);
		this._isUserValidIntegrationPublishEventService = Container.get(
			IsUserValidIntegrationPublishEventService
		);
		this._GetTransactionRequestValidationService = Container.get(
			GetTransactionRequestValidationService
		);
		this._getTransactionsEntityMapperService = Container.get(
			GetTransactionsEntityMapperService
		);
		this._getTransactionsByMonthAndYearDbService = Container.get(
			GetTransactionsByMonthAndYearDbService
		);
		this._getTransactionsResponseMapperService = Container.get(
			GetTransactionsResponseMapperService
		);
	}

	public async handle(
		value: GetTransactionsQuery
	): Promise<DataResponse<GetTransactionResponseDto>> {
		const queryRunner = getQueryRunner();
		await queryRunner.connect();

		const response = await TransactionsWrapper.runDataResponseAsync({
			queryRunner: queryRunner,
			onTransaction: async () => {
				const { request, requestExpress } = value;

				// Guard
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
				await this.pipeline.step(
					pipelineSteps.GET_USER_ID_FROM_REQUEST_SERVICE,
					async () => {
						const result =
							await this._getUserIdFromRequestService.getUserId(requestExpress);
						if (!result)
							return ResultFactory.error(StatusCodes.UNAUTHORIZED, 'Unauthorized');
						return ResultFactory.success(result);
					}
				);

				// Is User Valid Pipeline Workflow
				await this.pipeline.step(pipelineSteps.IS_USER_VALID_SERVICE, async () => {
					const userIdentifierResult = this.pipeline.getResult<string>(
						pipelineSteps.GET_USER_ID_FROM_REQUEST_SERVICE
					);
					return await this._isUserValidIntegrationPublishEventService.handleAsync({
						identifier: userIdentifierResult,
						traceId: getTraceId(),
					});
				});

				// Validation Pipeline Workflow
				await this.pipeline.step(pipelineSteps.VALIDATION_SERVICE, async () => {
					return await this._GetTransactionRequestValidationService.handleAsync({
						dto: request,
						dtoClass: GetTransactionsRequestDto,
					});
				});

				// Map Entity Pipeline workflow
				await this.pipeline.step(pipelineSteps.MAP_ENTITY_SERVICE, async () => {
					const userIdentifierResult = this.pipeline.getResult<string>(
						pipelineSteps.GET_USER_ID_FROM_REQUEST_SERVICE
					);

					return await this._getTransactionsEntityMapperService.handleAsync({
						userId: userIdentifierResult,
						request: {
							month: request.month,
							year: request.year,
						},
					});
				});

				// Get Transactions Pipeline Workflow
				await this.pipeline.step(
					pipelineSteps.GET_TRANSACTIONS_BY_MONTH_AND_YEAR_SERVICE,
					async () => {
						const transactionsFilterResult =
							this.pipeline.getResult<GetTransactionsFilterDto>(
								pipelineSteps.MAP_ENTITY_SERVICE
							);

						return await this._getTransactionsByMonthAndYearDbService.handleAsync({
							queryRunner: queryRunner,
							request: transactionsFilterResult,
						});
					}
				);

				// Response Map Pipeline Workflow
				await this.pipeline.step(pipelineSteps.MAP_RESPONSE, async () => {
					const transactionsResult = this.pipeline.getResult<TransactionEntity[]>(
						pipelineSteps.GET_TRANSACTIONS_BY_MONTH_AND_YEAR_SERVICE
					);
					return await this._getTransactionsResponseMapperService.handleAsync(
						transactionsResult
					);
				});

				const response = this.pipeline.getResult<GetTransactionResponseDto[]>(
					pipelineSteps.MAP_RESPONSE
				);
				return DataResponseFactory.success(StatusCodes.OK, response);
			},
		});

		return response;
	}
}
// #endregion
