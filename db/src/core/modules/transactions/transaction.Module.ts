import { TransactionEntity } from './infrastructures/entity/transaction';

// Entity
export const transactionModulesEntityFederation: Function[] = [TransactionEntity];

export * from './infrastructures/entity/transaction/index';

// Service
export * from './apps/features/v1/addTransaction/index';
export * from './apps/features/v1/getTransactions/index';
