import expect from 'expect';
import { describe, it } from 'node:test';
import { StatusEnum, ValidateEnv } from '@kishornaik/utils';
import { destroyDatabase, initializeDatabase } from '@kishornaik/db';
import { PublishUserSharedCacheDomainEventService } from '@/modules/users/shared/cache/events/publish/inde';
import { randomUUID } from 'node:crypto';

process.env.NODE_ENV = 'development';
ValidateEnv();

describe(`Publish-User-Shared-Cache-Unit-Test`, () => {
	// Run BullMq Worker using `npm run dev:bullmq`
	// node --trace-deprecation --test --test-name-pattern='should_return_true_once_the_event_publish_successfully' --require ts-node/register -r tsconfig-paths/register ./src/modules/users/tests/features/v1/cache/events/index.test.ts
	it(`should_return_true_once_the_event_publish_successfully`, async () => {
		const publishResult = await new PublishUserSharedCacheDomainEventService().handleAsync({
			identifier: `977da003-b2cd-4bfd-ab4f-8dffaec27ae6`,
			status: StatusEnum.ACTIVE,
			traceId: randomUUID().toString(),
		});

		if (publishResult.isErr()) {
			console.log(`error: ${JSON.stringify(publishResult)}`);
			expect(false).toBe(true);
			return;
		}

		expect(true).toBe(true);
	});
});
