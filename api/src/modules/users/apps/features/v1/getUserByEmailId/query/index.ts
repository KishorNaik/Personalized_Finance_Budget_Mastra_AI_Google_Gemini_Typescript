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
	TransactionsWrapper,
	GuardWrapper,
	ResultFactory,
	ExceptionsWrapper,
	AesResponseDto,
	IAesEncryptResult,
	StatusEnum,
	CleanUpWrapper,
} from '@kishornaik/utils';
import { logger } from '@/shared/utils/helpers/loggers';
import { GetUserByEmailIdRequestDto, GetUserByEmailIdResponseDto } from '../contracts';
import { GetUserByEmailIdCacheService } from '@/modules/users/shared/cache/set/services/byEmail';
import { getQueryRunner, UserEntity } from '@kishornaik/db';
import { GetUserDataByEmailIdValidationService } from './services/validations';
import { NODE_ENV } from '@/config/env';
import { GetUserByEmailIdService } from './services/byEmailId';
import { TraceIdWrapper } from '@/shared/utils/helpers/traceId';
import { GetUserByEmailIdMapResponseService } from './services/mapResponse';

// #region Query
@sealed
export class GetUserByEmailIdQuery extends RequestData<DataResponse<GetUserByEmailIdResponseDto>> {
	private readonly _request: GetUserByEmailIdRequestDto;
	private readonly _traceId: string;
	public constructor(request: GetUserByEmailIdRequestDto, traceId: string = null) {
		super();
		this._request = request;
		this._traceId = traceId;
	}

	public get request(): GetUserByEmailIdRequestDto {
		return this._request;
	}
	public get traceId(): string {
		return this._traceId;
	}
}
// #endregion

// region Pipeline Steps
enum pipelineSteps {
	validationService = `validationService`,
	getUserDataByEmailId = `getUserDataByEmailId`,
	mapResponse = `mapResponse`,
}
// endregion

// #region Query Handler
@sealed
@requestHandler(GetUserByEmailIdQuery)
export class GetUserByEmailIdQueryHandler
	implements RequestHandler<GetUserByEmailIdQuery, DataResponse<GetUserByEmailIdResponseDto>>
{
	private pipeline = new PipelineWorkflow(logger);
	private readonly _getUserDataByEmailIdValidationService: GetUserDataByEmailIdValidationService;
	private readonly _GetUserByEmailIdService: GetUserByEmailIdService;
	private readonly _getUserByEmailIdMapResponseService: GetUserByEmailIdMapResponseService;

	public constructor() {
		this._getUserDataByEmailIdValidationService = Container.get(
			GetUserDataByEmailIdValidationService
		);
		this._GetUserByEmailIdService = Container.get(GetUserByEmailIdService);
		this._getUserByEmailIdMapResponseService = Container.get(
			GetUserByEmailIdMapResponseService
		);
	}

	public async handle(
		value: GetUserByEmailIdQuery
	): Promise<DataResponse<GetUserByEmailIdResponseDto>> {
		const queryRunner = await getQueryRunner();
		await queryRunner.connect();

		return await TransactionsWrapper.runDataResponseAsync({
			queryRunner: queryRunner,
			onTransaction: async () => {
				const { request, traceId } = value;

				TraceIdWrapper.setTraceId(value.traceId);

				// Guard
				const guardResult = new GuardWrapper()
					.check(request, 'request')
					.check(traceId, 'traceId')
					.validate();
				if (guardResult.isErr())
					return DataResponseFactory.error(
						guardResult.error.statusCode,
						guardResult.error.message
					);

				// Validation Pipeline Workflow service
				await this.pipeline.step(pipelineSteps.validationService, async () => {
					return await this._getUserDataByEmailIdValidationService.handleAsync({
						dto: request,
						dtoClass: GetUserByEmailIdRequestDto,
					});
				});

				// Get User Data By Email Id from Cache
				await this.pipeline.step(pipelineSteps.getUserDataByEmailId, async () => {
					return await this._GetUserByEmailIdService.handleAsync({
						emailId: request.emailId,
						queryRunner: queryRunner,
						key: `user-email-${request.emailId}`,
					});
				});

				// Map Response
				await this.pipeline.step(pipelineSteps.mapResponse, async () => {
					// Get User Data
					const userResult = this.pipeline.getResult<UserEntity>(
						pipelineSteps.getUserDataByEmailId
					);
					return await this._getUserByEmailIdMapResponseService.handleAsync(userResult);
				});

				const response = this.pipeline.getResult<GetUserByEmailIdResponseDto>(
					pipelineSteps.mapResponse
				);
				return DataResponseFactory.success(StatusCodes.OK, response);
			},
		});
	}
}

// #endregion
