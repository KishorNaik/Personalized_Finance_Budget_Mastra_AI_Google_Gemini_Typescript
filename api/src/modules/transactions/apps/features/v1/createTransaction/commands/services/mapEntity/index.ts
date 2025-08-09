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
import { CreateTransactionRequestDto } from '../../../contracts';
import { TransactionEntity } from '@kishornaik/db';
import { randomUUID } from 'node:crypto';

export interface ICreateTransactionEntityMapperServiceParameters {
	userId: string;
	request: CreateTransactionRequestDto;
}

export interface ICreateTransactionEntityMapperService
	extends IServiceHandlerAsync<
		ICreateTransactionEntityMapperServiceParameters,
		TransactionEntity
	> {}

@sealed
@Service()
export class CreateTransactionEntityMapperService implements ICreateTransactionEntityMapperService {
	public async handleAsync(
		params: ICreateTransactionEntityMapperServiceParameters
	): Promise<Result<TransactionEntity, ResultError>> {
		return await ExceptionsWrapper.tryCatchResultAsync(async () => {
			const { request, userId } = params;

			// Guard Type
			const guardTypeResult = new GuardWrapper()
				.check(request, 'request')
				.check(userId, 'userId')
				.validate();
			if (guardTypeResult.isErr())
				return ResultFactory.error(
					guardTypeResult.error.statusCode,
					guardTypeResult.error.message
				);

			// Map Entity
			const entity: TransactionEntity = new TransactionEntity();
			entity.identifier = randomUUID().toString();
			((entity.status = StatusEnum.ACTIVE), (entity.date = new Date()));
			entity.amount = request.amount;
			entity.category = request.category;
			entity.description = request.description;
			entity.title = request.title;
			entity.type = request.type;
			entity.userId = userId;

			return ResultFactory.success(entity);
		});
	}
}
