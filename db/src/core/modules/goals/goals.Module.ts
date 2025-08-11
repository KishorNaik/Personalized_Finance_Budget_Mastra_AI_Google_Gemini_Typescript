import { GoalEntity } from './infrastructures/entity/goals';

// Entity
export const goalModuleEntityFederations: Function[] = [GoalEntity];

export * from './infrastructures/entity/goals/index';

// Services
export * from './infrastructures/entity/goals/validations/index';
export * from './apps/features/v1/addGoals/index';
export * from './apps/features/v1/getGoals/index';
