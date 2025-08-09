import test, { afterEach, beforeEach, describe } from 'node:test';
import {
	destroyDatabase,
	getQueryRunner,
	initializeDatabase,
	QueryRunner,
} from '../../../../../../../config/dbSource/index';
import { getRandomValues, randomUUID } from 'node:crypto';
import { BoolEnum, StatusEnum } from '@kishornaik/utils';
import expect from 'expect';
import {
	AddUsersCredentialsDbService,
	AddUsersDbService,
	GetUserByEmailIdDbService,
	GetUserByIdentifierDbService,
	UserCredentialsEntity,
	UserEntity,
} from '../../../../../user.Module';

describe(`Get-User-By-EmailId-Unit-Test`, () => {
	let queryRunner: QueryRunner;

	beforeEach(async () => {
		await initializeDatabase();
		queryRunner = await getQueryRunner();
	});

	afterEach(async () => {
		await queryRunner.release();
		await destroyDatabase();
	});

	// node --trace-deprecation --test --test-name-pattern='should_return_true_when_all_services_passed' --require ts-node/register -r tsconfig-paths/register ./src/core/modules/users/tests/integrations/features/v1/getUserByEmailId/index.test.ts
	test(`should_return_true_when_all_services_passed`, async () => {
		const user: UserEntity = new UserEntity();
		user.email = `bon@example.com`;
		user.status = StatusEnum.ACTIVE;

		await queryRunner.startTransaction();
		const result = await new GetUserByEmailIdDbService().handleAsync({
			user: user,
			queryRunner: queryRunner,
		});
		if (result.isErr()) {
			await queryRunner.rollbackTransaction();
			expect(true).toBe(false);
			return;
		}
		await queryRunner.commitTransaction();
		expect(result.isOk()).toBe(true);
		expect(result.isOk()).toBe(true);
	});
});
