import {
	ValidationArguments,
	ValidatorConstraint,
	ValidatorConstraintInterface,
} from 'class-validator';
import { GoalEntity } from '..';

@ValidatorConstraint({ name: 'LimitNotExceedSavingsGoal', async: false })
export class LimitNotExceedSavingsGoal implements ValidatorConstraintInterface {
	validate(limit: number, args: ValidationArguments) {
		const obj = args.object as GoalEntity;
		if (typeof limit === 'number' && typeof obj.savingsGoal === 'number') {
			return limit <= obj.savingsGoal;
		}
		return true; // valid if one or both are undefined
	}

	defaultMessage(args: ValidationArguments) {
		return 'limit should not exceed savingsGoal';
	}
}
