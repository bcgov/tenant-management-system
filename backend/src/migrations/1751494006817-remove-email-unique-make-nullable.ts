import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveEmailUniqueMakeNullable1751494006817 implements MigrationInterface {
    name = 'RemoveEmailUniqueMakeNullable1751494006817'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "SSOUser" ALTER COLUMN "email" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "SSOUser" DROP CONSTRAINT "UQ_909857dcf549542de44f4e0b6f1"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "SSOUser" ADD CONSTRAINT "UQ_909857dcf549542de44f4e0b6f1" UNIQUE ("email")`);
        await queryRunner.query(`ALTER TABLE "SSOUser" ALTER COLUMN "email" SET NOT NULL`);
    }

}
