import { getQueryRunner, UserEntity } from '@kishornaik/db';
import {
	CleanUpWrapper,
	Container,
	GuardWrapper,
	IServiceHandlerAsync,
	IServiceHandlerVoidAsync,
	PipelineWorkflow,
	Result,
	ResultError,
	ResultFactory,
	sealed,
	Service,
	StatusEnum,
	TransactionsWrapper,
	VOID_RESULT,
	VoidResult,
} from '@kishornaik/utils';
import { logger } from '../../../../../shared/utils/helpers/loggers';
import { GetUserByIdentifierCacheService } from './services/byIdentifier';
import { NODE_ENV } from '../../../../../config/env';
import { GetUserByEmailIdCacheService } from './services/byEmail';

export interface IUserSharedCacheServiceParameters {
	identifier: string;
	status: StatusEnum;
}

export interface IUserSharedCacheService
	extends IServiceHandlerVoidAsync<IUserSharedCacheServiceParameters> {}

enum pipelineSteps {
	byIdentifier = 'byIdentifier',
	byEmail = 'byEmail',
}

@sealed
@Service()
export class UserSharedCacheService implements IUserSharedCacheService {
	private pipeline = new PipelineWorkflow(logger);
	private readonly _getUserByIdentifierCacheService: GetUserByIdentifierCacheService;
	private readonly _getUserByEmailIdCacheService: GetUserByEmailIdCacheService;

	public constructor() {
		this._getUserByIdentifierCacheService = Container.get(GetUserByIdentifierCacheService);
		this._getUserByEmailIdCacheService = Container.get(GetUserByEmailIdCacheService);
	}

	public async handleAsync(
		params: IUserSharedCacheServiceParameters
	): Promise<Result<VoidResult, ResultError>> {
		const queryRunner = getQueryRunner();
		await queryRunner.connect();

		const response = await TransactionsWrapper.runResultAsync<VoidResult>({
			queryRunner: queryRunner,
			onTransaction: async () => {
				const { identifier, status } = params;

				// Guard
				const guardResult = new GuardWrapper()
					.check(identifier, 'identifier')
					.check(status, 'status')
					.validate();
				if (guardResult.isErr())
					return ResultFactory.error(
						guardResult.error.statusCode,
						guardResult.error.message
					);

				// By Identifier
				await this.pipeline.step(pipelineSteps.byIdentifier, async () => {
					return await this._getUserByIdentifierCacheService.handleAsync({
						env: String(NODE_ENV),
						key: `user-identifier-${identifier}`,
						setParams: {
							queryRunner: queryRunner,
							identifier: identifier,
							status: status,
						},
					});
				});

				// By Email
				await this.pipeline.step(pipelineSteps.byEmail, async () => {
					// get User Email
					const userResult = this.pipeline.getResult<UserEntity>(
						pipelineSteps.byIdentifier
					);
					const email = userResult.email;

					return await this._getUserByEmailIdCacheService.handleAsync({
						env: String(NODE_ENV),
						key: `user-email-${email}`,
						setParams: {
							queryRunner: queryRunner,
							identifier: identifier,
							status: status,
							email: email,
						},
					});
				});

				return ResultFactory.success(VOID_RESULT);
			},
		});

		return response;
	}
}
