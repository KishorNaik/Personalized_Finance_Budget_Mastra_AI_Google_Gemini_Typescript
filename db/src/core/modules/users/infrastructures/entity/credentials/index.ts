import {
	Column,
	Entity,
	Index,
	IsSafeString,
	JoinColumn,
	OneToOne,
	ViewColumn,
} from '@kishornaik/utils';
import { IsNotEmpty, IsString } from 'class-validator';
import { BaseEntity } from '../../../../../shared/entity/base';
import { UserEntity } from '../users';

@Entity({ schema: `user`, name: `user` })
export class UserCredentialsEntity extends BaseEntity {
	@Column(`varchar`, { length: 100, nullable: false })
	@Index({ unique: true })
	@IsNotEmpty()
	@IsString()
	@IsSafeString()
	public userName?: string;

	@Column(`text`, { nullable: true })
	@IsNotEmpty()
	public salt?: string;

	@Column(`text`, { nullable: true })
	@IsNotEmpty()
	public hash?: string;

	@ViewColumn({ name: 'userId' })
	public userId?: string;

	@OneToOne(() => UserEntity, (user) => user.credentials, { cascade: true })
	@JoinColumn({ name: 'userId', referencedColumnName: `identifier` })
	public users?: UserEntity;
}
