import { AddGoalDbService, GoalEntity, QueryRunner } from '@kishornaik/db';
import {
	Container,
	ExceptionsWrapper,
	GuardWrapper,
	IServiceHandlerVoidAsync,
	Result,
	ResultError,
	ResultFactory,
	sealed,
	Service,
	StatusCodes,
	VOID_RESULT,
	VoidResult,
} from '@kishornaik/utils';
import { Res } from 'routing-controllers';

Container.set<AddGoalDbService>(AddGoalDbService, new AddGoalDbService());

export class ICreateGoalDbServiceParameters {
	entity: GoalEntity;
	queryRunner: QueryRunner;
}

export interface ICreateGoalDbService
	extends IServiceHandlerVoidAsync<ICreateGoalDbServiceParameters> {}

@sealed
@Service()
export class CreateGoalDbService implements ICreateGoalDbService {
	private readonly _addGoalDbService: AddGoalDbService;

	public constructor() {
		this._addGoalDbService = Container.get(AddGoalDbService);
	}

	public async handleAsync(
		params: ICreateGoalDbServiceParameters
	): Promise<Result<VoidResult, ResultError>> {
		return await ExceptionsWrapper.tryCatchResultAsync(async () => {
			const { entity, queryRunner } = params;

			// Guard
			const guardResult = new GuardWrapper()
				.check(entity, 'entity')
				.check(queryRunner, 'queryRunner')
				.validate();
			if (guardResult.isErr())
				return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

			// Save
			const result = await this._addGoalDbService.handleAsync(entity, queryRunner);
			if (result.isErr()) {
				if (
					result.error.message.includes(`duplicate key value violates unique constraint`)
				) {
					return ResultFactory.error(
						StatusCodes.CONFLICT,
						`The ${entity.category} is already exists for this target month(${entity.targetMonth})`
					);
				}
				return ResultFactory.error(result.error.statusCode, result.error.message);
			}

			return ResultFactory.success(VOID_RESULT);
		});
	}
}
