import { mergeRouters } from '@/config/trpc';
import {
	WorkerBullMq,
	WorkerCronJob,
	WorkerKafka,
	WorkerPusher,
	WorkerRabbitMq,
} from '@kishornaik/utils';
import { userModuleBullMqFederation, userModuleFederations } from './users/user.Module';
import { authModuleFederations } from './auth/auth.Module';
import { transactionModuleFederation } from './transactions/transaction.Module';

// REST API
const restApiModulesFederation: Function[] = [
	...userModuleFederations,
	...authModuleFederations,
	...transactionModuleFederation,
];

// TRPC
const trpcModulesFederation = mergeRouters();
type TRPCAppRouter = typeof trpcModulesFederation;

// Workers
const cronJobWorkerModules: WorkerCronJob[] = [];
const bullMqWorkerModules: WorkerBullMq[] = [...userModuleBullMqFederation];
const pusherWorkerModules: WorkerPusher[] = [];
const rabbitMqWorkerModules: WorkerRabbitMq[] = [];
const kafkaWorkerModules: WorkerKafka[] = [];

export {
	restApiModulesFederation,
	trpcModulesFederation,
	TRPCAppRouter,
	cronJobWorkerModules,
	bullMqWorkerModules,
	pusherWorkerModules,
	rabbitMqWorkerModules,
	kafkaWorkerModules,
};
