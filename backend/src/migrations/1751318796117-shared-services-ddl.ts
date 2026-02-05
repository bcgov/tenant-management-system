import { MigrationInterface, QueryRunner } from 'typeorm'

export class SharedServicesDdl1751318796117 implements MigrationInterface {
  name = 'SharedServicesDdl1751318796117'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tms"."SharedServiceRole" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(30) NOT NULL, "description" character varying(255), "is_deleted" boolean NOT NULL DEFAULT false, "created_datetime" date DEFAULT now(), "updated_datetime" date DEFAULT now(), "created_by" character(32), "updated_by" character(32), "shared_service_id" uuid, CONSTRAINT "UQ_35f65a7627845a9ee9cd32a8500" UNIQUE ("name", "shared_service_id"), CONSTRAINT "PK_3a5c1871eeccf24a0febb538ec1" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "tms"."SharedService" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(30) NOT NULL, "description" character varying(500), "is_active" boolean NOT NULL DEFAULT true, "created_datetime" date DEFAULT now(), "updated_datetime" date DEFAULT now(), "created_by" character(32), "updated_by" character(32), CONSTRAINT "UQ_35c70a20324a112debd213ba675" UNIQUE ("name"), CONSTRAINT "PK_b44e08c18406a6c40067ace5015" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `ALTER TABLE "tms"."SharedServiceRole" ADD CONSTRAINT "FK_45eeb582f26e53234757c8cabad" FOREIGN KEY ("shared_service_id") REFERENCES "tms"."SharedService"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tms"."SharedServiceRole" DROP CONSTRAINT "FK_45eeb582f26e53234757c8cabad"`,
    )
    await queryRunner.query(`DROP TABLE "tms"."SharedService"`)
    await queryRunner.query(`DROP TABLE "tms"."SharedServiceRole"`)
  }
}
