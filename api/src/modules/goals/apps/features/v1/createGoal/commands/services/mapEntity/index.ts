import {
	ExceptionsWrapper,
	GuardWrapper,
	IServiceHandlerAsync,
	Result,
	ResultError,
	ResultFactory,
	sealed,
	Service,
	StatusEnum,
} from '@kishornaik/utils';
import { CreateGoalRequestDto } from '../../../contracts';
import { GoalEntity } from '@kishornaik/db';
import { randomUUID } from 'crypto';

export interface ICreateGoalRequestEntityMapperServiceParameters {
	userId: string;
	request: CreateGoalRequestDto;
}

export interface ICreateGoalRequestEntityMapperService
	extends IServiceHandlerAsync<ICreateGoalRequestEntityMapperServiceParameters, GoalEntity> {}

@sealed
@Service()
export class CreateGoalRequestEntityMapperService implements ICreateGoalRequestEntityMapperService {
	public async handleAsync(
		params: ICreateGoalRequestEntityMapperServiceParameters
	): Promise<Result<GoalEntity, ResultError>> {
		return await ExceptionsWrapper.tryCatchResultAsync(async () => {
			const { request, userId } = params;

			// Guard
			const guardResult = new GuardWrapper()
				.check(params, 'params')
				.check(userId, 'userId')
				.check(request, 'request')
				.validate();
			if (guardResult.isErr())
				return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

			// Map
			const entity: GoalEntity = new GoalEntity();
			entity.identifier = randomUUID().toString();
			entity.status = StatusEnum.ACTIVE;
			entity.userId = userId;
			entity.category = request.category;
			entity.limit = request.limit;
			entity.savingsGoal = request.savingsGoal;
			entity.targetMonth = request.targetMonth;

			return ResultFactory.success(entity);
		});
	}
}
