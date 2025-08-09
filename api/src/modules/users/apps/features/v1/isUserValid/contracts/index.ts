import { BoolEnum, IsSafeString } from '@kishornaik/utils';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

// #region Request Dto
export class IsUserValidRequestDto {
	@IsNotEmpty()
	@IsString()
	@IsUUID()
	@IsSafeString({ message: 'Name must not contain HTML or JavaScript code' })
	@Type(() => String)
	public identifier?: string;
}
// #endregion

// #region Response Dto
export class IsUserValidResponseDto {
	public identifier?: string;
	public isValid?: BoolEnum;
}

// #endregion
