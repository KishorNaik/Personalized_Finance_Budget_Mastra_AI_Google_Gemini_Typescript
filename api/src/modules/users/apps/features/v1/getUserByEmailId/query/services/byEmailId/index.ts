import {
	Container,
	ExceptionsWrapper,
	GuardWrapper,
	IServiceHandlerAsync,
	redisCacheCircuitBreaker,
	RedisHelper,
	Result,
	ResultError,
	ResultFactory,
	sealed,
	Service,
	StatusEnum,
} from '@kishornaik/utils';
import { GetUserByEmailIdDbService, QueryRunner, UserEntity } from '@kishornaik/db';
import { NODE_ENV } from '@/config/env';

Container.set<GetUserByEmailIdDbService>(
	GetUserByEmailIdDbService,
	new GetUserByEmailIdDbService()
);

export interface IGetUserByEmailServiceParameters {
	key: string;
	emailId: string;
	queryRunner: QueryRunner;
}

export interface IGetUserByEmailIdService
	extends IServiceHandlerAsync<IGetUserByEmailServiceParameters, UserEntity> {}

@sealed
@Service()
export class GetUserByEmailIdService implements IGetUserByEmailIdService {
	private readonly _getUserByEmailIdDbService: GetUserByEmailIdDbService;
	private readonly _redisHelper: RedisHelper;
	public constructor() {
		this._getUserByEmailIdDbService = Container.get(GetUserByEmailIdDbService);
		this._redisHelper = new RedisHelper();
	}

	public async handleAsync(
		params: IGetUserByEmailServiceParameters
	): Promise<Result<UserEntity, ResultError>> {
		return await ExceptionsWrapper.tryCatchResultAsync<UserEntity>(async () => {
			const { emailId, queryRunner, key } = params;

			// Guard
			const guardResult = new GuardWrapper()
				.check(emailId, 'emailId')
				.check(queryRunner, 'queryRunner')
				.check(key, 'key')
				.validate();
			if (guardResult.isErr())
				return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

			// Read email Data from the redis
			await this._redisHelper.init(String(NODE_ENV) === 'development' ? true : false);
			const redisResult = await this._redisHelper.get(key);
			if (redisResult.isErr()) {
				const userObj = new UserEntity();
				userObj.email = emailId;
				userObj.status = StatusEnum.ACTIVE;

				const userResult = await this._getUserByEmailIdDbService.handleAsync({
					queryRunner: queryRunner,
					user: userObj,
				});
				if (userResult.isErr())
					return ResultFactory.error(
						userResult.error.statusCode,
						userResult.error.message
					);

				return ResultFactory.success(userResult.value);
			}

			const userResult = JSON.parse(redisResult.value) as UserEntity;

			return ResultFactory.success(userResult);
		});
	}
}
