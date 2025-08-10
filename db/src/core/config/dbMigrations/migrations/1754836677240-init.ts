import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1754836677240 implements MigrationInterface {
	name = 'Init1754836677240';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "goal"`);
		await queryRunner.query(`CREATE TYPE "goal"."goals_status_enum" AS ENUM('1', '0')`);
		await queryRunner.query(
			`CREATE TABLE "goal"."goals" ("id" BIGSERIAL NOT NULL, "identifier" character varying(50) NOT NULL, "status" "goal"."goals_status_enum" NOT NULL DEFAULT '0', "created_date" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "modified_date" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "version" integer NOT NULL, "targetMonth" character varying(7), "category" character varying(100), "limit" numeric(12,2), "savingsGoal" numeric(12,2), "userId" character varying(100), CONSTRAINT "UQ_ba5a005d5968114e26706f37889" UNIQUE ("targetMonth", "category"), CONSTRAINT "PK_26e17b251afab35580dff769223" PRIMARY KEY ("id"))`
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_2d13de67a73bb820007c787180" ON "goal"."goals" ("identifier") `
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "goal"."IDX_2d13de67a73bb820007c787180"`);
		await queryRunner.query(`DROP TABLE "goal"."goals"`);
		await queryRunner.query(`DROP TYPE "goal"."goals_status_enum"`);
	}
}
