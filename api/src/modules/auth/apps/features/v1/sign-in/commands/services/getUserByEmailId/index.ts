import { getTraceId } from "@/shared/utils/helpers/loggers";
import { bullMqRedisConnection, ExceptionsWrapper, GuardWrapper, IServiceHandlerAsync, JsonString, ReplyMessageBullMq, RequestReplyMessageBullMq, RequestReplyProducerBullMq, Result, ResultError, ResultFactory, sealed, Service, StatusCodes, StatusEnum } from "@kishornaik/utils";
import { randomUUID } from "node:crypto";

const queueName = 'get-user-by-email-integration-event-queue';
const producer = new RequestReplyProducerBullMq(bullMqRedisConnection);
producer.setQueues(queueName).setQueueEvents();

export interface IPublishGetUserByEmailIdIntegrationEventServiceParameters{
  emailId:string;
}

export interface IPublishGetUserByEmailIdIntegrationEventServiceResult{
  identifier?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  status?: StatusEnum;
  credentials?: {
    identifier?: string;
    userName?: string;
    salt?: string;
    hash?: string;
    status?: StatusEnum;
  };
}

export interface IPublishGetUserByEmailIdIntegrationEventService extends IServiceHandlerAsync<IPublishGetUserByEmailIdIntegrationEventServiceParameters,IPublishGetUserByEmailIdIntegrationEventServiceResult>{}


@sealed
@Service()
export class PublishGetUserByEmailIdIntegrationEventService implements IPublishGetUserByEmailIdIntegrationEventService{
  public async handleAsync(params: IPublishGetUserByEmailIdIntegrationEventServiceParameters): Promise<Result<IPublishGetUserByEmailIdIntegrationEventServiceResult, ResultError>> {
    return await ExceptionsWrapper.tryCatchResultAsync(async ()=>{
      const {emailId} = params;

      // Guard
      const guardResult = new GuardWrapper().check(emailId,'emailId').validate();
      if(guardResult.isErr())
        return ResultFactory.error(guardResult.error.statusCode,guardResult.error.message);

      // Payload
      const payload = {
        emailId:emailId
      };
      const payloadJson:JsonString=JSON.stringify(payload) as JsonString;

      // Generate BullMq Message
      const message:RequestReplyMessageBullMq<JsonString>={
        timestamp:new Date().toISOString(),
        traceId:getTraceId(),
        data:payloadJson,
        correlationId:randomUUID().toString(),
      };

      const replyMessageResult:ReplyMessageBullMq<JsonString>=await producer.sendAsync<JsonString,JsonString>(`JOB:${queueName}`,message);
      if(!replyMessageResult.success)
        return ResultFactory.error(replyMessageResult.statusCode,replyMessageResult.error);

      const response:IPublishGetUserByEmailIdIntegrationEventServiceResult=JSON.parse(replyMessageResult.data) as IPublishGetUserByEmailIdIntegrationEventServiceResult;

      if(!response)
        return ResultFactory.error(StatusCodes.NOT_FOUND,'User Not Found');

      return ResultFactory.success(response);

    });
  }

}
