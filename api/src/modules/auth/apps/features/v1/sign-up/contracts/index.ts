import { IsSafeString } from '@kishornaik/utils';
import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';

// #region Request Dto
export class SignUpRequestDto {
  @IsString()
  @IsNotEmpty()
  @IsSafeString({ message: 'Name must not contain HTML or JavaScript code' })
  @Length(2, 50)
  @Type(() => String)
  public firstName?: string;

  @IsString()
  @IsNotEmpty()
  @IsSafeString({ message: 'Name must not contain HTML or JavaScript code' })
  @Length(2, 50)
  @Type(() => String)
  public lastName?: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @IsSafeString({ message: 'Name must not contain HTML or JavaScript code' })
  @Type(() => String)
  public email?: string;

  @IsString()
  @IsNotEmpty()
  @IsSafeString({ message: 'Name must not contain HTML or JavaScript code' })
  @Length(8, 20, { message: 'Password must be between 8 and 20 characters' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'Password must contain at least one letter and one number',
  })
  @Type(() => String)
  public password?: string;
}
// #endregion

// #region Response Dto
export class SignUpResponseDto {
  public jwtToken?: string;
}
// #endregion
