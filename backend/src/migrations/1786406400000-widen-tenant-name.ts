import { MigrationInterface, QueryRunner } from 'typeorm'

const TABLES = ['Tenant', 'TenantRequest']

export class WidenTenantName1786406400000 implements MigrationInterface {
  name = 'WidenTenantName1786406400000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of TABLES) {
      await queryRunner.query(
        `DO $$
         BEGIN
           IF EXISTS (
             SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'tms'
               AND table_name = '${table}'
               AND column_name = 'name'
               AND character_maximum_length <> 255
           ) THEN
             ALTER TABLE "tms"."${table}"
               ALTER COLUMN "name" TYPE character varying(255);
           END IF;
         END $$`,
      )
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of TABLES) {
      await queryRunner.query(
        `ALTER TABLE "tms"."${table}"
           ALTER COLUMN "name" TYPE character varying(30)`,
      )
    }
  }
}
