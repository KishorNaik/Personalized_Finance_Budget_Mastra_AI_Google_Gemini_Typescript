import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1754388862438 implements MigrationInterface {
    name = 'Init1754388862438'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "user"`);
        await queryRunner.query(`CREATE TYPE "user"."credentials_status_enum" AS ENUM('1', '0')`);
        await queryRunner.query(`CREATE TABLE "user"."credentials" ("id" BIGSERIAL NOT NULL, "identifier" character varying(50) NOT NULL, "status" "user"."credentials_status_enum" NOT NULL DEFAULT '0', "created_date" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "modified_date" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "version" integer NOT NULL, "userName" character varying(100) NOT NULL, "salt" text, "hash" text, "userId" character varying NOT NULL, CONSTRAINT "REL_8d3a07b8e994962efe57ebd0f2" UNIQUE ("userId"), CONSTRAINT "PK_1e38bc43be6697cdda548ad27a6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c131be461da89e968b94b75e5b" ON "user"."credentials" ("identifier") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_307c5fbd835df9008958457edc" ON "user"."credentials" ("userName") `);
        await queryRunner.query(`CREATE TYPE "user"."user_status_enum" AS ENUM('1', '0')`);
        await queryRunner.query(`CREATE TABLE "user"."user" ("id" BIGSERIAL NOT NULL, "identifier" character varying(50) NOT NULL, "status" "user"."user_status_enum" NOT NULL DEFAULT '0', "created_date" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "modified_date" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "version" integer NOT NULL, "firstName" character varying(100) NOT NULL, "lastName" character varying(100) NOT NULL, "email" character varying(100) NOT NULL, CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7efb296eadd258e554e84fa6eb" ON "user"."user" ("identifier") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e12875dfb3b1d92d7d7c5377e2" ON "user"."user" ("email") `);
        await queryRunner.query(`ALTER TABLE "user"."credentials" ADD CONSTRAINT "FK_8d3a07b8e994962efe57ebd0f20" FOREIGN KEY ("userId") REFERENCES "user"."user"("identifier") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user"."credentials" DROP CONSTRAINT "FK_8d3a07b8e994962efe57ebd0f20"`);
        await queryRunner.query(`DROP INDEX "user"."IDX_e12875dfb3b1d92d7d7c5377e2"`);
        await queryRunner.query(`DROP INDEX "user"."IDX_7efb296eadd258e554e84fa6eb"`);
        await queryRunner.query(`DROP TABLE "user"."user"`);
        await queryRunner.query(`DROP TYPE "user"."user_status_enum"`);
        await queryRunner.query(`DROP INDEX "user"."IDX_307c5fbd835df9008958457edc"`);
        await queryRunner.query(`DROP INDEX "user"."IDX_c131be461da89e968b94b75e5b"`);
        await queryRunner.query(`DROP TABLE "user"."credentials"`);
        await queryRunner.query(`DROP TYPE "user"."credentials_status_enum"`);
    }

}
