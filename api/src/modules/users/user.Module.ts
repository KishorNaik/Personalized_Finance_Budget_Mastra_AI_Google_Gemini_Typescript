import { WorkerBullMq } from "@kishornaik/utils";
import { subscribeUserSharedCacheDomainEvent } from "./shared/cache/events/subscribe";

export const userModuleBullMqFederation:WorkerBullMq[]=[subscribeUserSharedCacheDomainEvent];
