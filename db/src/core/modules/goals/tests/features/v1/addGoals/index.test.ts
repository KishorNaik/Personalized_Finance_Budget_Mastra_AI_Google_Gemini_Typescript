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
import { GoalEntity } from '../../../../goals.Module';
import { AddGoalDbService } from '../../../../apps/features/v1/addGoals';

describe(`Add-Goal-Unit-Test`, () => {
	let queryRunner: QueryRunner;

	beforeEach(async () => {
		await initializeDatabase();
		queryRunner = await getQueryRunner();
	});

	afterEach(async () => {
		await queryRunner.release();
		await destroyDatabase();
	});

	// node --trace-deprecation --test --test-name-pattern='should_return_true_when_all_services_passed' --require ts-node/register -r tsconfig-paths/register ./src/core/modules/goals/tests/features/v1/addGoals/index.test.ts
	test(`should_return_true_when_all_services_passed`, async () => {
		const goal = new GoalEntity();
		goal.identifier = randomUUID().toString();
		goal.status = StatusEnum.ACTIVE;
		goal.category = `groceries`;
		goal.targetMonth = `2025-08`;
		goal.limit = 1000;
		goal.savingsGoal = 200;
		goal.userId = `625b0ab1-77d0-4a3e-ae75-d0bf93cdc132`;

		await queryRunner.startTransaction();
		const addTransactionResult = await new AddGoalDbService().handleAsync(goal, queryRunner);
		if (addTransactionResult.isErr()) {
			console.log(`error: ${addTransactionResult.error}`);
			await queryRunner.rollbackTransaction();
			expect(true).toBe(false);
			return;
		}

		await queryRunner.commitTransaction();
		expect(true).toBe(true);
	});
});
