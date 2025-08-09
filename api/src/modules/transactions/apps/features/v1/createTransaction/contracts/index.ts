import { TransactionType } from '@kishornaik/db';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

// #region Request Dto
export class CreateTransactionRequestDto {
	@IsEnum(TransactionType, { message: 'type must be a valid TransactionType' })
	public type?: TransactionType;

	@IsString({ message: 'title must be a string' })
	@IsNotEmpty({ message: 'title should not be empty' })
	public title?: string;

	@IsOptional()
	@IsString({ message: 'description must be a string' })
	public description?: string;

	@IsNumber({}, { message: 'amount must be a number' })
	@Min(0, { message: 'amount must be at least 0' })
	public amount?: number;

	@IsOptional()
	@IsString({ message: 'category must be a string' })
	public category?: string;
}
// #endregion

// #region Response Dto

export class CreateTransactionResponseDto {
	public identifier?: string;
}

// #endregion
