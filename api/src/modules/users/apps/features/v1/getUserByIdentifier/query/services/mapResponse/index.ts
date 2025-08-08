import { UserEntity } from "@kishornaik/db";
import { ExceptionsWrapper, GuardWrapper, IServiceHandlerAsync, Result, ResultError, ResultFactory, sealed, Service } from "@kishornaik/utils";
import { GetUserByIdentifierResponseDto } from "../../../contracts";

export interface IGetUserByIdentifierResponseMapperService extends IServiceHandlerAsync<UserEntity,GetUserByIdentifierResponseDto> {}

@sealed
@Service()
export class GetUserByIdentifierResponseMapperService implements IGetUserByIdentifierResponseMapperService {
  public async handleAsync(params: UserEntity): Promise<Result<GetUserByIdentifierResponseDto, ResultError>> {
    return await ExceptionsWrapper.tryCatchResultAsync(async ()=>{

      // Guard
      const guardResult = new GuardWrapper()
        .check(params, 'params')
        .validate();
      if (guardResult.isErr())
        return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

      // Map Response Dto
      const responseDto: GetUserByIdentifierResponseDto = new GetUserByIdentifierResponseDto();
      responseDto.identifier = params.identifier;
      responseDto.firstName = params.firstName;
      responseDto.lastName = params.lastName;
      responseDto.email = params.email;
      responseDto.status = params.status;
      responseDto.userName = params.credentials.userName;

      return ResultFactory.success(responseDto);
    });
  }

}
