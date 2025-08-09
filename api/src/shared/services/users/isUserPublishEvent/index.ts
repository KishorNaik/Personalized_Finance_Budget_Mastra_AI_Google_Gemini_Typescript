import {
	BoolEnum,
	bullMqRedisConnection,
	ExceptionsWrapper,
	GuardWrapper,
	IServiceHandlerAsync,
	JsonString,
	RequestReplyMessageBullMq,
	RequestReplyProducerBullMq,
	Result,
	ResultError,
	ResultFactory,
	sealed,
	Service,
	StatusCodes,
} from '@kishornaik/utils';
import { randomUUID } from 'node:crypto';

const queueName = 'is-user-valid-integration-event-queue';
const producer = new RequestReplyProducerBullMq(bullMqRedisConnection);
producer.setQueues(queueName).setQueueEvents();

export interface IIsUserValidIntegrationPublishEventServiceParameters {
	identifier: string;
	traceId: string;
}

export interface IIsUserValidationIntegrationEventServiceResult {
	identifier: string;
	isValid: BoolEnum;
}

export interface IIsUserValidIntegrationPublishEventService
	extends IServiceHandlerAsync<
		IIsUserValidIntegrationPublishEventServiceParameters,
		IIsUserValidationIntegrationEventServiceResult
	> {}

@sealed
@Service()
export class IsUserValidIntegrationPublishEventService
	implements IIsUserValidIntegrationPublishEventService
{
	public async handleAsync(
		params: IIsUserValidIntegrationPublishEventServiceParameters
	): Promise<Result<IIsUserValidationIntegrationEventServiceResult, ResultError>> {
		return await ExceptionsWrapper.tryCatchResultAsync(async () => {
			const { identifier, traceId } = params;

			// Guard
			const guardResult = new GuardWrapper()
				.check(identifier, 'identifier')
				.check(traceId, 'traceId')
				.validate();
			if (guardResult.isErr())
				return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

			// Generate payload
			const payload = {
				identifier: identifier,
			};

			// Generate Payload Json
			const payloadJson = JSON.stringify(payload) as JsonString;

			// Generate Message Bull Mq
			const message: RequestReplyMessageBullMq<JsonString> = {
				correlationId: randomUUID().toString(),
				timestamp: new Date().toISOString(),
				data: payloadJson,
				traceId: traceId,
			};

			// Publish Event
			const publishResult = await producer.sendAsync<JsonString, JsonString>(
				`JOB:${queueName}`,
				message
			);
			if (!publishResult.success)
				return ResultFactory.error(publishResult.statusCode, publishResult.error);

			// Parse Data
			const data = JSON.parse(
				publishResult.data
			) as IIsUserValidationIntegrationEventServiceResult;

			// Return Result
			return ResultFactory.success(data);
		});
	}
}
