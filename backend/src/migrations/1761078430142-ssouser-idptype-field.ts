import { MigrationInterface, QueryRunner } from "typeorm";

export class SsouserIdptypeField1761078430142 implements MigrationInterface {
    name = 'SsouserIdptypeField1761078430142'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tms"."SSOUser" ADD "idp_type" character varying(20)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tms"."SSOUser" DROP COLUMN "idp_type"`);
    }

}
