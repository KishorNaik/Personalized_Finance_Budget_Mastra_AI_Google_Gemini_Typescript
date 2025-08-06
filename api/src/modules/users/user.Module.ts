import { WorkerBullMq } from '@kishornaik/utils';
import { subscribeUserSharedCacheDomainEvent } from './shared/cache/events/subscribe';
import { subscribeUserCreatedIntegrationEvent } from './apps/features/v1/createUsers/events';

export const userModuleBullMqFederation: WorkerBullMq[] = [subscribeUserSharedCacheDomainEvent,subscribeUserCreatedIntegrationEvent];
