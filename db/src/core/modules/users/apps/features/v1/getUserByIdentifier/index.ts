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
import { dbDataSource, QueryRunner } from '../../../../../../config/dbSource';
import { UserEntity } from '../../../../user.Module';

export interface IGetUserByIdentifierDbServiceParameters {
	user: UserEntity;
	queryRunner: QueryRunner;
}

export interface IGetUserByIdentifierDbService
	extends IServiceHandlerAsync<IGetUserByIdentifierDbServiceParameters, UserEntity> {}

@sealed
@Service()
export class GetUserByIdentifierDbService implements IGetUserByIdentifierDbService {
	private readonly _dtoValidation: DtoValidation<UserEntity>;
	public constructor() {
		this._dtoValidation = Container.get(DtoValidation<UserEntity>);
	}

	public async handleAsync(
		params: IGetUserByIdentifierDbServiceParameters
	): Promise<Result<UserEntity, ResultError>> {
		return await ExceptionsWrapper.tryCatchResultAsync(async () => {
			const { user, queryRunner } = params;

			// Guard
			const guardResult = new GuardWrapper()
				.check(params, 'params')
				.check(queryRunner, 'queryRunner')
				.check(user, 'user')
				.validate();
			if (guardResult.isErr())
				return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

			// Dto Validation
			const dtoValidationResult = await this._dtoValidation.handleAsync({
				dto: params.user,
				dtoClass: UserEntity,
			});
			if (dtoValidationResult.isErr())
				return ResultFactory.error(
					dtoValidationResult.error.statusCode,
					dtoValidationResult.error.message
				);

			// Manager
			const entityManager = queryRunner ? queryRunner.manager : dbDataSource.manager;

			// Join Query
			const result = await entityManager
				.createQueryBuilder(UserEntity, 'entity')
				.innerJoinAndSelect(`entity.credentials`, 'credentials')
				.where('entity.identifier = :identifier', { identifier: user.identifier })
				.andWhere('entity.status = :status', { status: user.status })
				.getOne();

			if (!result) return ResultFactory.error(StatusCodes.NOT_FOUND, 'User not found');

			return ResultFactory.success(result);
		});
	}
}
