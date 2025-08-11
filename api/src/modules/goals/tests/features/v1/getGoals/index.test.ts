import expect from 'expect';
import { describe, it } from 'node:test';
import { destroyDatabase, initializeDatabase, TransactionType } from '@kishornaik/db';
import { mediator } from '@/shared/utils/helpers/medaitR';
import { RequestData, RoleEnum, ValidateEnv } from '@kishornaik/utils';
import { randomUUID } from 'node:crypto';
import { App } from '@/app';
import { restApiModulesFederation } from '@/modules/app.Module';
import jwt from 'jsonwebtoken';
import { SECRET_KEY } from '@/config/env';
import request from 'supertest';
import { GetTransactionsRequestDto } from '@/modules/transactions/apps/features/v1/getTransactions';
import { GetGoalsRequestDto } from '@/modules/goals/apps/features/v1/getGoals';

process.env.NODE_ENV = 'development';
ValidateEnv();

const appInstance = new App();
appInstance.initializeRestApiRoutes([...restApiModulesFederation]);
appInstance.initializeErrorHandling();
const app = appInstance.getServer();

describe(`Get-Goals-Unit-Test`, () => {
	// node --trace-deprecation --test --test-name-pattern='should_return_200_when_all_services_execute_successfully' --require ts-node/register -r tsconfig-paths/register ./src/modules/goals/tests/features/v1/getGoals/index.test.ts
	it(`should_return_200_when_all_services_execute_successfully`, async () => {
		await initializeDatabase();

		// UserId
		const userId: string = `625b0ab1-77d0-4a3e-ae75-d0bf93cdc132`;

		// Request
		const requestDto: GetGoalsRequestDto = new GetGoalsRequestDto();
		requestDto.month = 8;
		requestDto.year = 2025;

		// Endpoint
		const endpoint = `/api/v1/goals?month=${requestDto.month}&year=${requestDto.year}`;

		// Jwt Id
		const token = jwt.sign({ id: userId, role: RoleEnum.USER }, SECRET_KEY, {
			expiresIn: '1h',
			algorithm: 'HS256',
		});

		const response = await request(app).get(endpoint).set('authorization', `Bearer ${token}`);

		if (response.status !== 200) {
			console.log(`error: ${JSON.stringify(response.body)}`);
			await destroyDatabase();
			setTimeout(() => {
				process.exit(0);
			}, 5000);

			expect(false).toBe(true);
			return;
		}

		console.log(`Response: ${JSON.stringify(response.body)}`);

		await destroyDatabase();
		setTimeout(() => {
			process.exit(0);
		}, 5000);
		expect(true).toBe(true);
	});
});
