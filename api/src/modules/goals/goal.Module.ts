import { CreateGoalEndpoint } from './apps/features/v1/createGoal/endpoint';
import { GetGoalsEndpoint } from './apps/features/v1/getGoals';

export const goalModuleFederations: Function[] = [CreateGoalEndpoint, GetGoalsEndpoint];
