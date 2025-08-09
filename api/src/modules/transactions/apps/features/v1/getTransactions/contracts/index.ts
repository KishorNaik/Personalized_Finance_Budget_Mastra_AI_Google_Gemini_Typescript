import { TransactionType } from '@kishornaik/db';
import { StatusEnum } from '@kishornaik/utils';
import { IsNumber, Max, Min } from 'class-validator';

// #region Request Dto
export class GetTransactionsRequestDto {
	@IsNumber()
	@Min(1)
	@Max(12)
	public month?: number;

	@IsNumber()
	@Min(2024)
	@Max(3000)
	public year?: number;
}
//#endregion

// #region Response Dto
export class GetTransactionResponseDto {
	public identifier?: string;
	public status?: StatusEnum;
	public type?: TransactionType;
	public title?: string;
	public category?: string;
	public description?: string;
	public amount?: number;
	public date?: Date;
	public userId?: string;
}
// #endregion
