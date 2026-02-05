import { MigrationInterface, QueryRunner } from 'typeorm'

export class TenantRequests1750103784872 implements MigrationInterface {
  name = 'TenantRequests1750103784872'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "tms"."TenantRequest_status_enum" AS ENUM('NEW', 'APPROVED', 'REJECTED')`,
    )
    await queryRunner.query(
      `CREATE TABLE "tms"."TenantRequest" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(30) NOT NULL, "ministry_name" character varying(100) NOT NULL, "description" character varying(500), "status" "tms"."TenantRequest_status_enum" NOT NULL DEFAULT 'NEW', "requested_at" date NOT NULL DEFAULT now(), "decisioned_at" date, "rejection_reason" character varying(500), "created_datetime" date DEFAULT now(), "updated_datetime" date DEFAULT now(), "created_by" character(32), "updated_by" character(32), "requested_by" uuid, "decisioned_by" uuid, CONSTRAINT "PK_629b27592cf56fac32acbd62f38" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_e78e1e8a8b2d5adcaecb3797be" ON "tms"."TenantRequest" ("status") `,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_6234cf91c9c13073621ee9b386" ON "tms"."TenantRequest" ("requested_by") `,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_811d3e4421d8526f87231dbc11" ON "tms"."TenantRequest" ("decisioned_by") `,
    )
    await queryRunner.query(
      `ALTER TABLE "tms"."Tenant" ALTER COLUMN "description" DROP DEFAULT`,
    )
    await queryRunner.query(
      `ALTER TABLE "tms"."TenantRequest" ADD CONSTRAINT "FK_6234cf91c9c13073621ee9b3865" FOREIGN KEY ("requested_by") REFERENCES "tms"."SSOUser"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "tms"."TenantRequest" ADD CONSTRAINT "FK_811d3e4421d8526f87231dbc119" FOREIGN KEY ("decisioned_by") REFERENCES "tms"."SSOUser"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tms"."TenantRequest" DROP CONSTRAINT "FK_811d3e4421d8526f87231dbc119"`,
    )
    await queryRunner.query(
      `ALTER TABLE "tms"."TenantRequest" DROP CONSTRAINT "FK_6234cf91c9c13073621ee9b3865"`,
    )
    await queryRunner.query(
      `ALTER TABLE "tms"."Tenant" ALTER COLUMN "description" SET DEFAULT 'Default Tenant Description'`,
    )
    await queryRunner.query(`DROP INDEX "tms"."IDX_811d3e4421d8526f87231dbc11"`)
    await queryRunner.query(`DROP INDEX "tms"."IDX_6234cf91c9c13073621ee9b386"`)
    await queryRunner.query(`DROP INDEX "tms"."IDX_e78e1e8a8b2d5adcaecb3797be"`)
    await queryRunner.query(`DROP TABLE "tms"."TenantRequest"`)
    await queryRunner.query(`DROP TYPE "tms"."TenantRequest_status_enum"`)
  }
}
