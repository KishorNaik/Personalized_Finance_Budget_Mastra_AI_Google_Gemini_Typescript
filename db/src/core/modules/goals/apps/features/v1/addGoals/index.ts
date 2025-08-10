import { sealed, Service } from '@kishornaik/utils';
import { AddService } from '../../../../../../shared/services/db/add';
import { GoalEntity } from '../../../../goals.Module';

@sealed
@Service()
export class AddGoalDbService extends AddService<GoalEntity> {
	public constructor() {
		super(GoalEntity);
	}
}
