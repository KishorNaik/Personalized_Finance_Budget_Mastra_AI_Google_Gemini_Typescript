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
import { GoalEntity } from '../../../../goals.Module';

export class GetGoalFilterDto {
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

export interface IGetGoalDbServiceParameters {
	queryRunner: QueryRunner;
	request: GetGoalFilterDto;
}

export interface IGetGoalsDbService
	extends IServiceHandlerAsync<IGetGoalDbServiceParameters, Array<GoalEntity>> {}

@sealed
@Service()
export class GetGoalDbService implements IGetGoalsDbService {
	private readonly _dtoValidation: DtoValidation<GetGoalFilterDto>;

	public constructor() {
		this._dtoValidation = Container.get(DtoValidation<GetGoalFilterDto>);
	}

	public async handleAsync(
		params: IGetGoalDbServiceParameters
	): Promise<Result<GoalEntity[], ResultError>> {
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
			const dtoValidationResult = await this._dtoValidation.handleAsync({
				dto: request,
				dtoClass: GetGoalFilterDto,
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
				.createQueryBuilder(GoalEntity, `entity`)
				.where('entity.userId = :userId', { userId: request.userId })
				.andWhere('entity.status = :status', { status: request.status })
				.andWhere("EXTRACT(MONTH FROM TO_DATE(entity.targetMonth, 'YYYY-MM')) = :month", {
					month: request.month,
				})
				.andWhere("EXTRACT(YEAR FROM TO_DATE(entity.targetMonth, 'YYYY-MM')) = :year", {
					year: request.year,
				})
				.orderBy('entity.date', 'ASC')
				.addOrderBy('entity.id', 'ASC')
				.getMany();

			if (!result || !result.length)
				return ResultFactory.error(StatusCodes.NOT_FOUND, 'No Goals Found');

			return ResultFactory.success(result);
		});
	}
}
