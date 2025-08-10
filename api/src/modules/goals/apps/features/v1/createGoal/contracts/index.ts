import { LimitNotExceedSavingsGoal } from '@kishornaik/db';
import { IsSafeString } from '@kishornaik/utils';
import { IsNotEmpty, IsNumber, IsString, Matches, MaxLength, Min, Validate } from 'class-validator';

// #region Request Dto
export class CreateGoalRequestDto {
	@IsString()
	@IsNotEmpty()
	@Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
		message: 'targetMonth must be in YYYY-MM format',
	})
	@IsSafeString()
	public targetMonth?: string;

	@IsString()
	@IsNotEmpty()
	@IsSafeString()
	@MaxLength(100)
	public category?: string;

	@IsNumber(
		{ maxDecimalPlaces: 2 },
		{ message: 'limit must be a number with up to 2 decimal places' }
	)
	@Min(0)
	public limit?: number;

	@IsNumber(
		{ maxDecimalPlaces: 2 },
		{ message: 'savingsGoal must be a number with up to 2 decimal places' }
	)
	@Min(0)
	@Validate(LimitNotExceedSavingsGoal)
	public savingsGoal?: number;
}
// #endregion

// #region Response Dto
export class CreateGoalResponseDto {
	identifier?: string;
}

// #endregion
