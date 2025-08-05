import expect from 'expect';
import { describe, it } from 'node:test';
import { destroyDatabase, initializeDatabase } from '@kishornaik/db';
import { CreateUserCommand, CreateUsersRequestDto } from '@/modules/users/apps/features/v1/createUsers';
import { mediator } from '@/shared/utils/helpers/medaitR';

process.env.NODE_ENV = 'development';

describe(`Create-User-Unit-Test`, () => {
  // node --trace-deprecation --test --test-name-pattern='should_return_201_when_all_services_execute_successfully' --require ts-node/register -r tsconfig-paths/register ./src/modules/users/tests/features/v1/createUsers/index.test.ts
  it(`should_return_201_when_all_services_execute_successfully`, async () => {
    await initializeDatabase();

    const request:CreateUsersRequestDto=new CreateUsersRequestDto();
    request.firstName='maria';
    request.lastName='doe';
    request.email='maria@example.com';
    request.password='password0123';

    const command:CreateUserCommand=new CreateUserCommand(request);

    const response=await mediator.send(command);
    if(!response.Success)
    {
      console.log(`error: ${JSON.stringify(response)}`);
      await destroyDatabase();
      expect(false).toBe(true);
      return;
    }

    await destroyDatabase();
    expect(true).toBe(true);
  });
});
