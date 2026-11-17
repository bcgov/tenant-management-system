import { MigrationInterface, QueryRunner } from 'typeorm'

export class TenantRequestTimestamps1794518400000 implements MigrationInterface {
  name = 'TenantRequestTimestamps1794518400000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DO $$
       BEGIN
         IF EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'tms'
             AND table_name = 'TenantRequest'
             AND column_name = 'requested_at'
             AND data_type = 'date'
         ) THEN
           ALTER TABLE "tms"."TenantRequest"
             ALTER COLUMN "requested_at" TYPE timestamp with time zone
               USING ("requested_at" + time '12:00') AT TIME ZONE 'UTC',
             ALTER COLUMN "decisioned_at" TYPE timestamp with time zone
               USING ("decisioned_at" + time '12:00') AT TIME ZONE 'UTC',
             ALTER COLUMN "created_datetime" TYPE timestamp with time zone
               USING ("created_datetime" + time '12:00') AT TIME ZONE 'UTC',
             ALTER COLUMN "updated_datetime" TYPE timestamp with time zone
               USING ("updated_datetime" + time '12:00') AT TIME ZONE 'UTC';
         END IF;
       END $$`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tms"."TenantRequest"
         ALTER COLUMN "requested_at" TYPE date
           USING ("requested_at" AT TIME ZONE 'UTC')::date,
         ALTER COLUMN "decisioned_at" TYPE date
           USING ("decisioned_at" AT TIME ZONE 'UTC')::date,
         ALTER COLUMN "created_datetime" TYPE date
           USING ("created_datetime" AT TIME ZONE 'UTC')::date,
         ALTER COLUMN "updated_datetime" TYPE date
           USING ("updated_datetime" AT TIME ZONE 'UTC')::date`,
    )
  }
}
