import { MigrationInterface, QueryRunner } from 'typeorm'

export class CompositeIndexesGroupsharedserviceroleTenantuserrole1755103625983 implements MigrationInterface {
  name = 'CompositeIndexesGroupsharedserviceroleTenantuserrole1755103625983'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE INDEX "idx_tenantuserrole_access" ON "tms"."TenantUserRole" ("tenant_user_id", "role_id", "is_deleted") ',
    )
    await queryRunner.query(
      'CREATE INDEX "idx_groupsharedservicerole_access" ON "tms"."GroupSharedServiceRole" ("group_id", "shared_service_role_id", "is_deleted") ',
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX "tms"."idx_groupsharedservicerole_access"',
    )
    await queryRunner.query('DROP INDEX "tms"."idx_tenantuserrole_access"')
  }
}
