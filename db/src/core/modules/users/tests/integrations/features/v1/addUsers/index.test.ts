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
	UserCredentialsEntity,
	UserEntity,
} from '../../../../../user.Module';

describe(`Add-User-Unit-Test`, () => {
	let queryRunner: QueryRunner;

	beforeEach(async () => {
		await initializeDatabase();
		queryRunner = await getQueryRunner();
	});

	afterEach(async () => {
		await queryRunner.release();
		await destroyDatabase();
	});

	// node --trace-deprecation --test --test-name-pattern='should_return_true_when_all_services_passed' --require ts-node/register -r tsconfig-paths/register ./src/core/modules/users/tests/integrations/features/v1/addUsers/index.test.ts
	test(`should_return_true_when_all_services_passed`, async () => {
		const user: UserEntity = new UserEntity();
		user.identifier = randomUUID().toString();
		user.status = StatusEnum.ACTIVE;
		user.firstName = `john`;
		user.lastName = `doe`;
		user.email = `john@example.com`;

		const credentials = new UserCredentialsEntity();
		credentials.identifier = randomUUID().toString();
		credentials.status = StatusEnum.ACTIVE;
		credentials.userName = user.email;
		credentials.salt = getRandomValues(new Uint8Array(16)).toString();
		credentials.hash = getRandomValues(new Uint8Array(16)).toString();
		credentials.userId = user.identifier;

		await queryRunner.startTransaction();
		const addUserResult = await new AddUsersDbService().handleAsync(user, queryRunner);
		if (addUserResult.isErr()) {
			await queryRunner.rollbackTransaction();
			expect(true).toBe(false);
			return;
		}

		const credentialsResult = await new AddUsersCredentialsDbService().handleAsync(
			credentials,
			queryRunner
		);
		if (credentialsResult.isErr()) {
			await queryRunner.rollbackTransaction();
			expect(true).toBe(false);
			return;
		}
		await queryRunner.commitTransaction();
		expect(addUserResult.isOk()).toBe(true);
		expect(credentialsResult.isOk()).toBe(true);
	});
});
