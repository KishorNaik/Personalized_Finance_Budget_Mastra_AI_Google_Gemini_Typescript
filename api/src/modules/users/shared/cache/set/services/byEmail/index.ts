import {
	GetUserByEmailIdDbService,
	GetUserByIdentifierDbService,
	GetUserRowVersionDbService,
	QueryRunner,
	UserEntity,
} from '@kishornaik/db';
import {
	Container,
	ExceptionsWrapper,
	GuardWrapper,
	RedisHelper,
	RedisStoreWrapper,
	Result,
	ResultError,
	ResultFactory,
	RowVersionNumber,
	sealed,
	Service,
	StatusEnum,
} from '@kishornaik/utils';
import { logger } from '../../../../../../../shared/utils/helpers/loggers';

Container.set<GetUserRowVersionDbService>(
	GetUserRowVersionDbService,
	new GetUserRowVersionDbService()
);

Container.set<GetUserByEmailIdDbService>(
	GetUserByEmailIdDbService,
	new GetUserByEmailIdDbService()
);

export interface IGetUserByEmailIdCacheServiceParameters {
	queryRunner: QueryRunner;
	identifier: string;
	email: string;
	status: StatusEnum;
}

@sealed
@Service()
export class GetUserByEmailIdCacheService extends RedisStoreWrapper<
	IGetUserByEmailIdCacheServiceParameters,
	UserEntity
> {
	private readonly _getByEmailIdDbService: GetUserByIdentifierDbService;
	private readonly _getRowVersionDbService: GetUserRowVersionDbService;
	public constructor() {
		const redisHelper = new RedisHelper();
		super(redisHelper, logger);
		this._getByEmailIdDbService = Container.get(GetUserByIdentifierDbService);
		this._getRowVersionDbService = Container.get(GetUserRowVersionDbService);
	}

	protected async setCacheDataAsync(
		params: IGetUserByEmailIdCacheServiceParameters
	): Promise<Result<UserEntity, ResultError>> {
		return await ExceptionsWrapper.tryCatchResultAsync(async () => {
			const { queryRunner, email, status } = params;

			// Guard
			const guardResult = new GuardWrapper()
				.check(queryRunner, 'queryRunner')
				.check(email, 'email')
				.check(status, 'status')
				.validate();
			if (guardResult.isErr())
				return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

			// Map User Entity
			const user: UserEntity = new UserEntity();
			user.email = email;
			user.status = status;

			// Get User Data By Identifier
			const result = await this._getByEmailIdDbService.handleAsync({
				queryRunner: queryRunner,
				user: user,
			});
			if (result.isErr())
				return ResultFactory.error(result.error.statusCode, result.error.message);

			return ResultFactory.success(result.value);
		});
	}
	protected async getRowVersionAsync(
		params: IGetUserByEmailIdCacheServiceParameters
	): Promise<Result<RowVersionNumber, ResultError>> {
		return await ExceptionsWrapper.tryCatchResultAsync(async () => {
			const { queryRunner, identifier, status } = params;

			// Guard
			const guardResult = new GuardWrapper()
				.check(queryRunner, 'queryRunner')
				.check(identifier, 'identifier')
				.check(status, 'status')
				.validate();
			if (guardResult.isErr())
				return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

			// Map User Entity
			const user: UserEntity = new UserEntity();
			user.identifier = identifier;
			user.status = status;

			// Get User Data By Identifier
			const result = await this._getRowVersionDbService.handleAsync(user, queryRunner);
			if (result.isErr())
				return ResultFactory.error(result.error.statusCode, result.error.message);

			return ResultFactory.success(result.value.version);
		});
	}
}
