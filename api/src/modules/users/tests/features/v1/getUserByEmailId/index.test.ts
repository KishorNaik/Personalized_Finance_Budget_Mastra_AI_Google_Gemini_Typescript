import expect from 'expect';
import { describe, it } from 'node:test';
import { destroyDatabase, initializeDatabase } from '@kishornaik/db';
import { mediator } from '@/shared/utils/helpers/medaitR';
import { ValidateEnv } from '@kishornaik/utils';
import { randomUUID } from 'node:crypto';
import { GetUserByEmailIdRequestDto } from '@/modules/users/apps/features/v1/getUserByEmailId';
import { GetUserByEmailIdQuery } from '@/modules/users/apps/features/v1/getUserByEmailId/query';

process.env.NODE_ENV = 'development';
ValidateEnv();

describe(`Get-User-By-EmailId-Unit-Test`, () => {
	// node --trace-deprecation --test --test-name-pattern='should_return_200_when_all_services_execute_successfully' --require ts-node/register -r tsconfig-paths/register ./src/modules/users/tests/features/v1/getUserByEmailId/index.test.ts
	it(`should_return_200_when_all_services_execute_successfully`, async () => {
		await initializeDatabase();

    const request:GetUserByEmailIdRequestDto=new GetUserByEmailIdRequestDto();
    request.emailId=`bon@example.com`;

		const traceId: string = randomUUID().toString();

		const query: GetUserByEmailIdQuery = new GetUserByEmailIdQuery(request, traceId);

		const response = await mediator.send(query);
		if (!response.success) {
			console.log(`error: ${JSON.stringify(response)}`);
			await destroyDatabase();
			expect(false).toBe(true);
			return;
		}

		await destroyDatabase();
		expect(true).toBe(true);
	});
});
