import { logger } from '@/shared/utils/helpers/loggers';
import { TraceIdWrapper } from '@/shared/utils/helpers/traceId';
import {
	BoolEnum,
	bullMqRedisConnection,
	ConvertersWrapper,
	GuardWrapper,
	JsonString,
	mediator,
	ReplyMessageBullMq,
	RequestReplyConsumerBullMq,
	sealed,
	Service,
	StatusCodes,
	StatusEnum,
	WorkerBullMq,
} from '@kishornaik/utils';
import { IsUserValidRequestDto, IsUserValidResponseDto } from '../contracts';
import {
	GetUserByIdentifierQuery,
	GetUserByIdentifierRequestDto,
	GetUserByIdentifierResponseDto,
} from '../../getUserByIdentifier';

const queueName = 'is-user-valid-integration-event-queue';
const consumer = new RequestReplyConsumerBullMq(bullMqRedisConnection);

export const subscribeIsUserValidIntegrationEvent: WorkerBullMq = async () => {
	logger.info(`Is User Valid Subscribe Worker Starting...`);

	const worker = await consumer.startConsumingAsync<JsonString, JsonString>(
		queueName,
		async (reply) => {
			const { data, correlationId, timestamp, traceId } = reply.data;

			// Guard
			const guardResult = new GuardWrapper()
				.check(reply, 'reply')
				.check(data, 'data')
				.check(correlationId, 'correlationId')
				.check(timestamp, 'timestamp')
				.check(traceId, 'traceId')
				.validate();
			if (guardResult.isErr())
				return {
					success: false,
					correlationId: correlationId,
					statusCode: StatusCodes.BAD_REQUEST,
					traceId: traceId,
					error: guardResult.error.message,
					message: null,
					data: null,
					timestamp: new Date().toISOString(),
				};

			// Set TraceId
			TraceIdWrapper.setTraceId(traceId);

			logger.info(
				`Is User Valid Event Job started: correlationId: ${correlationId} | jobId: ${reply.id}`
			);

			// Payload
			const payload: IsUserValidRequestDto = JSON.parse(data);

			// Get Query
			const request = new GetUserByIdentifierRequestDto();
			request.identifier = payload.identifier;
			const query = new GetUserByIdentifierQuery(request, traceId);
			const response = await mediator.send(query);
			if (!response.success)
				return {
					success: false,
					correlationId: correlationId,
					statusCode: response.statusCode,
					traceId: traceId,
					error: response.message,
					message: null,
					data: null,
					timestamp: new Date().toISOString(),
				};

			const result: GetUserByIdentifierResponseDto = response.data;
			if (!result)
				return {
					success: false,
					correlationId: correlationId,
					statusCode: StatusCodes.NOT_FOUND,
					traceId: traceId,
					error: 'User Not Found',
					message: null,
					data: null,
					timestamp: new Date().toISOString(),
				};

			// Check User Status
			const userStatus: BoolEnum = ConvertersWrapper.statusEnumToBoolEnum(result.status);
			if (userStatus === BoolEnum.NO)
				return {
					success: false,
					correlationId: correlationId,
					statusCode: StatusCodes.UNAUTHORIZED,
					traceId: traceId,
					error: 'User Not Active',
					message: null,
					data: null,
					timestamp: new Date().toISOString(),
				};

			// Map Response
			const mapResponse: IsUserValidResponseDto = {
				identifier: payload.identifier,
				isValid: userStatus,
			};

			// Return Message to the Producer
			const message: ReplyMessageBullMq<JsonString> = {
				success: true,
				correlationId: correlationId,
				data: JSON.stringify(mapResponse) as JsonString,
				message: `Is User Valid Job completed: correlationId: ${correlationId} | jobId: ${reply.id}`,
				statusCode: StatusCodes.OK,
				error: null,
				traceId: traceId,
				timestamp: new Date().toISOString(),
			};

			return message;
		}
	);
};
