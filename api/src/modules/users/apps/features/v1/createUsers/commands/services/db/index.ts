import {AddUsersCredentialsDbService, AddUsersDbService, QueryRunner,UserCredentialsEntity, UserEntity } from "@kishornaik/db";
import { Container, ExceptionsWrapper, GuardWrapper, IServiceHandlerVoidAsync, Result, ResultError, ResultFactory, sealed, Service, VOID_RESULT, VoidResult } from "@kishornaik/utils";

Container.set<AddUsersDbService>(AddUsersDbService, new AddUsersDbService());
Container.set<AddUsersCredentialsDbService>(AddUsersCredentialsDbService, new AddUsersCredentialsDbService());

export interface ICreateUserSaveServiceParameters{
  user:UserEntity;
  credentials:UserCredentialsEntity;
  queryRunner:QueryRunner;
}

export interface ICreateUserSaveService extends IServiceHandlerVoidAsync<ICreateUserSaveServiceParameters>{

}

@sealed
@Service()
export class CreateUserSaveService implements ICreateUserSaveService {

  private  readonly _addUserDbService:AddUsersDbService;
  private readonly _addUserCredentialsDbService:AddUsersCredentialsDbService;
  public constructor(){
    this._addUserDbService=Container.get(AddUsersDbService);
    this._addUserCredentialsDbService=Container.get(AddUsersCredentialsDbService);
  }

  public async handleAsync(params: ICreateUserSaveServiceParameters): Promise<Result<VoidResult, ResultError>> {
    return await ExceptionsWrapper.tryCatchResultAsync(async ()=>{

      const {user,credentials,queryRunner}=params;

      // Guard
      const guardResult=new GuardWrapper()
      .check(user,'user')
      .check(credentials,'credentials')
      .check(queryRunner,'queryRunner')
      .validate();
      if(guardResult.isErr())
        return ResultFactory.error(guardResult.error.statusCode,guardResult.error.message);

      // Save User
      const result=await this._addUserDbService.handleAsync(user,queryRunner);
      if(result.isErr())
        return ResultFactory.error(result.error.statusCode,result.error.message);

      // Save Credentials
      const credentialsResult=await this._addUserCredentialsDbService.handleAsync(credentials,queryRunner);
      if(credentialsResult.isErr())
        return ResultFactory.error(credentialsResult.error.statusCode,credentialsResult.error.message);

      return ResultFactory.success(VOID_RESULT);

    })
  }

}
