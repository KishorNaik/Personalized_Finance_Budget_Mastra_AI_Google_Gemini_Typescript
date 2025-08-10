import expect from 'expect';
import { describe, it } from 'node:test';
import { destroyDatabase, initializeDatabase, TransactionType } from '@kishornaik/db';
import { mediator } from '@/shared/utils/helpers/medaitR';
import { RoleEnum, ValidateEnv } from '@kishornaik/utils';
import { randomUUID } from 'node:crypto';
import { App } from '@/app';
import { restApiModulesFederation } from '@/modules/app.Module';
import jwt from 'jsonwebtoken';
import { SECRET_KEY } from '@/config/env';
import request from 'supertest';
import { CreateGoalRequestDto } from '@/modules/goals/apps/features/v1/createGoal';

process.env.NODE_ENV = 'development';
ValidateEnv();

const appInstance = new App();
appInstance.initializeRestApiRoutes([...restApiModulesFederation]);
appInstance.initializeErrorHandling();
const app = appInstance.getServer();

describe(`Create-Goal-Unit-Test`, () => {
	// node --trace-deprecation --test --test-name-pattern='should_return_200_when_all_services_execute_successfully' --require ts-node/register -r tsconfig-paths/register ./src/modules/goals/tests/features/v1/createGoal/index.test.ts
	it(`should_return_200_when_all_services_execute_successfully`, async () => {
		await initializeDatabase();

		// UserId
		const userId: string = `625b0ab1-77d0-4a3e-ae75-d0bf93cdc132`;

		// Groceries
		// Request
		const requestDto: CreateGoalRequestDto = new CreateGoalRequestDto();
		requestDto.category = `Groceries`;
		requestDto.limit = 2000;
		requestDto.savingsGoal = 300;
		requestDto.targetMonth = `2025-08`;

		// Endpoint
		const endpoint = `/api/v1/goals`;

		// Jwt Id
		const token = jwt.sign({ id: userId, role: RoleEnum.USER }, SECRET_KEY, {
			expiresIn: '1h',
			algorithm: 'HS256',
		});

		const response = await request(app)
			.post(endpoint)
			.set('authorization', `Bearer ${token}`)
			.send(requestDto);

		if (response.status !== 201) {
			console.log(`error: ${JSON.stringify(response)}`);
			await destroyDatabase();
			setTimeout(() => {
				process.exit(0);
			}, 5000);

			expect(false).toBe(true);
			return;
		}

		console.log(`Success: ${JSON.stringify(response)}`);

		await destroyDatabase();
		setTimeout(() => {
			process.exit(0);
		}, 5000);
		expect(true).toBe(true);
	});
});
