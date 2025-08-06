import { logger } from '@/shared/utils/helpers/loggers';
import { getQueryRunner } from '@kishornaik/db';
import {
	bullMqRedisConnection,
	Container,
	JsonString,
	SenderReceiverConsumerBullMq,
	StatusEnum,
	TransactionsWrapper,
	WorkerBullMq,
} from '@kishornaik/utils';
import { UserSharedCacheService } from '../../set';
import { TraceIdWrapper } from '@/shared/utils/helpers/traceId';

const queueName = 'user-shared-cache-event-queue';
const consumer = new SenderReceiverConsumerBullMq(bullMqRedisConnection);

export const subscribeUserSharedCacheDomainEvent: WorkerBullMq = async () => {
	logger.info(`User Shared Cache Subscribe Worker Starting...`);

	const worker = await consumer.startConsumingAsync<JsonString>(queueName, async (message) => {
		const { data, correlationId, timestamp, traceId } = message.data;

    // Set TraceId
    TraceIdWrapper.setTraceId(traceId);

		logger.info(
			`User Shared Cache Event Job started: traceId: ${traceId} | correlationId: ${correlationId} | jobId: ${message.id}`
		);

		// Payload
		const payload: { identifier: string; status: StatusEnum } = JSON.parse(data);

		// Call Cache Service
		const userSharedCacheService = Container.get(UserSharedCacheService);
		await userSharedCacheService.handleAsync({
			identifier: payload.identifier,
			status: payload.status,
		});
	});

	worker.on('completed', (job) => {
		logger.info(
			`User Shared Cache Event Completed: traceId: ${job.data.traceId} | correlationId: ${job.data.correlationId} | jobId: ${job.id}`
		);
	});

	worker.on('failed', (job, err) => {
		logger.error(
			`User Shared Cache Event Failed: traceId: ${job.data.traceId} | correlationId: ${job.data.correlationId} | jobId: ${job.id} | error: ${err.message}`
		);
	});
};
