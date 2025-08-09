import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1754718169944 implements MigrationInterface {
	name = 'Init1754718169944';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "transaction"`);
		await queryRunner.query(
			`CREATE TYPE "transaction"."transactions_status_enum" AS ENUM('1', '0')`
		);
		await queryRunner.query(
			`CREATE TYPE "transaction"."transactions_type_enum" AS ENUM('income', 'expense')`
		);
		await queryRunner.query(
			`CREATE TABLE "transaction"."transactions" ("id" BIGSERIAL NOT NULL, "identifier" character varying(50) NOT NULL, "status" "transaction"."transactions_status_enum" NOT NULL DEFAULT '0', "created_date" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "modified_date" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "version" integer NOT NULL, "type" "transaction"."transactions_type_enum", "amount" numeric(10,2), "title" character varying(100), "description" text, "date" date NOT NULL DEFAULT ('now'::text)::date, "category" character varying(100), "userId" character varying(100), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_e9feb02abe739e916923d96a66" ON "transaction"."transactions" ("identifier") `
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "transaction"."IDX_e9feb02abe739e916923d96a66"`);
		await queryRunner.query(`DROP TABLE "transaction"."transactions"`);
		await queryRunner.query(`DROP TYPE "transaction"."transactions_type_enum"`);
		await queryRunner.query(`DROP TYPE "transaction"."transactions_status_enum"`);
	}
}
