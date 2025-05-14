import { MigrationInterface, QueryRunner } from "typeorm";

export class RolesSoftdelete1747174712038 implements MigrationInterface {
    name = 'RolesSoftdelete1747174712038'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "TenantUserRole" ADD "is_deleted" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "TenantUserRole" DROP COLUMN "is_deleted"`);
    }

}
