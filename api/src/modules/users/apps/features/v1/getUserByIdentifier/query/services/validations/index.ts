import { DtoValidation, sealed, Service } from '@kishornaik/utils';
import { GetUserByIdentifierRequestDto } from '../../../contracts';

@sealed
@Service()
export class GetUserByIdentifierRequestValidationService extends DtoValidation<GetUserByIdentifierRequestDto> {
	public constructor() {
		super();
	}
}
