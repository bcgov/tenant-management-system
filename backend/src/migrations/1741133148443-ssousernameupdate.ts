import { MigrationInterface, QueryRunner } from "typeorm";

export class Ssousernameupdate1741133148443 implements MigrationInterface {
    name = 'Ssousernameupdate1741133148443'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "SSOUser" ALTER COLUMN "user_name" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "SSOUser" ALTER COLUMN "user_name" SET NOT NULL`);
    }

}
