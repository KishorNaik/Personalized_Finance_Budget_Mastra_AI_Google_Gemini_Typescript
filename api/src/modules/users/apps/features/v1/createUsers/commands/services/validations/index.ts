import { DtoValidation, sealed, Service } from '@kishornaik/utils';
import { CreateUsersRequestDto } from '../../../contracts';

@sealed
@Service()
export class CreateUserValidationService extends DtoValidation<CreateUsersRequestDto> {
	public constructor() {
		super();
	}
}
