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
	ExceptionsWrapper,
	CleanUpWrapper,
	RoleEnum,
} from '@kishornaik/utils';
import { SignUpResponseDto } from '../../sign-up';
import { SignInRequestDto, SignInResponseDto } from '../contracts';
import { logger } from '@/shared/utils/helpers/loggers';
import {
	IPublishGetUserByEmailIdIntegrationEventServiceResult,
	PublishGetUserByEmailIdIntegrationEventService,
} from './services/getUserByEmailId';
import { ValidateCredentialsService } from './services/validateCredentails';
import { JwtService } from '@/shared/services/users/userJwt.Service';
import { SignInMapResponseService } from './services/mapResponse';

// #region Command
@sealed
export class SignInCommand extends RequestData<DataResponse<SignInResponseDto>> {
	private readonly _request: SignInRequestDto;

	public constructor(request: SignInRequestDto) {
		super();
		this._request = request;
	}

	public get request(): SignInRequestDto {
		return this._request;
	}
}
// #endregion

// #region Pipeline Steps
enum pipelineSteps {
	GetUserByEmailIdService = `getUserByEmailIdService`,
	ValidateCredentialsService = `validateCredentialsService`,
	GenerateJwtToken = `GenerateJwtToken`,
	MapResponse = `MapResponse`,
}
//#endregion

// #region Command Handler
@sealed
@requestHandler(SignInCommand)
export class SignInCommandHandler
	implements RequestHandler<SignInCommand, DataResponse<SignInResponseDto>>
{
	private pipeline = new PipelineWorkflow(logger);
	private readonly _publishGetUserByEmailIdIntegrationEventService: PublishGetUserByEmailIdIntegrationEventService;
	private readonly _validateCredentialsService: ValidateCredentialsService;
	private readonly _generateJwtTokenService: JwtService;
	private readonly _signInMapResponseService: SignInMapResponseService;

	public constructor() {
		this._publishGetUserByEmailIdIntegrationEventService = Container.get(
			PublishGetUserByEmailIdIntegrationEventService
		);
		this._validateCredentialsService = Container.get(ValidateCredentialsService);
		this._generateJwtTokenService = Container.get(JwtService);
		this._signInMapResponseService = Container.get(SignInMapResponseService);
	}

	public async handle(value: SignInCommand): Promise<DataResponse<SignInResponseDto>> {
		return await ExceptionsWrapper.tryCatchPipelineAsync(async () => {
			const { request } = value;

			// Guard
			const guardResult = new GuardWrapper().check(request, 'request').validate();
			if (guardResult.isErr())
				return DataResponseFactory.error(
					guardResult.error.statusCode,
					guardResult.error.message
				);

			// Get SignIn Response
			await this.pipeline.step(pipelineSteps.GetUserByEmailIdService, async () => {
				const result =
					await this._publishGetUserByEmailIdIntegrationEventService.handleAsync({
						emailId: request.userName,
					});
				if (result.isErr()) {
					if (result.error.statusCode === StatusCodes.NOT_FOUND) {
						return ResultFactory.error(
							StatusCodes.UNAUTHORIZED,
							`User name and password do not match`
						);
					}
					return ResultFactory.error(result.error.statusCode, result.error.message);
				}
				return result;
			});

			// Validate Credentials
			await this.pipeline.step(pipelineSteps.ValidateCredentialsService, async () => {
				const getUserResult =
					this.pipeline.getResult<IPublishGetUserByEmailIdIntegrationEventServiceResult>(
						pipelineSteps.GetUserByEmailIdService
					);
				const credentials = getUserResult.credentials;

				return await this._validateCredentialsService.handleAsync({
					password: request.password,
					credentials: {
						hash: credentials.hash,
						salt: credentials.salt,
					},
				});
			});

			// Generate Jwt Token
			await this.pipeline.step(pipelineSteps.GenerateJwtToken, async () => {
				const getUserResult =
					this.pipeline.getResult<IPublishGetUserByEmailIdIntegrationEventServiceResult>(
						pipelineSteps.GetUserByEmailIdService
					);

				const jwtToken: string = await this._generateJwtTokenService.generateTokenAsync({
					id: getUserResult.identifier,
					role: RoleEnum.USER,
				});
				if (!jwtToken)
					return ResultFactory.error<string>(
						StatusCodes.UNAUTHORIZED,
						`user name and password do not match`
					);

				return ResultFactory.success<string>(jwtToken);
			});

			// Return SignIn Response
			await this.pipeline.step(pipelineSteps.MapResponse, async () => {
				const jwtTokenResult = this.pipeline.getResult<string>(
					pipelineSteps.GenerateJwtToken
				);
				const getUserResult =
					this.pipeline.getResult<IPublishGetUserByEmailIdIntegrationEventServiceResult>(
						pipelineSteps.GetUserByEmailIdService
					);

				return await this._signInMapResponseService.handleAsync({
					email: getUserResult.email,
					firstName: getUserResult.firstName,
					lastName: getUserResult.lastName,
					jwtToken: jwtTokenResult,
				});
			});

			const response = this.pipeline.getResult<SignInResponseDto>(pipelineSteps.MapResponse);
			return DataResponseFactory.success(StatusCodes.OK, response);
		});
	}
}
// #endregion
