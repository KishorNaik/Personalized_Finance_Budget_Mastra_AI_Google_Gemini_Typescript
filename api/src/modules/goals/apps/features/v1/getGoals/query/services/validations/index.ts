import { DtoValidation, sealed, Service } from '@kishornaik/utils';
import { GetGoalsRequestDto } from '../../../contracts';

@sealed
@Service()
export class GetGoalsRequestValidationService extends DtoValidation<GetGoalsRequestDto> {
	public constructor() {
		super();
	}
}
