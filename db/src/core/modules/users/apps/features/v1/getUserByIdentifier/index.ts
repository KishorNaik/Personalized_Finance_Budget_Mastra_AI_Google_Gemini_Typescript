import { Container, DtoValidation, ExceptionsWrapper, GuardWrapper, IServiceHandlerAsync, Result, ResultError, ResultFactory, sealed, Service, StatusCodes, StatusEnum } from "@kishornaik/utils";
import {dbDataSource, QueryRunner} from "../../../../../../config/dbSource";
import { UserEntity } from "../../../../user.Module";

export class GetUserByIdentifierServiceParameters{
  public identifier?:string;
  public status?:StatusEnum;
  public queryRunner?:QueryRunner;
}

export interface IGetUserByIdentifierService extends IServiceHandlerAsync<GetUserByIdentifierServiceParameters,UserEntity>{}

@sealed
@Service()
export class GetUserByIdentifierService implements IGetUserByIdentifierService{

  private readonly _dtoValidation:DtoValidation<GetUserByIdentifierServiceParameters>;
  public constructor(){
    this._dtoValidation=Container.get(DtoValidation<GetUserByIdentifierServiceParameters>);
  }

  public async handleAsync(params: GetUserByIdentifierServiceParameters): Promise<Result<UserEntity, ResultError>> {
    return await ExceptionsWrapper.tryCatchResultAsync(async ()=>{

      const {identifier,status,queryRunner}=params;

      // Guard
      const guardResult=new GuardWrapper()
      .check(params,'params')
      .check(queryRunner,'queryRunner')
      .check(identifier,'identifier')
      .check(status,'status')
      .validate();
      if(guardResult.isErr())
        return ResultFactory.error(guardResult.error.statusCode,guardResult.error.message);

      // Dto Validation
      const dtoValidationResult=await this._dtoValidation.handleAsync({
        dto:params,
        dtoClass:GetUserByIdentifierServiceParameters
      });
      if(dtoValidationResult.isErr())
        return ResultFactory.error(dtoValidationResult.error.statusCode,dtoValidationResult.error.message);

      // Manager
      const entityManager=queryRunner?queryRunner.manager:dbDataSource.manager;

      // Join Query
      const result=await entityManager
        .createQueryBuilder(UserEntity,'entity')
        .innerJoinAndSelect(`entity.credentials`,'credentials')
        .where('entity.identifier = :identifier', {identifier})
        .andWhere('entity.status = :status', {status})
        .getOne();

      if(!result)
        return ResultFactory.error(StatusCodes.NOT_FOUND,'User not found');

      return ResultFactory.success(result);
    })
  }

}
