import { WorkerBullMq } from '@kishornaik/utils';
import { subscribeUserSharedCacheDomainEvent } from './shared/cache/events/subscribe';
import { subscribeUserCreatedIntegrationEvent } from './apps/features/v1/createUsers/events';
import { subscribeGetUserByEmailIdIntegrationEvent } from './apps/features/v1/getUserByEmailId/events';

export const userModuleFederations: Function[] = [];

export const userModuleBullMqFederation: WorkerBullMq[] = [
	subscribeUserSharedCacheDomainEvent,
	subscribeUserCreatedIntegrationEvent,
	subscribeGetUserByEmailIdIntegrationEvent,
];
