import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveBasicBceidAccess1781471491448 implements MigrationInterface {
  name = 'RemoveBasicBceidAccess1781471491448'

  public async up(queryRunner: QueryRunner) {
    await queryRunner.query(`
      UPDATE "tms"."TenantUserRole" tur
      SET
        "is_deleted" = true,
        "updated_datetime" = now(),
        "updated_by" = 'system'
      FROM "tms"."TenantUser" tu
      INNER JOIN "tms"."SSOUser" su ON su."id" = tu."sso_id"
      WHERE tur."tenant_user_id" = tu."id"
        AND su."idp_type" = 'bceidbasic'
        AND tur."is_deleted" = false
    `)

    await queryRunner.query(`
      UPDATE "tms"."GroupUser" gu
      SET
        "is_deleted" = true,
        "updated_datetime" = now(),
        "updated_by" = 'system'
      FROM "tms"."TenantUser" tu
      INNER JOIN "tms"."SSOUser" su ON su."id" = tu."sso_id"
      WHERE gu."tenant_user_id" = tu."id"
        AND su."idp_type" = 'bceidbasic'
        AND gu."is_deleted" IS DISTINCT FROM true
    `)

    await queryRunner.query(`
      UPDATE "tms"."TenantUser" tu
      SET
        "is_deleted" = true,
        "updated_datetime" = now(),
        "updated_by" = 'system'
      FROM "tms"."SSOUser" su
      WHERE su."id" = tu."sso_id"
        AND su."idp_type" = 'bceidbasic'
        AND tu."is_deleted" = false
    `)

    await queryRunner.query(`
      UPDATE "tms"."SharedServiceRole"
      SET
        "allowed_identity_providers" = array_remove(
          "allowed_identity_providers",
          'bceidbasic'
        ),
        "updated_datetime" = now(),
        "updated_by" = 'system'
      WHERE "allowed_identity_providers" @> ARRAY['bceidbasic']::text[]
    `)
  }

  public async down() {
    // This migration intentionally does not restore removed IDP access.
  }
}
