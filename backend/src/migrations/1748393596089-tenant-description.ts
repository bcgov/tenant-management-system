import { MigrationInterface, QueryRunner } from 'typeorm'

export class TenantDescription1748393596089 implements MigrationInterface {
  name = 'TenantDescription1748393596089'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "tms"."Tenant" ADD "description" character varying(500) DEFAULT \'Default Tenant Description\'',
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "tms"."Tenant" DROP COLUMN "description"',
    )
  }
}
