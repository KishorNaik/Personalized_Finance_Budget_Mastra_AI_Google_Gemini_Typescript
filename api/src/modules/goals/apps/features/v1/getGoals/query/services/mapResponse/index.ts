import { GoalEntity } from '@kishornaik/db';
import {
	ExceptionsWrapper,
	GuardWrapper,
	IServiceHandlerAsync,
	Result,
	ResultError,
	ResultFactory,
	sealed,
	Service,
	Enumerable,
	StatusCodes,
} from '@kishornaik/utils';
import { GetGoalsResponseDto } from '../../../contracts';
import { ExceptionHandler } from 'winston';

export interface IGetGoalsResponseMapperService
	extends IServiceHandlerAsync<GoalEntity[], GetGoalsResponseDto[]> {}

@sealed
@Service()
export class GetGoalsResponseMapperService implements IGetGoalsResponseMapperService {
	public async handleAsync(
		params: GoalEntity[]
	): Promise<Result<GetGoalsResponseDto[], ResultError>> {
		return await ExceptionsWrapper.tryCatchResultAsync(async () => {
			// Guard
			const guardResult = new GuardWrapper().check(params, 'params').validate();
			if (guardResult.isErr())
				return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

			const result = Enumerable.from(params)
				.select<GetGoalsResponseDto>((s) => ({
					status: s.status,
					category: s.category,
					identifier: s.identifier,
					limit: s.limit,
					savingsGoal: s.savingsGoal,
					targetMonth: s.targetMonth,
					userId: s.userId,
				}))
				.toArray();

			if (!result || result.length === 0)
				return ResultFactory.error(StatusCodes.NOT_FOUND, `No goals found`);

			return ResultFactory.success(result);
		});
	}
}
