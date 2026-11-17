import { MigrationInterface, QueryRunner } from 'typeorm'

export class SharedServiceServiceAccounts1794604800000 implements MigrationInterface {
  name = 'SharedServiceServiceAccounts1794604800000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "tms"."SharedService" ADD COLUMN IF NOT EXISTS "allow_service_accounts" boolean NOT NULL DEFAULT false',
    )
    await queryRunner.query(
      'ALTER TABLE "tms"."SharedService" ADD COLUMN IF NOT EXISTS "service_account_client_identifier" character varying(55)',
    )
    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "UQ_shared_service_service_account_client_identifier" ON "tms"."SharedService" ("service_account_client_identifier")',
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "tms"."UQ_shared_service_service_account_client_identifier"',
    )
    await queryRunner.query(
      'ALTER TABLE "tms"."SharedService" DROP COLUMN IF EXISTS "service_account_client_identifier"',
    )
    await queryRunner.query(
      'ALTER TABLE "tms"."SharedService" DROP COLUMN IF EXISTS "allow_service_accounts"',
    )
  }
}
