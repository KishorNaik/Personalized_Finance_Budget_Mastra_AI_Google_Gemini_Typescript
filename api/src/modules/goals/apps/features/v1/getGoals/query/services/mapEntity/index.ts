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
import { GetGoalsRequestDto } from '../../../contracts';
import { GetGoalFilterDto } from '@kishornaik/db';

export interface IGetGoalRequestEntityMapperServiceParameters {
	userId: string;
	request: GetGoalsRequestDto;
}

export interface IGetGoalRequestEntityMapperService
	extends IServiceHandlerAsync<IGetGoalRequestEntityMapperServiceParameters, GetGoalFilterDto> {}

@sealed
@Service()
export class GetGoalsRequestEntityMapperService implements IGetGoalRequestEntityMapperService {
	public async handleAsync(
		params: IGetGoalRequestEntityMapperServiceParameters
	): Promise<Result<GetGoalFilterDto, ResultError>> {
		return await ExceptionsWrapper.tryCatchResultAsync(async () => {
			const { request, userId } = params;

			// Guard
			const guardResult = new GuardWrapper()
				.check(request, 'request')
				.check(userId, 'userId')
				.validate();
			if (guardResult.isErr())
				return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

			// Map Request to Entity
			const entity: GetGoalFilterDto = {
				userId: userId,
				status: StatusEnum.ACTIVE,
				month: request.month,
				year: request.year,
			};

			return ResultFactory.success(entity);
		});
	}
}
