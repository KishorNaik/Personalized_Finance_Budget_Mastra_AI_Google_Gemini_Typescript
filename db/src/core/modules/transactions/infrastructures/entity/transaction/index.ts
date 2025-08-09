import { Column, CreateDateColumn, Entity, Index, IsSafeString, OneToOne } from '@kishornaik/utils';
import { BaseEntity } from '../../../../../shared/entity/base';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export enum TransactionType {
	INCOME = 'income',
	EXPENSE = 'expense',
}

@Entity({ schema: `transaction`, name: `transactions` })
export class TransactionEntity extends BaseEntity {
	@Column(`enum`, { enum: TransactionType, nullable: true })
	@IsNotEmpty()
	public type?: TransactionType;

	@Column(`decimal`, { precision: 10, scale: 2, nullable: true })
	@IsNumber()
	public amount?: number;

	@Column(`varchar`, { length: 100, nullable: true })
	@IsNotEmpty()
	@IsString()
	@IsSafeString()
	public title?: string;

	@Column(`text`, { nullable: true })
	@IsNotEmpty()
	@IsString()
	@IsSafeString()
	public description?: string;

	@CreateDateColumn({
		type: 'date',
		default: () => 'CURRENT_DATE',
	})
	public date?: Date;

	@Column(`varchar`, { length: 100, nullable: true })
	@IsNotEmpty()
	@IsString()
	@IsSafeString()
	public category?: string;

	@Column(`varchar`, { length: 100, nullable: true })
	@IsNotEmpty()
	@IsString()
	@IsSafeString()
	public userId?: string;
}
