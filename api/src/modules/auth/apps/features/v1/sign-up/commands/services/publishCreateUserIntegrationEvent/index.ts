import { bullMqRedisConnection, DataResponse, ExceptionsWrapper, GuardWrapper, IServiceHandlerAsync, JsonString, RequestReplyMessageBullMq, RequestReplyProducerBullMq, Result, ResultError, ResultFactory, sealed, Service } from "@kishornaik/utils";
import { SignUpRequestDto, SignUpResponseDto } from "../../../contracts";
import { randomUUID } from "node:crypto";
import { getTraceId } from "@/shared/utils/helpers/loggers";

const queueName = 'user-create-integration-event-queue';
const producer=new RequestReplyProducerBullMq(bullMqRedisConnection);
producer.setQueues(queueName).setQueueEvents();

export interface IPublishCreateUserIntegrationEventService extends IServiceHandlerAsync<SignUpRequestDto,SignUpResponseDto>{}

@sealed
@Service()
export class PublishCreateUserIntegrationEventService implements IPublishCreateUserIntegrationEventService {
  public async handleAsync(params: SignUpRequestDto): Promise<Result<SignUpResponseDto, ResultError>> {
    return await ExceptionsWrapper.tryCatchResultAsync(async ()=>{

      // Guard
      const guardResult=new GuardWrapper()
        .check(params,'params')
        .validate();
      if(guardResult.isErr())
        return ResultFactory.error(guardResult.error.statusCode,guardResult.error.message);

      // Generate Payload
      const payload:SignUpRequestDto=params;

      // Generate Message Bull Mq
      const message:RequestReplyMessageBullMq<JsonString>={
        correlationId:randomUUID().toString(),
        timestamp:new Date().toISOString(),
        data:JSON.stringify(payload) as JsonString,
        traceId:getTraceId()
      }

      // Publish Event
      const publishResult=await producer.sendAsync<JsonString,JsonString>(`JOB:${queueName}`,message);
      if(!publishResult.success)
        return ResultFactory.error(publishResult.statusCode,publishResult.error);

      //Parse Data
      const data=JSON.parse(publishResult.data) as DataResponse<SignUpResponseDto>;

      // Return Result
      return ResultFactory.success(data.data);
    });
  }

}
