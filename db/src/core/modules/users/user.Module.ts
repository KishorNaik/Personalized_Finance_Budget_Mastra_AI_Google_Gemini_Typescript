import { UserCredentialsEntity } from "./infrastructures/entity/credentials";
import { UserEntity } from "./infrastructures/entity/users";

// Entity
export const userModulesEntityFederation:Function[]=[UserEntity,UserCredentialsEntity];

export * from "./infrastructures/entity/users/index";
export * from "./infrastructures/entity/credentials/index";
