import { MigrationInterface, QueryRunner } from 'typeorm'

export class SetSsoUserIdptypeNotNull1779753600000 implements MigrationInterface {
  name = 'SetSsoUserIdptypeNotNull1779753600000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "tms"."SSOUser" ALTER COLUMN "idp_type" SET NOT NULL',
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "tms"."SSOUser" ALTER COLUMN "idp_type" DROP NOT NULL',
    )
  }
}
