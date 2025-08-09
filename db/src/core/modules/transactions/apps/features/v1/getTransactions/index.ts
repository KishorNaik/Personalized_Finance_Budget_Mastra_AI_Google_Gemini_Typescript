import {
	Container,
	DtoValidation,
	ExceptionsWrapper,
	GuardWrapper,
	IServiceHandlerAsync,
	Result,
	ResultError,
	ResultFactory,
	sealed,
	Service,
	StatusCodes,
	StatusEnum,
} from '@kishornaik/utils';
import { IsNotEmpty, IsNumber, Max, Min, IsUUID, IsString, IsEnum } from 'class-validator';
import { dbDataSource, QueryRunner } from '../../../../../../config/dbSource';
import { TransactionEntity } from '../../../../transaction.Module';

export class GetTransactionsFilterDto {
	@IsNumber()
	@Min(1)
	@Max(12)
	@IsNotEmpty()
	public month?: number;

	@IsNumber()
	@Min(2024)
	@Max(3000)
	@IsNotEmpty()
	public year?: number;

	@IsNotEmpty()
	@IsString()
	@IsUUID()
	public userId?: string;

	@IsNotEmpty()
	@IsEnum(StatusEnum)
	public status?: StatusEnum;
}

export interface IGetTransactionByMonthAndYearServiceParameters {
	request: GetTransactionsFilterDto;
	queryRunner: QueryRunner;
}

export interface IGetTransactionByMonthAndYearsService
	extends IServiceHandlerAsync<
		IGetTransactionByMonthAndYearServiceParameters,
		Array<TransactionEntity>
	> {}

@sealed
@Service()
export class GetTransactionsByMonthAndYearService implements IGetTransactionByMonthAndYearsService {
	private readonly _dtoValidationService: DtoValidation<GetTransactionsFilterDto>;

	public constructor() {
		this._dtoValidationService = Container.get(DtoValidation<GetTransactionsFilterDto>);
	}

	public async handleAsync(
		params: IGetTransactionByMonthAndYearServiceParameters
	): Promise<Result<TransactionEntity[], ResultError>> {
		return await ExceptionsWrapper.tryCatchResultAsync(async () => {
			const { queryRunner, request } = params;

			// Guard
			const guardResult = new GuardWrapper()
				.check(queryRunner, 'queryRunner')
				.check(request, 'request')
				.validate();
			if (guardResult.isErr())
				return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

			// Dto Validation
			const dtoValidationResult = await this._dtoValidationService.handleAsync({
				dto: request,
				dtoClass: GetTransactionsFilterDto,
			});
			if (dtoValidationResult.isErr())
				return ResultFactory.error(
					dtoValidationResult.error.statusCode,
					dtoValidationResult.error.message
				);

			// Manager
			const entityManager = queryRunner ? queryRunner.manager : dbDataSource.manager;

			// Query
			const result = await entityManager
				.createQueryBuilder(TransactionEntity, 'entity')
				.where('entity.userId = :userId', { userId: request.userId })
				.andWhere('entity.status = :status', { status: request.status })
				.andWhere('EXTRACT(MONTH FROM entity.date) = :month', { month: request.month })
				.andWhere('EXTRACT(YEAR FROM entity.date) = :year', { year: request.year })
				.getMany();

			if (!result || result.length === 0)
				return ResultFactory.error(StatusCodes.NOT_FOUND, 'No data found');

			return ResultFactory.success(result);
		});
	}
}
