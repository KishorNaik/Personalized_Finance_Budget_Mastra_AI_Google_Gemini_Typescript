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
} from '@kishornaik/utils';
import { getTraceId, logger } from '@/shared/utils/helpers/loggers';
import { SignUpRequestDto, SignUpResponseDto } from '../contracts';
import { PublishCreateUserIntegrationEventService } from './services/publishCreateUserIntegrationEvent';

//  #region Command
export class SignUpCommand extends RequestData<DataResponse<SignUpResponseDto>> {
	private _request: SignUpRequestDto;
	public constructor(request: SignUpRequestDto) {
		super();
		this._request = request;
	}

	public get request(): SignUpRequestDto {
		return this._request;
	}
}
// #endregion
enum pipelineSteps {
	publishUsrCreateIntegrationEvent = `publishUsrCreateIntegrationEvent`,
}
// #region Pipeline Steps

//#endregion

// #region Command Handler
@sealed
@requestHandler(SignUpCommand)
export class SignUpCommandHandler
	implements RequestHandler<SignUpCommand, DataResponse<SignUpResponseDto>>
{
	private pipeline = new PipelineWorkflow(logger);
	private readonly _publishCreateUserIntegrationEventService: PublishCreateUserIntegrationEventService;

	public constructor() {
		this._publishCreateUserIntegrationEventService = Container.get(
			PublishCreateUserIntegrationEventService
		);
	}

	public async handle(value: SignUpCommand): Promise<DataResponse<SignUpResponseDto>> {
		const response = await ExceptionsWrapper.tryCatchPipelineAsync(async () => {
			// Guard
			const guardResult = new GuardWrapper().check(value.request, 'request').validate();
			if (guardResult.isErr())
				return DataResponseFactory.error(
					guardResult.error.statusCode,
					guardResult.error.message
				);

			// Publish User Create Integration Event Pipeline
			await this.pipeline.step(pipelineSteps.publishUsrCreateIntegrationEvent, async () => {
				return await this._publishCreateUserIntegrationEventService.handleAsync(
					value.request
				);
			});

			// Get SignUp Response
			const response: SignUpResponseDto = this.pipeline.getResult<SignUpResponseDto>(
				pipelineSteps.publishUsrCreateIntegrationEvent
			);
			return DataResponseFactory.success(StatusCodes.CREATED, response);
		});

		return response;
	}
}

// #endregion
