import request from 'supertest';
import { describe, it } from 'node:test';
import expect from 'expect';
import { App } from '@/app';
import { restApiModulesFederation } from '@/modules/app.Module';
import { ValidateEnv } from '@kishornaik/utils';
import { SignInRequestDto } from '@/modules/auth/apps/features/v1/sign-in';

process.env.NODE_ENV = 'development';
ValidateEnv();

const appInstance = new App();
appInstance.initializeRestApiRoutes([...restApiModulesFederation]);
appInstance.initializeErrorHandling();
const app = appInstance.getServer();

describe(`Sign-In_Integration_Tests`, () => {
	// node --trace-deprecation --test --test-name-pattern='should_return_201_when_all_services_executed_Successfully' --require ts-node/register -r tsconfig-paths/register ./src/modules/auth/tests/features/v1/sign-in/index.test.ts
	it(`should_return_201_when_all_services_executed_Successfully`, async () => {
		const requestDto: SignInRequestDto = new SignInRequestDto();
    requestDto.userName = `bon1@example.com`;
		requestDto.password = 'password0123';

		const response = await request(app).post('/api/v1/auth/sign-in').send(requestDto);
		if (response.status !== 200) {
      console.log(`response.body: ${JSON.stringify(response.body)}`);
			setTimeout(() => {
				process.exit(0);
			}, 5000);
			expect(false).toBe(true);
		} else {
      console.log(`response.body: ${JSON.stringify(response.body)}`);
			setTimeout(() => {
				process.exit(0);
			}, 5000);
			expect(true).toBe(true);
		}
	});
});
