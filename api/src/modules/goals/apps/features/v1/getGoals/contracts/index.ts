import { StatusEnum } from '@kishornaik/utils';
import { IsNotEmpty, IsNumber, Max, Min } from 'class-validator';

// #region Request Dto
export class GetGoalsRequestDto {
	@IsNumber()
	@Min(1)
	@Max(12)
	@IsNotEmpty()
	public month?: number;

	@IsNumber()
	@Min(2024)
	@Max(3000)
	@IsNotEmpty()
	public year?: number;
}
// #endregion

// #region Response Dto
export class GetGoalsResponseDto {
	public identifier?: string;
	public status: StatusEnum;
	public targetMonth?: string;
	public category?: string;
	public limit?: number;
	public savingsGoal?: number;
	public userId?: string;
}

// #endregion
