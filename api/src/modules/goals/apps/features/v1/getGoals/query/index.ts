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
import { GetGoalDbService, getQueryRunner, GoalEntity } from '@kishornaik/db';
import { UserTokenProviderService } from '@/shared/services/users/userTokenProvider.service';
import { IsUserValidIntegrationPublishEventService } from '@/shared/services/users/isUserValidPublishEvent';
import { GetGoalsRequestDto, GetGoalsResponseDto } from '../contracts';
import { GetGoalsRequestEntityMapperService } from './services/mapEntity';
import { GetGoalsRequestValidationService } from './services/validations';
import { GetGoalsResponseMapperService } from './services/mapResponse';

Container.set<GetGoalDbService>(GetGoalDbService, new GetGoalDbService());

// #region Query
@sealed
export class GetGoalsQuery extends RequestData<DataResponse<GetGoalsResponseDto[]>> {
	private readonly _requestExpress: Request;
	private readonly _request: GetGoalsRequestDto;
	public constructor(requestExpress: Request, request: GetGoalsRequestDto) {
		super();
		this._requestExpress = requestExpress;
		this._request = request;
	}

	public get requestExpress(): Request {
		return this._requestExpress;
	}
	public get request(): GetGoalsRequestDto {
		return this._request;
	}
}
// #endregion

// #region Pipeline Steps
enum pipelineSteps {
	GET_USER_ID_FROM_REQUEST_SERVICE = `getUserIdFromRequestService`,
	IS_USER_VALID_SERVICE = `isUserValidService`,
	VALIDATION_SERVICE = `validationService`,
	MAP_ENTITY_SERVICE = `mapEntityService`,
	GET_GOALS_BY_MONTH_AND_YEAR_SERVICE = `getGoalsByMonthAndYearService`,
	MAP_RESPONSE = `mapResponse`,
}

// #endregion

// #region Query Handler
@sealed
@requestHandler(GetGoalsQuery)
export class GetGoalsQueryHandler
	implements RequestHandler<GetGoalsQuery, DataResponse<GetGoalsResponseDto[]>>
{
	private readonly pipeline = new PipelineWorkflow(logger);

	private readonly _getUserIdFromRequestService: UserTokenProviderService;
	private readonly _isUserValidIntegrationPublishEventService: IsUserValidIntegrationPublishEventService;
	private readonly _getGoalsRequestValidationService: GetGoalsRequestValidationService;
	private readonly _getGoalsRequestEntityMapperService: GetGoalsRequestEntityMapperService;
	private readonly _getGoalsDbService: GetGoalDbService;
	private readonly _getGoalsResponseMapperService: GetGoalsResponseMapperService;

	public constructor() {
		this._getUserIdFromRequestService = Container.get(UserTokenProviderService);
		this._isUserValidIntegrationPublishEventService = Container.get(
			IsUserValidIntegrationPublishEventService
		);
		this._getGoalsRequestValidationService = Container.get(GetGoalsRequestValidationService);
		this._getGoalsRequestEntityMapperService = Container.get(
			GetGoalsRequestEntityMapperService
		);
		this._getGoalsDbService = Container.get(GetGoalDbService);
		this._getGoalsResponseMapperService = Container.get(GetGoalsResponseMapperService);
	}

	public async handle(value: GetGoalsQuery): Promise<DataResponse<GetGoalsResponseDto[]>> {
		const queryRunner = getQueryRunner();
		await queryRunner.connect();

		const response = await TransactionsWrapper.runDataResponseAsync<GetGoalsResponseDto[]>({
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

				// Validation Service Pipeline Workflow
				await this.pipeline.step(pipelineSteps.VALIDATION_SERVICE, async () => {
					return await this._getGoalsRequestValidationService.handleAsync({
						dto: request,
						dtoClass: GetGoalsRequestDto,
					});
				});

				// Request To Entity Mapper Service Pipeline Workflow
				await this.pipeline.step(pipelineSteps.MAP_ENTITY_SERVICE, async () => {
					const userIdentifierResult = this.pipeline.getResult<string>(
						pipelineSteps.GET_USER_ID_FROM_REQUEST_SERVICE
					);
					return await this._getGoalsRequestEntityMapperService.handleAsync({
						request: request,
						userId: userIdentifierResult,
					});
				});

				// Get Goals by MOnth and Year
				await this.pipeline.step(
					pipelineSteps.GET_GOALS_BY_MONTH_AND_YEAR_SERVICE,
					async () => {
						const entityResult = this.pipeline.getResult<GetGoalsRequestDto>(
							pipelineSteps.MAP_ENTITY_SERVICE
						);
						return await this._getGoalsDbService.handleAsync({
							queryRunner: queryRunner,
							request: entityResult,
						});
					}
				);

				// Map Response
				await this.pipeline.step(pipelineSteps.MAP_RESPONSE, async () => {
					const goalsResult = this.pipeline.getResult<GoalEntity[]>(
						pipelineSteps.GET_GOALS_BY_MONTH_AND_YEAR_SERVICE
					);
					return await this._getGoalsResponseMapperService.handleAsync(goalsResult);
				});

				// Return
				const response = this.pipeline.getResult<GetGoalsResponseDto[]>(
					pipelineSteps.MAP_RESPONSE
				);
				return DataResponseFactory.success(StatusCodes.OK, response);
			},
		});

		return response;
	}
}
// #endregion
