import { MigrationInterface, QueryRunner } from 'typeorm'

export class GroupDdl1750715038746 implements MigrationInterface {
  name = 'GroupDdl1750715038746'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tms"."Group" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(30) NOT NULL, "description" character varying(500), "created_datetime" date DEFAULT now(), "updated_datetime" date DEFAULT now(), "created_by" character(32), "updated_by" character(32), "tenant_id" uuid, CONSTRAINT "UQ_78ebbdb31883cebfb45a5c55ce7" UNIQUE ("name", "tenant_id"), CONSTRAINT "PK_d064bd160defed65823032ee547" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_e6a328e3d694af1260fdce1e98" ON "tms"."Group" ("tenant_id") `,
    )
    await queryRunner.query(
      `CREATE TABLE "tms"."GroupUser" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "is_deleted" boolean DEFAULT false, "created_datetime" date DEFAULT now(), "updated_datetime" date DEFAULT now(), "created_by" character(32), "updated_by" character(32), "tenant_user_id" uuid, "group_id" uuid, CONSTRAINT "PK_96b55c4155f1f88f67244d7bafd" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_f2306c979d3fe293a0f864c549" ON "tms"."GroupUser" ("tenant_user_id") `,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_2b1d643422a6594c91827cfd53" ON "tms"."GroupUser" ("group_id") `,
    )
    await queryRunner.query(
      `ALTER TABLE "tms"."Group" ADD CONSTRAINT "FK_e6a328e3d694af1260fdce1e98d" FOREIGN KEY ("tenant_id") REFERENCES "tms"."Tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "tms"."GroupUser" ADD CONSTRAINT "FK_f2306c979d3fe293a0f864c5493" FOREIGN KEY ("tenant_user_id") REFERENCES "tms"."TenantUser"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "tms"."GroupUser" ADD CONSTRAINT "FK_2b1d643422a6594c91827cfd53e" FOREIGN KEY ("group_id") REFERENCES "tms"."Group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tms"."GroupUser" DROP CONSTRAINT "FK_2b1d643422a6594c91827cfd53e"`,
    )
    await queryRunner.query(
      `ALTER TABLE "tms"."GroupUser" DROP CONSTRAINT "FK_f2306c979d3fe293a0f864c5493"`,
    )
    await queryRunner.query(
      `ALTER TABLE "tms"."Group" DROP CONSTRAINT "FK_e6a328e3d694af1260fdce1e98d"`,
    )
    await queryRunner.query(`DROP INDEX "tms"."IDX_2b1d643422a6594c91827cfd53"`)
    await queryRunner.query(`DROP INDEX "tms"."IDX_f2306c979d3fe293a0f864c549"`)
    await queryRunner.query(`DROP TABLE "tms"."GroupUser"`)
    await queryRunner.query(`DROP INDEX "tms"."IDX_e6a328e3d694af1260fdce1e98"`)
    await queryRunner.query(`DROP TABLE "tms"."Group"`)
  }
}
