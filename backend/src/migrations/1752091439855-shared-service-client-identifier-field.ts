import { MigrationInterface, QueryRunner } from 'typeorm'

export class SharedServiceClientIdentifierField1752091439855 implements MigrationInterface {
  name = 'SharedServiceClientIdentifierField1752091439855'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tms"."SharedService" ADD "client_identifier" character varying(55)`,
    )
    await queryRunner.query(
      `UPDATE "tms"."SharedService" SET "client_identifier" = 'client-' || id WHERE "client_identifier" IS NULL`,
    )
    await queryRunner.query(
      `ALTER TABLE "tms"."SharedService" ALTER COLUMN "client_identifier" SET NOT NULL`,
    )
    await queryRunner.query(
      `ALTER TABLE "tms"."SharedService" ADD CONSTRAINT "UQ_e547fdcd605e5ebce8d8a6a9102" UNIQUE ("client_identifier")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tms"."SharedService" DROP CONSTRAINT "UQ_e547fdcd605e5ebce8d8a6a9102"`,
    )
    await queryRunner.query(
      `ALTER TABLE "tms"."SharedService" DROP COLUMN "client_identifier"`,
    )
  }
}
