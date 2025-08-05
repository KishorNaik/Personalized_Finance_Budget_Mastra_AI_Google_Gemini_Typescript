import expect from 'expect';
import { describe, it } from 'node:test';
import { destroyDatabase, initializeDatabase } from '@kishornaik/db';
import { CreateUserCommand, CreateUsersRequestDto } from '@/modules/users/apps/features/v1/createUsers';
import { mediator } from '@/shared/utils/helpers/medaitR';
import { IUserSharedCacheServiceParameters, UserSharedCacheService } from '../../../../shared/cache/set';
import { StatusEnum, ValidateEnv } from '@kishornaik/utils';

process.env.NODE_ENV = 'development';
ValidateEnv();

describe(`Create-User-Shared-Cache-Unit-Test`, () => {
  // node --trace-deprecation --test --test-name-pattern='should_return_201_when_all_services_execute_successfully' --require ts-node/register -r tsconfig-paths/register ./src/modules/users/tests/features/v1/cache/index.test.ts
  it(`should_return_201_when_all_services_execute_successfully`, async () => {
    await initializeDatabase();

    const request:IUserSharedCacheServiceParameters={
      identifier:`977da003-b2cd-4bfd-ab4f-8dffaec27ae6`,
      status:StatusEnum.ACTIVE
    }

    const response=await new UserSharedCacheService().handleAsync(request);

    if(response.isErr())
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
