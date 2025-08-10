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
import { IsUserValidIntegrationPublishEventService } from '@/shared/services/users/isUserValidPublishEvent';
import { UserTokenProviderService } from '@/shared/services/users/userTokenProvider.service';
import { AddGoalDbService, getQueryRunner, GoalEntity } from '@kishornaik/db';
import { CreateGoalRequestDto, CreateGoalResponseDto } from '../contracts';
import { CreateGoalRequestEntityMapperService } from './services/mapEntity';
import { CreateGoalDbService } from './services/db';

// #region Command
@sealed
export class CreateGoalCommand extends RequestData<DataResponse<CreateGoalResponseDto>> {
	private readonly _requestExpress: Request;
	private readonly _request: CreateGoalRequestDto;

	public constructor(requestExpress: Request, request: CreateGoalRequestDto) {
		super();
		this._requestExpress = requestExpress;
		this._request = request;
	}

	public get request(): CreateGoalRequestDto {
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
	MAP_REQUEST_ENTITY = `mapRequestEntity`,
	SAVE_TRANSACTION = `saveTransaction`,
	MAP_RESPONSE = `mapResponse`,
}

// #endregion

// #region Command Handler
@sealed
@requestHandler(CreateGoalCommand)
export class CreateGoalCommandHandler
	implements RequestHandler<CreateGoalCommand, DataResponse<CreateGoalResponseDto>>
{
	private pipeline = new PipelineWorkflow(logger);
	private readonly _getUserIdFromRequestService: UserTokenProviderService;
	private readonly _isUserValidIntegrationPublishEventService: IsUserValidIntegrationPublishEventService;
	private readonly _createGoalRequestEntityMapperService: CreateGoalRequestEntityMapperService;
	private readonly _createGoalDbService: CreateGoalDbService;

	public constructor() {
		this._getUserIdFromRequestService = Container.get(UserTokenProviderService);
		this._isUserValidIntegrationPublishEventService = Container.get(
			IsUserValidIntegrationPublishEventService
		);
		this._createGoalRequestEntityMapperService = Container.get(
			CreateGoalRequestEntityMapperService
		);
		this._createGoalDbService = Container.get(CreateGoalDbService);
	}

	public async handle(value: CreateGoalCommand): Promise<DataResponse<CreateGoalResponseDto>> {
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

				// Get User identifier from the express request Object Pipeline workflow
				await this.pipeline.step(pipelineSteps.GET_USER_ID_FROM_REQUEST, async () => {
					const result =
						await this._getUserIdFromRequestService.getUserId(requestExpress);
					if (!result)
						return ResultFactory.error(StatusCodes.UNAUTHORIZED, 'Unauthorized');
					return ResultFactory.success(result);
				});

				// Is User Valid Pipeline workflow
				await this.pipeline.step(pipelineSteps.IS_USER_VALID, async () => {
					const userIdentifierResult = this.pipeline.getResult<string>(
						pipelineSteps.GET_USER_ID_FROM_REQUEST
					);
					return await this._isUserValidIntegrationPublishEventService.handleAsync({
						identifier: userIdentifierResult,
						traceId: getTraceId(),
					});
				});

				// Map Request Entity Pipeline workflow
				await this.pipeline.step(pipelineSteps.MAP_REQUEST_ENTITY, async () => {
					const userIdentifierResult = this.pipeline.getResult<string>(
						pipelineSteps.GET_USER_ID_FROM_REQUEST
					);
					return await this._createGoalRequestEntityMapperService.handleAsync({
						request: request,
						userId: userIdentifierResult,
					});
				});

				// Save Transaction Pipeline workflow
				await this.pipeline.step(pipelineSteps.SAVE_TRANSACTION, async () => {
					const entityResult = this.pipeline.getResult<GoalEntity>(
						pipelineSteps.MAP_REQUEST_ENTITY
					);
					return await this._createGoalDbService.handleAsync({
						entity: entityResult,
						queryRunner: queryRunner,
					});
				});

				// Map Response Pipeline workflow
				await this.pipeline.step<CreateGoalResponseDto>(
					pipelineSteps.MAP_RESPONSE,
					async () => {
						const entityResult = this.pipeline.getResult<GoalEntity>(
							pipelineSteps.MAP_REQUEST_ENTITY
						);
						if (!entityResult)
							return ResultFactory.error(StatusCodes.NOT_FOUND, `Goal not found`);
						const response = new CreateGoalResponseDto();
						response.identifier = entityResult.identifier;
						return ResultFactory.success(response);
					}
				);

				// return
				const response = this.pipeline.getResult<CreateGoalResponseDto>(
					pipelineSteps.MAP_RESPONSE
				);
				return DataResponseFactory.success(StatusCodes.CREATED, response);
			},
		});

		return response;
	}
}

// #endregion
