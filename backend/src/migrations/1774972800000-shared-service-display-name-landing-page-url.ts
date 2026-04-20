import { MigrationInterface, QueryRunner } from 'typeorm'

export class SharedServiceDisplayNameLandingPageUrl1774972800000 implements MigrationInterface {
  name = 'SharedServiceDisplayNameLandingPageUrl1774972800000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "tms"."SharedService" ADD "display_name" character varying(100)',
    )
    await queryRunner.query(
      'UPDATE "tms"."SharedService" SET "display_name" = "name" WHERE "display_name" IS NULL',
    )
    await queryRunner.query(
      'ALTER TABLE "tms"."SharedService" ALTER COLUMN "display_name" SET NOT NULL',
    )
    await queryRunner.query(
      'ALTER TABLE "tms"."SharedService" ADD CONSTRAINT "UQ_14c89ef5b13f0f4a8c53ef27414" UNIQUE ("display_name")',
    )
    await queryRunner.query(
      'ALTER TABLE "tms"."SharedService" ADD "landing_page_url" character varying(500)',
    )
    await queryRunner.query(
      'UPDATE "tms"."SharedService" SET "landing_page_url" = \'https://gov.bc.ca/invalid/shared-service/\' || id WHERE "landing_page_url" IS NULL',
    )
    await queryRunner.query(
      'ALTER TABLE "tms"."SharedService" ALTER COLUMN "landing_page_url" SET NOT NULL',
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "tms"."SharedService" DROP COLUMN "landing_page_url"',
    )
    await queryRunner.query(
      'ALTER TABLE "tms"."SharedService" DROP CONSTRAINT "UQ_14c89ef5b13f0f4a8c53ef27414"',
    )
    await queryRunner.query(
      'ALTER TABLE "tms"."SharedService" DROP COLUMN "display_name"',
    )
  }
}
