import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	IsSafeString,
	OneToOne,
	Unique,
} from '@kishornaik/utils';
import { BaseEntity } from '../../../../../shared/entity/base';
import {
	IsNotEmpty,
	IsString,
	IsNumber,
	Matches,
	MaxLength,
	ValidatorConstraint,
	ValidatorConstraintInterface,
	ValidationArguments,
	Min,
	Validate,
} from 'class-validator';
import { LimitNotExceedSavingsGoal } from './validations';

@Entity({ schema: `goal`, name: `goals` })
@Unique(['targetMonth', 'category'])
export class GoalEntity extends BaseEntity {
	@Column({ type: 'varchar', length: 7, nullable: true })
	@IsString()
	@IsNotEmpty()
	@Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
		message: 'targetMonth must be in YYYY-MM format',
	})
	@IsSafeString()
	public targetMonth?: string;

	@Column({ type: 'varchar', length: 100, nullable: true })
	@IsString()
	@IsNotEmpty()
	@IsSafeString()
	@MaxLength(100)
	public category?: string;

	@Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
	@IsNumber(
		{ maxDecimalPlaces: 2 },
		{ message: 'limit must be a number with up to 2 decimal places' }
	)
	@Min(0)
	public limit?: number;

	@Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
	@IsNumber(
		{ maxDecimalPlaces: 2 },
		{ message: 'savingsGoal must be a number with up to 2 decimal places' }
	)
	@Min(0)
	@Validate(LimitNotExceedSavingsGoal)
	public savingsGoal?: number;

	@Column(`varchar`, { length: 100, nullable: true })
	@IsNotEmpty()
	@IsString()
	@IsSafeString()
	public userId?: string;
}
