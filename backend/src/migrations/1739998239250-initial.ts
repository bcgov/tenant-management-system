import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1739998239250 implements MigrationInterface {
    name = 'Initial1739998239250'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "Role" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "description" character varying(255), "created_datetime" TIMESTAMP NOT NULL DEFAULT now(), "updated_datetime" TIMESTAMP NOT NULL DEFAULT now(), "tenant_id" uuid, CONSTRAINT "PK_9309532197a7397548e341e5536" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "Tenant" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(30) NOT NULL, "ministry_name" character varying(100) NOT NULL, "created_datetime" TIMESTAMP NOT NULL DEFAULT now(), "updated_datetime" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_cebe9e163fad8d1d82343a48fba" UNIQUE ("name"), CONSTRAINT "PK_9ba54ddd56ce80e5b2d7523b6be" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "SSOUser" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sso_user_id" character varying(32) NOT NULL, "first_name" character varying(50) NOT NULL, "last_name" character varying(50) NOT NULL, "display_name" character varying(50) NOT NULL, "user_name" character varying(15) NOT NULL, "email" character varying(100) NOT NULL, "created_datetime" TIMESTAMP NOT NULL DEFAULT now(), "updated_datetime" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_5e01afdcafb2ed5003849635010" UNIQUE ("sso_user_id"), CONSTRAINT "UQ_909857dcf549542de44f4e0b6f1" UNIQUE ("email"), CONSTRAINT "PK_ab8af0ae45f5428cc22f836e143" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5e01afdcafb2ed500384963501" ON "SSOUser" ("sso_user_id") `);
        await queryRunner.query(`CREATE TABLE "TenantUser" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_datetime" TIMESTAMP NOT NULL DEFAULT now(), "updated_datetime" TIMESTAMP NOT NULL DEFAULT now(), "sso_id" uuid, "tenant_id" uuid, CONSTRAINT "PK_d8ca94ab78d13b325c78de120cb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b3809deecee8518a500de5761c" ON "TenantUser" ("sso_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_11edd3c26961777406c54e6d90" ON "TenantUser" ("tenant_id") `);
        await queryRunner.query(`CREATE TABLE "TenantUserRole" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_datetime" TIMESTAMP NOT NULL DEFAULT now(), "updated_datetime" TIMESTAMP NOT NULL DEFAULT now(), "tenant_user_id" uuid, "role_id" uuid, CONSTRAINT "PK_c17bb025da3281480759bc84ac4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "Role" ADD CONSTRAINT "FK_9f4b09fc05dee164fcce24c67cd" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "TenantUser" ADD CONSTRAINT "FK_b3809deecee8518a500de5761c5" FOREIGN KEY ("sso_id") REFERENCES "SSOUser"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "TenantUser" ADD CONSTRAINT "FK_11edd3c26961777406c54e6d90c" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "TenantUserRole" ADD CONSTRAINT "FK_8efc63f4073795f132761e529dd" FOREIGN KEY ("tenant_user_id") REFERENCES "TenantUser"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "TenantUserRole" ADD CONSTRAINT "FK_80433a48436ffac856ec350ba68" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "TenantUserRole" DROP CONSTRAINT "FK_80433a48436ffac856ec350ba68"`);
        await queryRunner.query(`ALTER TABLE "TenantUserRole" DROP CONSTRAINT "FK_8efc63f4073795f132761e529dd"`);
        await queryRunner.query(`ALTER TABLE "TenantUser" DROP CONSTRAINT "FK_11edd3c26961777406c54e6d90c"`);
        await queryRunner.query(`ALTER TABLE "TenantUser" DROP CONSTRAINT "FK_b3809deecee8518a500de5761c5"`);
        await queryRunner.query(`ALTER TABLE "Role" DROP CONSTRAINT "FK_9f4b09fc05dee164fcce24c67cd"`);
        await queryRunner.query(`DROP TABLE "TenantUserRole"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_11edd3c26961777406c54e6d90"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b3809deecee8518a500de5761c"`);
        await queryRunner.query(`DROP TABLE "TenantUser"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5e01afdcafb2ed500384963501"`);
        await queryRunner.query(`DROP TABLE "SSOUser"`);
        await queryRunner.query(`DROP TABLE "Tenant"`);
        await queryRunner.query(`DROP TABLE "Role"`);
    }

}
