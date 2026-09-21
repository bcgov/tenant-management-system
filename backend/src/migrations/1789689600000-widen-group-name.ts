import { MigrationInterface, QueryRunner } from 'typeorm'

export class WidenGroupName1789689600000 implements MigrationInterface {
  name = 'WidenGroupName1789689600000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DO $$
       BEGIN
         IF EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'tms'
             AND table_name = 'Group'
             AND column_name = 'name'
             AND character_maximum_length <> 255
         ) THEN
           ALTER TABLE "tms"."Group"
             ALTER COLUMN "name" TYPE character varying(255);
         END IF;
       END $$`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tms"."Group"
         ALTER COLUMN "name" TYPE character varying(30)`,
    )
  }
}
