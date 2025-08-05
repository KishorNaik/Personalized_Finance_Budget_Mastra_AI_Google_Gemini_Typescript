import { Column, Entity, Index, IsSafeString, OneToOne } from '@kishornaik/utils';
import { BaseEntity } from '../../../../../shared/entity/base';
import { IsNotEmpty, IsString, IsEmail } from 'class-validator';
import { UserCredentialsEntity } from '../credentials';

@Entity({ schema: `user`, name: `user` })
export class UserEntity extends BaseEntity {
	@Column(`varchar`, { length: 100, nullable: false })
	@IsNotEmpty()
	@IsString()
	@IsSafeString()
	public firstName?: string;

	@Column(`varchar`, { length: 100, nullable: false })
	@IsNotEmpty()
	@IsString()
	@IsSafeString()
	public lastName?: string;

	@Column(`varchar`, { length: 100, nullable: false })
	@Index({ unique: true })
	@IsNotEmpty()
	@IsString()
	@IsEmail()
	@IsSafeString()
	public email?: string;

	@OneToOne(() => UserCredentialsEntity, (credentials) => credentials.users)
	public credentials?: UserCredentialsEntity;
}
