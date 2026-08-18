import { MigrationInterface, QueryRunner } from 'typeorm'

export class SsoUserIdCaseInsensitive1785369600000 implements MigrationInterface {
  name = 'SsoUserIdCaseInsensitive1785369600000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS citext')

    const duplicates: { sso_user_id: string; variants: string }[] =
      await queryRunner.query(
        `SELECT lower("sso_user_id") AS sso_user_id, string_agg("sso_user_id", ', ') AS variants
         FROM "tms"."SSOUser"
         GROUP BY lower("sso_user_id")
         HAVING count(*) > 1`,
      )

    if (duplicates.length > 0) {
      const detail = duplicates.map((row) => row.variants).join(' | ')
      throw new Error(
        `Cannot convert sso_user_id to citext: ${duplicates.length} GUID(s) exist under more than one casing and must be merged first: ${detail}`,
      )
    }

    await queryRunner.query(
      `UPDATE "tms"."SSOUser"
       SET "sso_user_id" = upper("sso_user_id")
       WHERE "sso_user_id"::text <> upper("sso_user_id"::text)`,
    )

    await queryRunner.query(
      `DO $$
       BEGIN
         IF EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'tms'
             AND table_name = 'SSOUser'
             AND column_name = 'sso_user_id'
             AND udt_name <> 'citext'
         ) THEN
           ALTER TABLE "tms"."SSOUser" ALTER COLUMN "sso_user_id" TYPE citext;
         END IF;
       END $$`,
    )

    await queryRunner.query(
      'ALTER TABLE "tms"."SSOUser" DROP CONSTRAINT IF EXISTS "CHK_SSOUser_sso_user_id_length"',
    )
    await queryRunner.query(
      'ALTER TABLE "tms"."SSOUser" ADD CONSTRAINT "CHK_SSOUser_sso_user_id_length" CHECK (char_length("sso_user_id") <= 32)',
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "tms"."SSOUser" DROP CONSTRAINT IF EXISTS "CHK_SSOUser_sso_user_id_length"',
    )
    await queryRunner.query(
      'ALTER TABLE "tms"."SSOUser" ALTER COLUMN "sso_user_id" TYPE character varying(32) USING "sso_user_id"::character varying(32)',
    )
  }
}
