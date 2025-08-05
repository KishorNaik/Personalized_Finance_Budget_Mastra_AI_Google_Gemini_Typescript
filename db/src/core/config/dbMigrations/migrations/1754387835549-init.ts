import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1754387835549 implements MigrationInterface {
    name = 'Init1754387835549'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "user"`);
        await queryRunner.query(`CREATE TYPE "user"."user_status_enum" AS ENUM('1', '0')`);
        await queryRunner.query(`CREATE TABLE "user"."user" ("id" BIGSERIAL NOT NULL, "identifier" character varying(50) NOT NULL, "status" "user"."user_status_enum" NOT NULL DEFAULT '0', "created_date" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "modified_date" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "version" integer NOT NULL, "userName" character varying(100) NOT NULL, "salt" text, "hash" text, "userId" character varying NOT NULL, CONSTRAINT "REL_d72ea127f30e21753c9e229891" UNIQUE ("userId"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7efb296eadd258e554e84fa6eb" ON "user"."user" ("identifier") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_da5934070b5f2726ebfd3122c8" ON "user"."user" ("userName") `);
        await queryRunner.query(`DROP INDEX "user"."IDX_da5934070b5f2726ebfd3122c8"`);
        await queryRunner.query(`ALTER TABLE "user"."user" DROP COLUMN "userName"`);
        await queryRunner.query(`ALTER TABLE "user"."user" DROP COLUMN "salt"`);
        await queryRunner.query(`ALTER TABLE "user"."user" DROP COLUMN "hash"`);
        await queryRunner.query(`ALTER TABLE "user"."user" DROP CONSTRAINT "REL_d72ea127f30e21753c9e229891"`);
        await queryRunner.query(`ALTER TABLE "user"."user" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "user"."user" ADD "userName" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user"."user" ADD "salt" text`);
        await queryRunner.query(`ALTER TABLE "user"."user" ADD "hash" text`);
        await queryRunner.query(`ALTER TABLE "user"."user" ADD "userId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user"."user" ADD CONSTRAINT "UQ_d72ea127f30e21753c9e229891e" UNIQUE ("userId")`);
        await queryRunner.query(`ALTER TABLE "user"."user" ADD "firstName" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user"."user" ADD "lastName" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user"."user" ADD "email" character varying(100) NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_da5934070b5f2726ebfd3122c8" ON "user"."user" ("userName") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e12875dfb3b1d92d7d7c5377e2" ON "user"."user" ("email") `);
        await queryRunner.query(`ALTER TABLE "user"."user" ADD CONSTRAINT "FK_d72ea127f30e21753c9e229891e" FOREIGN KEY ("userId") REFERENCES "user"."user"("identifier") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user"."user" DROP CONSTRAINT "FK_d72ea127f30e21753c9e229891e"`);
        await queryRunner.query(`DROP INDEX "user"."IDX_e12875dfb3b1d92d7d7c5377e2"`);
        await queryRunner.query(`DROP INDEX "user"."IDX_da5934070b5f2726ebfd3122c8"`);
        await queryRunner.query(`ALTER TABLE "user"."user" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "user"."user" DROP COLUMN "lastName"`);
        await queryRunner.query(`ALTER TABLE "user"."user" DROP COLUMN "firstName"`);
        await queryRunner.query(`ALTER TABLE "user"."user" DROP CONSTRAINT "UQ_d72ea127f30e21753c9e229891e"`);
        await queryRunner.query(`ALTER TABLE "user"."user" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "user"."user" DROP COLUMN "hash"`);
        await queryRunner.query(`ALTER TABLE "user"."user" DROP COLUMN "salt"`);
        await queryRunner.query(`ALTER TABLE "user"."user" DROP COLUMN "userName"`);
        await queryRunner.query(`ALTER TABLE "user"."user" ADD "userId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user"."user" ADD CONSTRAINT "REL_d72ea127f30e21753c9e229891" UNIQUE ("userId")`);
        await queryRunner.query(`ALTER TABLE "user"."user" ADD "hash" text`);
        await queryRunner.query(`ALTER TABLE "user"."user" ADD "salt" text`);
        await queryRunner.query(`ALTER TABLE "user"."user" ADD "userName" character varying(100) NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_da5934070b5f2726ebfd3122c8" ON "user"."user" ("userName") `);
        await queryRunner.query(`DROP INDEX "user"."IDX_da5934070b5f2726ebfd3122c8"`);
        await queryRunner.query(`DROP INDEX "user"."IDX_7efb296eadd258e554e84fa6eb"`);
        await queryRunner.query(`DROP TABLE "user"."user"`);
        await queryRunner.query(`DROP TYPE "user"."user_status_enum"`);
    }

}
