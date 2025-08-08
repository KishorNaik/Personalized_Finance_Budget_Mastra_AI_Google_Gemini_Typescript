import { logger } from '@/shared/utils/helpers/loggers';
import { TraceIdWrapper } from '@/shared/utils/helpers/traceId';
import {
	bullMqRedisConnection,
	GuardWrapper,
	JsonString,
	mediator,
	ReplyMessageBullMq,
	RequestReplyConsumerBullMq,
	sealed,
	Service,
	StatusCodes,
	WorkerBullMq,
} from '@kishornaik/utils';
import { GetUserByEmailIdRequestDto, GetUserByEmailIdResponseDto } from '../contracts';
import { GetUserByEmailIdQuery } from '../query';

const queueName = 'get-user-by-email-integration-event-queue';
const consumer = new RequestReplyConsumerBullMq(bullMqRedisConnection);

export const subscribeGetUserByEmailIdIntegrationEvent: WorkerBullMq = async () => {
	logger.info(`Get User By Email Id Subscribe Worker Starting...`);
	const worker = await consumer.startConsumingAsync<JsonString, JsonString>(
		queueName,
		async (reply) => {
			const { data, correlationId, timestamp, traceId } = reply.data;

			// Guard Clause
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
				`Get User By Email Id Event Job started: correlationId: ${correlationId} | jobId: ${reply.id}`
			);

			//Payload
			const payload: GetUserByEmailIdRequestDto = JSON.parse(data);

			// Get Query
			const result = await mediator.send(new GetUserByEmailIdQuery(payload, traceId));
			if (!result.success) {
				return {
					success: false,
					correlationId: correlationId,
					statusCode: result.statusCode,
					traceId: traceId,
					error: result.message,
					message: null,
					data: null,
					timestamp: new Date().toISOString(),
				};
			}

			// Return Message to the Producer
			const message: ReplyMessageBullMq<JsonString> = {
				success: true,
				correlationId: correlationId,
				data: JSON.stringify(result.data) as JsonString,
				message: `Get User By Email Id Event Job completed: correlationId: ${correlationId} | jobId: ${reply.id}`,
				statusCode: StatusCodes.OK,
				error: null,
				traceId: traceId,
				timestamp: new Date().toISOString(),
			};

			return message;
		}
	);

	worker.on('completed', (job) => {
		logger.info(
			`Get User By Email Id Integration Event Completed: traceId: ${job.data.traceId} | correlationId: ${job.data.correlationId} | jobId: ${job.id}`
		);
	});

	worker.on('failed', (job, err) => {
		logger.error(
			`Get User By Email Id Integration Event Failed: traceId: ${job.data.traceId} | correlationId: ${job.data.correlationId} | jobId: ${job.id} | error: ${err.message}`
		);
	});
};
