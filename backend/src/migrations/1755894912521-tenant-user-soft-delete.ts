import { MigrationInterface, QueryRunner } from 'typeorm'

export class TenantUserSoftDelete1755894912521 implements MigrationInterface {
  name = 'TenantUserSoftDelete1755894912521'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tms"."TenantUser" ADD "is_deleted" boolean NOT NULL DEFAULT false`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_58662cf1dcac9d05fd0cb00459" ON "tms"."TenantUser" ("sso_id", "is_deleted") `,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_330a706c5f6545d3a439338dfa" ON "tms"."TenantUser" ("tenant_id", "is_deleted") `,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "tms"."IDX_330a706c5f6545d3a439338dfa"`)
    await queryRunner.query(`DROP INDEX "tms"."IDX_58662cf1dcac9d05fd0cb00459"`)
    await queryRunner.query(
      `ALTER TABLE "tms"."TenantUser" DROP COLUMN "is_deleted"`,
    )
  }
}
