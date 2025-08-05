import { sealed, Service } from "@kishornaik/utils";
import { AddService } from "../../../../../../shared/services/db/add";
import { UserCredentialsEntity, UserEntity } from "../../../../user.Module";

@sealed
@Service()
export class AddUsersDbService extends AddService<UserEntity>{
  public constructor(){
    super(UserEntity);
  }
}

@sealed
@Service()
export class AddUsersCredentialsDbService extends AddService<UserCredentialsEntity>{
  public constructor(){
    super(UserCredentialsEntity);
  }
}
