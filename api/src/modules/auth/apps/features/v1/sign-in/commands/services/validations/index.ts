import { DtoValidation, sealed, Service } from "@kishornaik/utils";
import { SignInRequestDto } from "../../../contracts";

@sealed
@Service()
export class SignInRequestDtoValidationService extends DtoValidation<SignInRequestDto>{
  public constructor() {
    super();
  }
}
