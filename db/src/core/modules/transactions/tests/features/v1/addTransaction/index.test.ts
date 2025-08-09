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
import { TransactionEntity, TransactionType } from '../../../../transaction.Module';
import { AddTransactionDbService } from '../../../../apps/features/v1/addTransaction';

describe(`Add-Transaction-Unit-Test`, () => {
	let queryRunner: QueryRunner;

	beforeEach(async () => {
		await initializeDatabase();
		queryRunner = await getQueryRunner();
	});

	afterEach(async () => {
		await queryRunner.release();
		await destroyDatabase();
	});

	// node --trace-deprecation --test --test-name-pattern='should_return_true_when_all_services_passed' --require ts-node/register -r tsconfig-paths/register ./src/core/modules/transactions/tests/features/v1/addTransaction/index.test.ts
	test(`should_return_true_when_all_services_passed`, async () => {
		const transaction: TransactionEntity = new TransactionEntity();
		transaction.identifier = randomUUID().toString();
		transaction.status = StatusEnum.ACTIVE;
		transaction.type = TransactionType.INCOME;
		transaction.title = `Website Development`;
		transaction.category = `freelancing`;
		transaction.description = `Website Development done for a client`;
		transaction.amount = 100;
		transaction.userId = `625b0ab1-77d0-4a3e-ae75-d0bf93cdc132`;
		transaction.date = new Date();

		await queryRunner.startTransaction();
		const addTransactionResult = await new AddTransactionDbService().handleAsync(
			transaction,
			queryRunner
		);
		if (addTransactionResult.isErr()) {
			await queryRunner.rollbackTransaction();
			expect(true).toBe(false);
			return;
		}

		await queryRunner.commitTransaction();
		expect(true).toBe(true);
	});
});
