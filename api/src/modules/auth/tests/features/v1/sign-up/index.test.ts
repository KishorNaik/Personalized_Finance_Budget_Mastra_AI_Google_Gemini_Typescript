import request from 'supertest';
import { describe, it } from 'node:test';
import expect from 'expect';
import { App } from '@/app';
import { restApiModulesFederation } from '@/modules/app.Module';
import { ValidateEnv } from '@kishornaik/utils';
import { SignUpRequestDto } from '@/modules/auth/apps/features/v1/sign-up';

process.env.NODE_ENV = 'development';
ValidateEnv();

const appInstance = new App();
appInstance.initializeRestApiRoutes([...restApiModulesFederation]);
appInstance.initializeErrorHandling();
const app = appInstance.getServer();

describe(`Create_User_Module_Integration_Tests`, () => {
	// node --trace-deprecation --test --test-name-pattern='should_return_201_when_all_services_executed_Successfully' --require ts-node/register -r tsconfig-paths/register ./src/modules/auth/tests/features/v1/sign-up/index.test.ts
	it(`should_return_201_when_all_services_executed_Successfully`, async () => {
		const requestDto: SignUpRequestDto = new SignUpRequestDto();
		requestDto.firstName = `doy`;
		requestDto.lastName = `doe`;
		requestDto.email = `doy@example.com`;
		requestDto.password = 'password0123';

		const response = await request(app).post('/api/v1/auth').send(requestDto);
		if (response.status !== 201) {
			setTimeout(() => {
				process.exit(0);
			}, 5000);
			expect(false).toBe(true);
		} else {
			setTimeout(() => {
				process.exit(0);
			}, 5000);
			expect(true).toBe(true);
		}
	});
});
