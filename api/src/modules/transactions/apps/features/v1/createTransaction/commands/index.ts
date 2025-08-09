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
import { CreateTransactionResponseDto } from '../contracts';

// #region Command
@sealed
export class CreateTransactionCommand extends RequestData<
	DataResponse<CreateTransactionResponseDto>
> {}
// #endregion

// #region Pipeline Steps
enum pipelineSteps {
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
	public async handle(
		value: CreateTransactionCommand
	): Promise<DataResponse<CreateTransactionResponseDto>> {
		const queryRunner = getQueryRunner();
		await queryRunner.connect();

		throw new Error('Not implemented');
	}
}
// #endregion
