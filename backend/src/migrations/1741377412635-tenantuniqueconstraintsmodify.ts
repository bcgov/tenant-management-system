import { MigrationInterface, QueryRunner } from "typeorm";

export class Tenantnameallowduplicate1741377412635 implements MigrationInterface {
    name = 'Tenantnameallowduplicate1741377412635'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Tenant" DROP CONSTRAINT "UQ_cebe9e163fad8d1d82343a48fba"`);
        await queryRunner.query(`ALTER TABLE "Tenant" ADD CONSTRAINT "UQ_2f32e7a09cc4e2a8f3b4ed082ab" UNIQUE ("name", "ministry_name")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Tenant" DROP CONSTRAINT "UQ_2f32e7a09cc4e2a8f3b4ed082ab"`);
        await queryRunner.query(`ALTER TABLE "Tenant" ADD CONSTRAINT "UQ_cebe9e163fad8d1d82343a48fba" UNIQUE ("name")`);
    }

}
