import { IsSafeString, StatusEnum } from '@kishornaik/utils';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

// #region Request Dto
export class GetUserByIdentifierRequestDto {
	@IsNotEmpty()
	@IsString()
	@IsUUID()
	@IsSafeString({ message: 'Name must not contain HTML or JavaScript code' })
	@Type(() => String)
	public identifier?: string;
}
// #endregion

// #region Response Dto
export class GetUserByIdentifierResponseDto {
	public identifier?: string;
	public firstName?: string;
	public lastName?: string;
	public email?: string;
	public status?: StatusEnum;
	public userName?: string;
}
// #endregion
