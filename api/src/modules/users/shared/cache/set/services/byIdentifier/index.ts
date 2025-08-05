import { Container, ExceptionsWrapper, GuardWrapper, RedisHelper, RedisStoreWrapper, Result, ResultError, ResultFactory, RowVersionNumber, sealed, Service, StatusEnum } from "@kishornaik/utils";
import {GetUserByIdentifierDbService, GetUserRowVersionDbService, QueryRunner, UserEntity} from "@kishornaik/db";
import { logger } from "../../../../../../../shared/utils/helpers/loggers";

Container.set<GetUserRowVersionDbService>(
	GetUserRowVersionDbService,
	new GetUserRowVersionDbService()
);

Container.set<GetUserByIdentifierDbService>(
	GetUserByIdentifierDbService,
	new GetUserByIdentifierDbService()
);

export interface IGetUserByIdentifierCacheServiceParameters{
  queryRunner:QueryRunner;
  identifier:string;
  status:StatusEnum;
}

@sealed
@Service()
export class GetUserByIdentifierCacheService extends RedisStoreWrapper<IGetUserByIdentifierCacheServiceParameters, UserEntity> {

  private readonly _getByIdentifierDbService:GetUserByIdentifierDbService
  private readonly _getRowVersionDbService:GetUserRowVersionDbService
  public constructor() {
    const redisHelper = new RedisHelper();
    super(redisHelper, logger);
    this._getByIdentifierDbService=Container.get(GetUserByIdentifierDbService);
    this._getRowVersionDbService=Container.get(GetUserRowVersionDbService);
  }

  protected async setCacheDataAsync(params: IGetUserByIdentifierCacheServiceParameters): Promise<Result<UserEntity, ResultError>> {
    return await ExceptionsWrapper.tryCatchResultAsync(async ()=>{

      const {queryRunner,identifier,status}=params;

      // Guard
      const guardResult=new GuardWrapper()
      .check(queryRunner,'queryRunner')
      .check(identifier,'identifier')
      .check(status,'status')
      .validate();
      if(guardResult.isErr())
        return ResultFactory.error(guardResult.error.statusCode,guardResult.error.message);

      // Map User Entity
      const user:UserEntity=new UserEntity();
      user.identifier=identifier;
      user.status=status;

      // Get User Data By Identifier
      const result=await this._getByIdentifierDbService.handleAsync({
        queryRunner:queryRunner,
        user:user
      });
      if(result.isErr())
        return ResultFactory.error(result.error.statusCode,result.error.message);

      return ResultFactory.success(result.value);
    });
  }
  protected async getRowVersionAsync(params: IGetUserByIdentifierCacheServiceParameters): Promise<Result<RowVersionNumber, ResultError>> {
    return await ExceptionsWrapper.tryCatchResultAsync(async ()=>{

      const {queryRunner,identifier,status}=params;

      // Guard
      const guardResult=new GuardWrapper()
      .check(queryRunner,'queryRunner')
      .check(identifier,'identifier')
      .check(status,'status')
      .validate();
      if(guardResult.isErr())
        return ResultFactory.error(guardResult.error.statusCode,guardResult.error.message);

      // Map User Entity
      const user:UserEntity=new UserEntity();
      user.identifier=identifier;
      user.status=status;

      // Get User Data By Identifier
      const result=await this._getRowVersionDbService.handleAsync(
        user,
        queryRunner,
      );
      if(result.isErr())
        return ResultFactory.error(result.error.statusCode,result.error.message);

      return ResultFactory.success(result.value.version);
    });
  }

}
