import { MigrationInterface, QueryRunner } from "typeorm";

export class SetDefaultIdpType1761078430143 implements MigrationInterface {
    name = 'SetDefaultIdpType1761078430143'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE "tms"."SSOUser" SET "idp_type" = 'idir' WHERE "idp_type" IS NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE "tms"."SSOUser" SET "idp_type" = NULL WHERE "idp_type" = 'idir'`);
    }
}
