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
import { GetUserByIdentifierRequestDto, GetUserByIdentifierResponseDto } from '../contracts';
import { GetUserByIdentifierRequestValidationService } from './services/validations';
import { getQueryRunner, UserEntity } from '@kishornaik/db';
import { GetUserByIdentifierCacheService } from '@/modules/users/shared/cache/set/services/byIdentifier';
import { NODE_ENV } from '@/config/env';
import { GetUserByIdentifierResponseMapperService } from './services/mapResponse';
import { TraceIdWrapper } from '@/shared/utils/helpers/traceId';

// #region Query
@sealed
export class GetUserByIdentifierQuery extends RequestData<
	DataResponse<GetUserByIdentifierResponseDto>
> {
	private readonly _request: GetUserByIdentifierRequestDto;
	private readonly _traceId: string = null;
	public constructor(request: GetUserByIdentifierRequestDto, traceId?: string) {
		super();
		this._request = request;
		this._traceId = traceId;
	}

	public get request(): GetUserByIdentifierRequestDto {
		return this._request;
	}

	public get traceId(): string {
		return this._traceId;
	}
}
// #endregion

// #region Pipeline Steps
enum pipelineSteps {
	validationService = `validationService`,
	getUserDataByIdentifier = `getUserDataByIdentifier`,
	mapResponse = `mapResponse`,
}

//#endregion

// #region Query Handler
@sealed
@requestHandler(GetUserByIdentifierQuery)
export class GetUserByIdentifierQueryHandler
	implements
		RequestHandler<GetUserByIdentifierQuery, DataResponse<GetUserByIdentifierResponseDto>>
{
	private pipeline = new PipelineWorkflow(logger);
	private readonly _getUserByIdentifierRequestValidationService: GetUserByIdentifierRequestValidationService;
	private readonly _getUserByIdentifierCacheService: GetUserByIdentifierCacheService;
	private readonly _getUserByIdentifierResponseMapperService = Container.get(
		GetUserByIdentifierResponseMapperService
	);

	public constructor() {
		this._getUserByIdentifierRequestValidationService = Container.get(
			GetUserByIdentifierRequestValidationService
		);
		this._getUserByIdentifierCacheService = Container.get(GetUserByIdentifierCacheService);
		this._getUserByIdentifierResponseMapperService = Container.get(
			GetUserByIdentifierResponseMapperService
		);
	}

	public async handle(
		value: GetUserByIdentifierQuery
	): Promise<DataResponse<GetUserByIdentifierResponseDto>> {
		const queryRunner = await getQueryRunner();
		await queryRunner.connect();

		if (value?.traceId) TraceIdWrapper.setTraceId(value.traceId);

		return await TransactionsWrapper.runDataResponseAsync({
			queryRunner: queryRunner,
			onTransaction: async () => {
				const { request } = value;

				// Guard
				const guardResult = new GuardWrapper().check(request, 'request').validate();
				if (guardResult.isErr())
					return DataResponseFactory.error(
						guardResult.error.statusCode,
						guardResult.error.message
					);

				// Validation Service Pipeline
				await this.pipeline.step(pipelineSteps.validationService, async () => {
					return await this._getUserByIdentifierRequestValidationService.handleAsync({
						dto: request,
						dtoClass: GetUserByIdentifierRequestDto,
					});
				});

				// Get User Data By Email Id from Cache
				await this.pipeline.step(pipelineSteps.getUserDataByIdentifier, async () => {
					return await this._getUserByIdentifierCacheService.handleAsync({
						env: String(NODE_ENV),
						key: `user-identifier-${request.identifier}`,
						setParams: {
							identifier: request.identifier,
							status: StatusEnum.ACTIVE,
							queryRunner: queryRunner,
						},
					});
				});

				// Map Response
				await this.pipeline.step(pipelineSteps.mapResponse, async () => {
					const getUserDataByIdentifierResult = this.pipeline.getResult<UserEntity>(
						pipelineSteps.getUserDataByIdentifier
					);
					return await this._getUserByIdentifierResponseMapperService.handleAsync(
						getUserDataByIdentifierResult
					);
				});

				const response = this.pipeline.getResult<GetUserByIdentifierResponseDto>(
					pipelineSteps.mapResponse
				);

				// return
				return DataResponseFactory.success(StatusCodes.OK, response);
			},
		});
	}
}
//#endregion
