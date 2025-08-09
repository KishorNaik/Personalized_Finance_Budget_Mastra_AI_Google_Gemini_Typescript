import { DtoValidation, sealed, Service } from '@kishornaik/utils';
import { GetTransactionsRequestDto } from '../../../contracts';

@sealed
@Service()
export class GetTransactionRequestValidationService extends DtoValidation<GetTransactionsRequestDto> {
	public constructor() {
		super();
	}
}
