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
} from '@kishornaik/utils';
import { getTraceId, logger } from '@/shared/utils/helpers/loggers';
import { getQueryRunner } from '@kishornaik/db';
import { CreateUsersRequestDto, CreateUsersResponseDto } from '../contracts';
import { CreateUserValidationService } from './services/validations';
import {
	CreateUserGenerateHashAndSaltService,
	ICreateUserGenerateHashAndSaltServiceResult,
} from './services/generateHashSalt/indext';
import {
	CreateUserMapEntityService,
	ICreateUserMapEntityServiceResult,
} from './services/mapEntity';
import { CreateUserSaveService } from './services/db';
import {
	CreateUserGenerateJwtService,
	ICreateUserGenerateJwtServiceResult,
} from './services/generateJwt';
import { PublishUserSharedCacheDomainEventService } from '@/modules/users/shared/cache/events/publish/inde';
import { HttpException } from '@/shared/utils/exceptions/http';
import { TraceIdWrapper } from '@/shared/utils/helpers/traceId';

// #region Command
@sealed
export class CreateUserCommand extends RequestData<DataResponse<CreateUsersResponseDto>> {
	private readonly _request: CreateUsersRequestDto;
	private readonly _traceId: string;

	public constructor(request: CreateUsersRequestDto, traceId: string = null) {
		super();
		this._request = request;
		this._traceId = traceId;
	}

	public get request(): CreateUsersRequestDto {
		return this._request;
	}

	public get traceId(): string {
		return this._traceId;
	}
}
// #endregion

// #region Pipeline Steps
enum pipelineSteps {
	VALIDATE_REQUEST = `validateRequest`,
	GENERATE_HASH_AND_SALT = `generateHashAndSalt`,
	GENERATE_JWT_TOKEN = `generateJwtToken`,
	MAP_ENTITY = `mapEntity`,
	SAVE_ENTITY = `saveEntity`,
	MAP_RESPONSE = `mapResponse`,
}
// #endregion

// #region Command Handler
@sealed
@requestHandler(CreateUserCommand)
export class CreateUserCommandHandler
	implements RequestHandler<CreateUserCommand, DataResponse<CreateUsersResponseDto>>
{
	private pipeline: PipelineWorkflow = new PipelineWorkflow(logger);
	private readonly _createUserValidationService: CreateUserValidationService;
	private readonly _createUserGenerateHashAndSaltService: CreateUserGenerateHashAndSaltService;
	private readonly _createUserMapEntityService: CreateUserMapEntityService;
	private readonly _createUserSaveService: CreateUserSaveService;
	private readonly _createUserGenerateJwtService: CreateUserGenerateJwtService;
	private readonly _publishUserSharedCacheDomainEventService: PublishUserSharedCacheDomainEventService;

	public constructor() {
		this._createUserValidationService = Container.get(CreateUserValidationService);
		this._createUserGenerateHashAndSaltService = Container.get(
			CreateUserGenerateHashAndSaltService
		);
		this._createUserMapEntityService = Container.get(CreateUserMapEntityService);
		this._createUserSaveService = Container.get(CreateUserSaveService);
		this._createUserGenerateJwtService = Container.get(CreateUserGenerateJwtService);
		this._publishUserSharedCacheDomainEventService = Container.get(
			PublishUserSharedCacheDomainEventService
		);
	}

	public async handle(value: CreateUserCommand): Promise<DataResponse<CreateUsersResponseDto>> {
		const queryRunner = getQueryRunner();
		await queryRunner.connect();

		// Set TraceId
		TraceIdWrapper.setTraceId(value.traceId);

		// Transaction Workflow
		const response = await TransactionsWrapper.runDataResponseAsync({
			queryRunner: queryRunner,
			onTransaction: async () => {
				const { request } = value;

				logger.info(`Test`);

				// Validation
				await this.pipeline.step(pipelineSteps.VALIDATE_REQUEST, async () => {
					return this._createUserValidationService.handleAsync({
						dto: request,
						dtoClass: CreateUsersRequestDto,
					});
				});

				// Generate Hash and Salt
				await this.pipeline.step(pipelineSteps.GENERATE_HASH_AND_SALT, async () => {
					return this._createUserGenerateHashAndSaltService.handleAsync({
						password: request.password,
					});
				});

				// Map Entity
				await this.pipeline.step(pipelineSteps.MAP_ENTITY, async () => {
					const getPasswordHashAndSaltResult =
						this.pipeline.getResult<ICreateUserGenerateHashAndSaltServiceResult>(
							pipelineSteps.GENERATE_HASH_AND_SALT
						);
					return this._createUserMapEntityService.handleAsync({
						request,
						password: {
							hash: getPasswordHashAndSaltResult.hash,
							salt: getPasswordHashAndSaltResult.salt,
						},
					});
				});

				// Save Entity
				await this.pipeline.step(pipelineSteps.SAVE_ENTITY, async () => {
					const mapEntityResult =
						this.pipeline.getResult<ICreateUserMapEntityServiceResult>(
							pipelineSteps.MAP_ENTITY
						);
					var result = await this._createUserSaveService.handleAsync({
						user: mapEntityResult.user,
						credentials: mapEntityResult.credentials,
						queryRunner: queryRunner,
					});
					if (result.isErr()) {
						if (
							result.error.message.includes(
								`duplicate key value violates unique constraint`
							)
						)
							return ResultFactory.error(
								StatusCodes.CONFLICT,
								`User with email ${mapEntityResult.user.email} already exists`
							);

						return ResultFactory.error(result.error.statusCode, result.error.message);
					}
					return result;
				});

				// Generate JWT Token
				await this.pipeline.step(pipelineSteps.GENERATE_JWT_TOKEN, async () => {
					const mapEntityResult =
						this.pipeline.getResult<ICreateUserMapEntityServiceResult>(
							pipelineSteps.MAP_ENTITY
						);
					return this._createUserGenerateJwtService.handleAsync({
						identifier: mapEntityResult.user.identifier,
					});
				});

				// Map Response
				await this.pipeline.step(pipelineSteps.MAP_RESPONSE, async () => {
					const generateJwtTokenResult =
						this.pipeline.getResult<ICreateUserGenerateJwtServiceResult>(
							pipelineSteps.GENERATE_JWT_TOKEN
						);
					return ResultFactory.success(generateJwtTokenResult.token);
				});

				// Return
				const jwtToken: string = this.pipeline.getResult<string>(
					pipelineSteps.MAP_RESPONSE
				);
				const response: CreateUsersResponseDto = new CreateUsersResponseDto();
				response.jwtToken = jwtToken;

				return DataResponseFactory.success<CreateUsersResponseDto>(
					StatusCodes.CREATED,
					response
				);
			},
		});

		if (response.success) {
			// Cache Workflow
			FireAndForgetWrapper.JobAsync({
				onRun: async () => {
					const mapEntityResult =
						this.pipeline.getResult<ICreateUserMapEntityServiceResult>(
							pipelineSteps.MAP_ENTITY
						);

					const traceId: string = value.traceId;

					const result = await this._publishUserSharedCacheDomainEventService.handleAsync(
						{
							identifier: mapEntityResult.user.identifier,
							status: mapEntityResult.user.status,
							traceId: traceId,
						}
					);
					if (result.isErr())
						throw new HttpException(result.error.statusCode, result.error.message);
				},
				onError: (err) => {
					logger.error(
						`User Shared Cache Event Failed: traceId: ${getTraceId()} | error: ${err.message}`
					);
				},
				onCleanup: async () => {
					this.pipeline = null;
				},
			});
		}

		return response;
	}
}

// #endregion
