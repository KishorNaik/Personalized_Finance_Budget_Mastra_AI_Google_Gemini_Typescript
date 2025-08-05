import { ExceptionsWrapper, GuardWrapper, IServiceHandlerAsync, Result, ResultError, ResultFactory, sealed, Service, StatusEnum } from "@kishornaik/utils";
import { CreateUsersRequestDto } from "../../../contracts";
import { UserCredentialsEntity, UserEntity } from "@kishornaik/db";
import { randomUUID } from "node:crypto";

export interface ICreateUserMapEntityServiceParameters{
  request:CreateUsersRequestDto;
  password:{
    hash:string;
    salt:string;
  }
}

export interface ICreateUserMapEntityServiceResult{
  user:UserEntity;
  credentials:UserCredentialsEntity;
}

export interface ICreateUserMapEntityService extends IServiceHandlerAsync<ICreateUserMapEntityServiceParameters,ICreateUserMapEntityServiceResult>{}

@sealed
@Service()
export class CreateUserMapEntityService implements ICreateUserMapEntityService{
  public async handleAsync(params: ICreateUserMapEntityServiceParameters): Promise<Result<ICreateUserMapEntityServiceResult, ResultError>> {
    return await ExceptionsWrapper.tryCatchResultAsync(async ()=>{

      const {request,password}=params;

      // Guard
      const guardResult=new GuardWrapper()
      .check(request,'request')
      .check(password,'password')
      .validate();
      if(guardResult.isErr())
        return ResultFactory.error(guardResult.error.statusCode,guardResult.error.message);

      // Map Entity
      const user:UserEntity=new UserEntity();
      user.identifier=randomUUID().toString();
      user.status=StatusEnum.ACTIVE;
      user.firstName=request.firstName;
      user.lastName=request.lastName;
      user.email=request.email;

      const credentials=new UserCredentialsEntity();
      credentials.identifier=randomUUID().toString();
      credentials.status=StatusEnum.ACTIVE;
      credentials.userName=user.email;
      credentials.salt=password.salt;
      credentials.hash=password.hash;
      credentials.userId=user.identifier;

      return ResultFactory.success({user,credentials});

    });
  }

}
