import { MigrationInterface, QueryRunner } from "typeorm";

export class SharedServiceRoleIdpFields1757957973749 implements MigrationInterface {
    name = 'SharedServiceRoleIdpFields1757957973749'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tms"."SharedServiceRole" ADD "allowed_identity_providers" text array`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tms"."SharedServiceRole" DROP COLUMN "allowed_identity_providers"`);
    }

}
