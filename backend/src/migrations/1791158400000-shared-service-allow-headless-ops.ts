import { MigrationInterface, QueryRunner } from 'typeorm'

export class SharedServiceAllowHeadlessOps1791158400000 implements MigrationInterface {
  name = 'SharedServiceAllowHeadlessOps1791158400000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "tms"."SharedService" ADD COLUMN IF NOT EXISTS "allow_headless_ops" boolean NOT NULL DEFAULT false',
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "tms"."SharedService" DROP COLUMN IF EXISTS "allow_headless_ops"',
    )
  }
}
