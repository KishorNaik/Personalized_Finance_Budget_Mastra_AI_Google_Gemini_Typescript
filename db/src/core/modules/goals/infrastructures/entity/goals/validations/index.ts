import {
	ValidationArguments,
	ValidatorConstraint,
	ValidatorConstraintInterface,
} from 'class-validator';
import { GoalEntity } from '..';

@ValidatorConstraint({ name: 'LimitNotExceedSavingsGoal', async: false })
export class LimitNotExceedSavingsGoal implements ValidatorConstraintInterface {
	validate(savingsGoal: number, args: ValidationArguments) {
		const obj = args.object as GoalEntity;
		if (typeof savingsGoal === 'number' && typeof obj.limit === 'number') {
			return savingsGoal <= obj.limit;
		}
		return true; // valid if one or both are undefined
	}

	defaultMessage(args: ValidationArguments) {
		return 'saving goal should not exceed limit';
	}
}
