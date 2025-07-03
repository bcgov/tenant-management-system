import { MigrationInterface, QueryRunner } from "typeorm";

export class TenantSharedServicesDdl1751321559873 implements MigrationInterface {
    name = 'TenantSharedServicesDdl1751321559873'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tms"."TenantSharedService" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "is_deleted" boolean NOT NULL DEFAULT false, "created_datetime" date DEFAULT now(), "updated_datetime" date DEFAULT now(), "created_by" character(32), "updated_by" character(32), "tenant_id" uuid, "shared_service_id" uuid, CONSTRAINT "UQ_7b4a751759b6bd874b949c24183" UNIQUE ("tenant_id", "shared_service_id"), CONSTRAINT "PK_5607aa654f09d65747adfc053ca" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "tms"."TenantSharedService" ADD CONSTRAINT "FK_b610fbe324e75337b9c2730d92c" FOREIGN KEY ("tenant_id") REFERENCES "tms"."Tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tms"."TenantSharedService" ADD CONSTRAINT "FK_92d265b5e64a56a23e55b00818a" FOREIGN KEY ("shared_service_id") REFERENCES "tms"."SharedService"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tms"."TenantSharedService" DROP CONSTRAINT "FK_92d265b5e64a56a23e55b00818a"`);
        await queryRunner.query(`ALTER TABLE "tms"."TenantSharedService" DROP CONSTRAINT "FK_b610fbe324e75337b9c2730d92c"`);
        await queryRunner.query(`DROP TABLE "tms"."TenantSharedService"`);
    }

}
