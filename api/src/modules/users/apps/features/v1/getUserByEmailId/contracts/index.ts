import { IsSafeString, StatusEnum } from '@kishornaik/utils';
import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty } from 'class-validator';

// #region Request Dto
export class GetUserByEmailIdRequestDto {
	@IsNotEmpty()
	@IsEmail()
	@IsSafeString()
	@Type(() => String)
	public emailId?: string;
}
// #endregion

// #region Response Dto
export class GetUserByEmailIdResponseDto {
	identifier?: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	status?: StatusEnum;
	credentials?: {
		identifier?: string;
		userName?: string;
		salt?: string;
		hash?: string;
		status?: StatusEnum;
	};
}
// #endregion
