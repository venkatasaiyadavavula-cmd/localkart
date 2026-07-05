import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStaffMembers0061700000000006 implements MigrationInterface {
  name = 'AddStaffMembers0061700000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "staff_members_role_enum" AS ENUM (
          'products_manager', 'delivery_staff', 'store_manager', 'worker'
        );
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "staff_members_status_enum" AS ENUM ('active', 'inactive');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "staff_members" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "shopId" uuid NOT NULL,
        "name" varchar(100) NOT NULL,
        "phone" varchar(15) NOT NULL,
        "staffId" varchar(30) NOT NULL,
        "passwordHash" varchar NOT NULL,
        "role" "staff_members_role_enum" NOT NULL DEFAULT 'worker',
        "status" "staff_members_status_enum" NOT NULL DEFAULT 'active',
        "lastLoginAt" TIMESTAMP,
        "note" varchar(500),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_staff_members" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_staff_members_phone" UNIQUE ("phone"),
        CONSTRAINT "UQ_staff_members_staffId" UNIQUE ("staffId"),
        CONSTRAINT "FK_staff_members_shop" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_staff_members_shopId_status"
      ON "staff_members" ("shopId", "status")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_staff_members_staffId_shopId"
      ON "staff_members" ("staffId", "shopId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "staff_members"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "staff_members_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "staff_members_role_enum"`);
  }
}
