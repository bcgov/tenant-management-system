import { MigrationInterface, QueryRunner } from 'typeorm'

export class InitialDdl1745613711840 implements MigrationInterface {
  name = 'InitialDdl1745613711840'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE "tms"."Tenant" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(30) NOT NULL, "ministry_name" character varying(100) NOT NULL, "created_datetime" date DEFAULT now(), "updated_datetime" date DEFAULT now(), "created_by" character(32), "updated_by" character(32), CONSTRAINT "UQ_2f32e7a09cc4e2a8f3b4ed082ab" UNIQUE ("name", "ministry_name"), CONSTRAINT "PK_9ba54ddd56ce80e5b2d7523b6be" PRIMARY KEY ("id"))',
    )
    await queryRunner.query(
      'CREATE TABLE "tms"."SSOUser" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sso_user_id" character varying(32) NOT NULL, "first_name" character varying(50) NOT NULL, "last_name" character varying(50) NOT NULL, "display_name" character varying(50) NOT NULL, "user_name" character varying(15), "email" character varying(100) NOT NULL, "created_datetime" date DEFAULT now(), "updated_datetime" date DEFAULT now(), "created_by" character(32), "updated_by" character(32), CONSTRAINT "UQ_5e01afdcafb2ed5003849635010" UNIQUE ("sso_user_id"), CONSTRAINT "UQ_909857dcf549542de44f4e0b6f1" UNIQUE ("email"), CONSTRAINT "PK_ab8af0ae45f5428cc22f836e143" PRIMARY KEY ("id"))',
    )
    await queryRunner.query(
      'CREATE INDEX "IDX_5e01afdcafb2ed500384963501" ON "tms"."SSOUser" ("sso_user_id") ',
    )
    await queryRunner.query(
      'CREATE TABLE "tms"."TenantUser" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_datetime" date DEFAULT now(), "updated_datetime" date DEFAULT now(), "created_by" character(32), "updated_by" character(32), "sso_id" uuid, "tenant_id" uuid, CONSTRAINT "PK_d8ca94ab78d13b325c78de120cb" PRIMARY KEY ("id"))',
    )
    await queryRunner.query(
      'CREATE INDEX "IDX_b3809deecee8518a500de5761c" ON "tms"."TenantUser" ("sso_id") ',
    )
    await queryRunner.query(
      'CREATE INDEX "IDX_11edd3c26961777406c54e6d90" ON "tms"."TenantUser" ("tenant_id") ',
    )
    await queryRunner.query(
      'CREATE TABLE "tms"."Role" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "description" character varying(255), "created_datetime" date DEFAULT now(), "updated_datetime" date DEFAULT now(), "created_by" character(32), "updated_by" character(32), CONSTRAINT "PK_9309532197a7397548e341e5536" PRIMARY KEY ("id"))',
    )
    await queryRunner.query(
      'CREATE TABLE "tms"."TenantUserRole" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_datetime" date DEFAULT now(), "updated_datetime" date DEFAULT now(), "created_by" character(32), "updated_by" character(32), "tenant_user_id" uuid, "role_id" uuid, CONSTRAINT "PK_c17bb025da3281480759bc84ac4" PRIMARY KEY ("id"))',
    )
    await queryRunner.query(
      'ALTER TABLE "tms"."TenantUser" ADD CONSTRAINT "FK_b3809deecee8518a500de5761c5" FOREIGN KEY ("sso_id") REFERENCES "tms"."SSOUser"("id") ON DELETE NO ACTION ON UPDATE NO ACTION',
    )
    await queryRunner.query(
      'ALTER TABLE "tms"."TenantUser" ADD CONSTRAINT "FK_11edd3c26961777406c54e6d90c" FOREIGN KEY ("tenant_id") REFERENCES "tms"."Tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
    )
    await queryRunner.query(
      'ALTER TABLE "tms"."TenantUserRole" ADD CONSTRAINT "FK_8efc63f4073795f132761e529dd" FOREIGN KEY ("tenant_user_id") REFERENCES "tms"."TenantUser"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
    )
    await queryRunner.query(
      'ALTER TABLE "tms"."TenantUserRole" ADD CONSTRAINT "FK_80433a48436ffac856ec350ba68" FOREIGN KEY ("role_id") REFERENCES "tms"."Role"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "tms"."TenantUserRole" DROP CONSTRAINT "FK_80433a48436ffac856ec350ba68"',
    )
    await queryRunner.query(
      'ALTER TABLE "tms"."TenantUserRole" DROP CONSTRAINT "FK_8efc63f4073795f132761e529dd"',
    )
    await queryRunner.query(
      'ALTER TABLE "tms"."TenantUser" DROP CONSTRAINT "FK_11edd3c26961777406c54e6d90c"',
    )
    await queryRunner.query(
      'ALTER TABLE "tms"."TenantUser" DROP CONSTRAINT "FK_b3809deecee8518a500de5761c5"',
    )
    await queryRunner.query('DROP TABLE "tms"."TenantUserRole"')
    await queryRunner.query('DROP TABLE "tms"."Role"')
    await queryRunner.query('DROP INDEX "IDX_11edd3c26961777406c54e6d90"')
    await queryRunner.query('DROP INDEX "IDX_b3809deecee8518a500de5761c"')
    await queryRunner.query('DROP TABLE "tms"."TenantUser"')
    await queryRunner.query('DROP INDEX "IDX_5e01afdcafb2ed500384963501"')
    await queryRunner.query('DROP TABLE "tms"."SSOUser"')
    await queryRunner.query('DROP TABLE "tms"."Tenant"')
  }
}
