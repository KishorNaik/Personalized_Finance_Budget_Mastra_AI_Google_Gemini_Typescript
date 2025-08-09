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
import { GetTransactionsRequestDto } from '../../../contracts';
import { GetTransactionsFilterDto } from '@kishornaik/db';

export interface IGetTransactionEntityMapperServiceParameters {
	userId?: string;
	request?: GetTransactionsRequestDto;
}

export interface IGetTransactionsEntityMapperService
	extends IServiceHandlerAsync<
		IGetTransactionEntityMapperServiceParameters,
		GetTransactionsFilterDto
	> {}

@sealed
@Service()
export class GetTransactionsEntityMapperService implements IGetTransactionsEntityMapperService {
	public async handleAsync(
		params: IGetTransactionEntityMapperServiceParameters
	): Promise<Result<GetTransactionsFilterDto, ResultError>> {
		return await ExceptionsWrapper.tryCatchResultAsync(async () => {
			const { request, userId } = params;

			// Guard
			const guardResult = new GuardWrapper()
				.check(request, 'request')
				.check(userId, 'userId')
				.validate();
			if (guardResult.isErr())
				return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

			// Map Entity
			const entity: GetTransactionsFilterDto = {
				userId: userId,
				status: StatusEnum.ACTIVE,
				month: request.month,
				year: request.year,
			};

			return ResultFactory.success(entity);
		});
	}
}
