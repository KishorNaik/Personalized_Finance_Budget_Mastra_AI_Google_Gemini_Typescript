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
import {
	GetTransactionsByMonthAndYearDbService,
	GetTransactionsFilterDto,
} from '../../../../transaction.Module';

describe(`Get-Transaction-By-Month-Years-Unit-Test`, () => {
	let queryRunner: QueryRunner;

	beforeEach(async () => {
		await initializeDatabase();
		queryRunner = await getQueryRunner();
	});

	afterEach(async () => {
		await queryRunner.release();
		await destroyDatabase();
	});

	// node --trace-deprecation --test --test-name-pattern='should_return_true_when_all_services_passed' --require ts-node/register -r tsconfig-paths/register ./src/core/modules/transactions/tests/features/v1/getTransactions/index.test.ts
	test(`should_return_true_when_all_services_passed`, async () => {
		const dto: GetTransactionsFilterDto = new GetTransactionsFilterDto();
		dto.userId = `625b0ab1-77d0-4a3e-ae75-d0bf93cdc132`;
		dto.month = 8;
		dto.year = 2025;
		dto.status = StatusEnum.ACTIVE;

		await queryRunner.startTransaction();
		const addTransactionResult = await new GetTransactionsByMonthAndYearDbService().handleAsync(
			{
				queryRunner: queryRunner,
				request: dto,
			}
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
