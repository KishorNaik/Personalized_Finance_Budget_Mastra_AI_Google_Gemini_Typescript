import { sealed, Service } from '@kishornaik/utils';
import { AddService } from '../../../../../../shared/services/db/add';
import { TransactionEntity } from '../../../../transaction.Module';

@sealed
@Service()
export class AddTransactionDbService extends AddService<TransactionEntity> {
	public constructor() {
		super(TransactionEntity);
	}
}
