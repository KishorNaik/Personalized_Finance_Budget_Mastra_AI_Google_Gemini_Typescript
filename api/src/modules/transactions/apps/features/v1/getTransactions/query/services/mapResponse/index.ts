import { TransactionEntity } from '@kishornaik/db';
import {
	ExceptionsWrapper,
	GuardWrapper,
	IServiceHandlerAsync,
	Result,
	ResultError,
	ResultFactory,
	sealed,
	Service,
	StatusCodes,
	Enumerable,
} from '@kishornaik/utils';
import { GetTransactionResponseDto } from '../../../contracts';

export interface IGetTransactionsResponseMapperService
	extends IServiceHandlerAsync<TransactionEntity[], GetTransactionResponseDto[]> {}

@sealed
@Service()
export class GetTransactionsResponseMapperService implements IGetTransactionsResponseMapperService {
	public async handleAsync(
		params: TransactionEntity[]
	): Promise<Result<GetTransactionResponseDto[], ResultError>> {
		return await ExceptionsWrapper.tryCatchResultAsync(async () => {
			// Guard
			const guardResult = new GuardWrapper().check(params, 'params').validate();
			if (guardResult.isErr())
				return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

			if (params.length === 0)
				return ResultFactory.error(StatusCodes.NOT_FOUND, `No transactions found`);

			// Map Response
			const result = Enumerable.from(params)
				.select<GetTransactionResponseDto>((s) => ({
					identifier: s.identifier,
					status: s.status,
					type: s.type,
					title: s.title,
					category: s.category,
					description: s.description,
					amount: s.amount,
					date: s.date,
					userId: s.userId,
				}))
				.toArray();

			return ResultFactory.success(result);
		});
	}
}
