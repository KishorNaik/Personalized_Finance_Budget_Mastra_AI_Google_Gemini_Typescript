import { DtoValidation, sealed, Service } from '@kishornaik/utils';
import { GetUserByEmailIdRequestDto } from '../../../contracts';

@sealed
@Service()
export class GetUserDataByEmailIdValidationService extends DtoValidation<GetUserByEmailIdRequestDto> {
	public constructor() {
		super();
	}
}
