import { MigrationInterface, QueryRunner } from 'typeorm'

export class GroupTenantsharedserviceShareserviceRoleTenrequestIndexes1773435844664 implements MigrationInterface {
  name =
    'GroupTenantsharedserviceShareserviceRoleTenrequestIndexes1773435844664'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE INDEX "idx_groupuser_group_access" ON "tms"."GroupUser" ("group_id", "is_deleted") ',
    )
    await queryRunner.query(
      'CREATE INDEX "idx_groupuser_tenantuser_access" ON "tms"."GroupUser" ("tenant_user_id", "is_deleted") ',
    )
    await queryRunner.query(
      'CREATE INDEX "idx_sharedservicerole_service_access" ON "tms"."SharedServiceRole" ("shared_service_id", "is_deleted") ',
    )
    await queryRunner.query(
      'CREATE INDEX "idx_tenantsharedservice_tenant_access" ON "tms"."TenantSharedService" ("tenant_id", "is_deleted") ',
    )
    await queryRunner.query(
      'CREATE INDEX "idx_tenantrequest_status_requestedat" ON "tms"."TenantRequest" ("status", "requested_at") ',
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX "tms"."idx_tenantrequest_status_requestedat"',
    )
    await queryRunner.query(
      'DROP INDEX "tms"."idx_tenantsharedservice_tenant_access"',
    )
    await queryRunner.query(
      'DROP INDEX "tms"."idx_sharedservicerole_service_access"',
    )
    await queryRunner.query(
      'DROP INDEX "tms"."idx_groupuser_tenantuser_access"',
    )
    await queryRunner.query('DROP INDEX "tms"."idx_groupuser_group_access"')
  }
}
