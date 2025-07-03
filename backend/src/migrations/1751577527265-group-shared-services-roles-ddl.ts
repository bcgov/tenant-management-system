import { MigrationInterface, QueryRunner } from "typeorm";

export class GroupSharedServicesRolesDdl1751577527265 implements MigrationInterface {
    name = 'GroupSharedServicesRolesDdl1751577527265'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tms"."GroupSharedServiceRole" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_datetime" date DEFAULT now(), "updated_datetime" date DEFAULT now(), "created_by" character(32), "updated_by" character(32), "is_deleted" boolean NOT NULL DEFAULT false, "group_id" uuid, "shared_service_role_id" uuid, CONSTRAINT "UQ_0cb69e862419d83c79125e5fbae" UNIQUE ("group_id", "shared_service_role_id"), CONSTRAINT "PK_740d73d17a8baf2ee5e3991afc1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_426b1ce1f5a4159a3094b7fa86" ON "tms"."GroupSharedServiceRole" ("group_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_96d3a189b27736916dec081b9a" ON "tms"."GroupSharedServiceRole" ("shared_service_role_id") `);
        await queryRunner.query(`ALTER TABLE "tms"."GroupSharedServiceRole" ADD CONSTRAINT "FK_426b1ce1f5a4159a3094b7fa862" FOREIGN KEY ("group_id") REFERENCES "tms"."Group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tms"."GroupSharedServiceRole" ADD CONSTRAINT "FK_96d3a189b27736916dec081b9a7" FOREIGN KEY ("shared_service_role_id") REFERENCES "tms"."SharedServiceRole"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tms"."GroupSharedServiceRole" DROP CONSTRAINT "FK_96d3a189b27736916dec081b9a7"`);
        await queryRunner.query(`ALTER TABLE "tms"."GroupSharedServiceRole" DROP CONSTRAINT "FK_426b1ce1f5a4159a3094b7fa862"`);
        await queryRunner.query(`DROP INDEX "tms"."IDX_96d3a189b27736916dec081b9a"`);
        await queryRunner.query(`DROP INDEX "tms"."IDX_426b1ce1f5a4159a3094b7fa86"`);
        await queryRunner.query(`DROP TABLE "tms"."GroupSharedServiceRole"`);
    }

}
