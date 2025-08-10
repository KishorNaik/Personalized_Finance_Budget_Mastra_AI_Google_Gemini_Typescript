import { CreateTransactionEndpoint } from './apps/features/v1/createTransaction/endpoint';
import { GetTransactionsEndpoint } from './apps/features/v1/getTransactions/endpoint';

export const transactionModuleFederation: Function[] = [
	CreateTransactionEndpoint,
	GetTransactionsEndpoint,
];
