import { logger } from '@/shared/utils/helpers/loggers';
import {
  bullMqRedisConnection,
  Container,
  GuardWrapper,
  JsonString,
  ReplyMessageBullMq,
  RequestReplyConsumerBullMq,
  SenderReceiverConsumerBullMq,
  StatusCodes,
  StatusEnum,
  TransactionsWrapper,
  WorkerBullMq,
} from '@kishornaik/utils';
import { TraceIdWrapper } from '@/shared/utils/helpers/traceId';
import { CreateUsersRequestDto } from '../contracts';
import { mediator } from '@/shared/utils/helpers/medaitR';
import { CreateUserCommand } from '../commands';

const queueName = 'user-create-integration-event-queue';
const consumer = new RequestReplyConsumerBullMq(bullMqRedisConnection);

export const subscribeUserCreatedIntegrationEvent: WorkerBullMq = async () => {
  logger.info(`User Create Subscribe Worker Starting...`);

  const worker = await consumer.startConsumingAsync<JsonString,JsonString>(queueName, async (reply) => {
    const { data, correlationId, timestamp, traceId } = reply.data;

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
      `User Shared Cache Event Job started: correlationId: ${correlationId} | jobId: ${reply.id}`
    );

    // Payload
    const payload: CreateUsersRequestDto= JSON.parse(data);

    // Create User Command
    const response=await mediator.send(new CreateUserCommand(payload, traceId));
    if(!response.success)
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

    // Return to the Producer (Generate Reply Message)
			const message: ReplyMessageBullMq<JsonString> = {
				correlationId: reply.data.correlationId,
				success: true,
				data:JSON.stringify(response) as JsonString,
        statusCode:response.statusCode,
        traceId:traceId,
        timestamp:new Date().toISOString(),
				message: `User Created Successfully`,
			};

      return message;
  });

  worker.on('completed', (job) => {
    logger.info(
      `User Created Integration Event Completed: traceId: ${job.data.traceId} | correlationId: ${job.data.correlationId} | jobId: ${job.id}`
    );
  });

  worker.on('failed', (job, err) => {
    logger.error(
      `User Created Integration Event Failed: traceId: ${job.data.traceId} | correlationId: ${job.data.correlationId} | jobId: ${job.id} | error: ${err.message}`
    );
  });
};
