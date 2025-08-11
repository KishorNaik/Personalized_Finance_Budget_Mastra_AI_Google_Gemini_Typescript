import test, { afterEach, beforeEach, describe } from 'node:test';
import {
	destroyDatabase,
	getQueryRunner,
	initializeDatabase,
	QueryRunner,
} from '../../../../../../config/dbSource/index';
import { getRandomValues, randomUUID } from 'node:crypto';
import { BoolEnum, StatusEnum } from '@kishornaik/utils';
import expect from 'expect';
import { GetGoalDbService, GetGoalFilterDto, GoalEntity } from '../../../../goals.Module';
import { AddGoalDbService } from '../../../../apps/features/v1/addGoals';

describe(`Get-Goal-Unit-Test`, () => {
	let queryRunner: QueryRunner;

	beforeEach(async () => {
		await initializeDatabase();
		queryRunner = await getQueryRunner();
	});

	afterEach(async () => {
		await queryRunner.release();
		await destroyDatabase();
	});

	// node --trace-deprecation --test --test-name-pattern='should_return_true_when_all_services_passed' --require ts-node/register -r tsconfig-paths/register ./src/core/modules/goals/tests/features/v1/getGoals/index.test.ts
	test(`should_return_true_when_all_services_passed`, async () => {
		const goal = new GetGoalFilterDto();
		goal.status = StatusEnum.ACTIVE;
		goal.month = 8;
		goal.year = 2025;
		goal.userId = `625b0ab1-77d0-4a3e-ae75-d0bf93cdc132`;

		await queryRunner.startTransaction();
		const result = await new GetGoalDbService().handleAsync({
			queryRunner: queryRunner,
			request: goal,
		});
		if (result.isErr()) {
			console.log(`error: ${result.error}`);
			await queryRunner.rollbackTransaction();
			expect(true).toBe(false);
			return;
		}

		await queryRunner.commitTransaction();
		expect(true).toBe(true);
	});
});
