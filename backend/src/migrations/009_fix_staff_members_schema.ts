import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Corrective migration for production DBs where staff_members was created
 * manually before 006 ran. CREATE TABLE IF NOT EXISTS in 006 skipped creation
 * but index creation still expected the full schema.
 */
export class FixStaffMembersSchema0091700000000009 implements MigrationInterface {
  name = 'FixStaffMembersSchema0091700000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'staff_members'
      ) AS exists
    `);

    if (!tableExists[0]?.exists) {
      return;
    }

    const columns: Array<{ column_name: string }> = await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'staff_members'
    `);
    const existing = new Set(columns.map((c) => c.column_name));

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

    if (!existing.has('shopId')) {
      await queryRunner.query(`
        ALTER TABLE "staff_members"
        ADD COLUMN "shopId" uuid
      `);
    }

    if (!existing.has('name')) {
      await queryRunner.query(`
        ALTER TABLE "staff_members"
        ADD COLUMN "name" varchar(100)
      `);
    }

    if (!existing.has('phone')) {
      await queryRunner.query(`
        ALTER TABLE "staff_members"
        ADD COLUMN "phone" varchar(15)
      `);
    }

    if (!existing.has('staffId')) {
      await queryRunner.query(`
        ALTER TABLE "staff_members"
        ADD COLUMN "staffId" varchar(30)
      `);
    }

    if (!existing.has('passwordHash')) {
      await queryRunner.query(`
        ALTER TABLE "staff_members"
        ADD COLUMN "passwordHash" varchar
      `);
    }

    if (!existing.has('role')) {
      await queryRunner.query(`
        ALTER TABLE "staff_members"
        ADD COLUMN "role" "staff_members_role_enum" NOT NULL DEFAULT 'worker'
      `);
    }

    if (!existing.has('status')) {
      await queryRunner.query(`
        ALTER TABLE "staff_members"
        ADD COLUMN "status" "staff_members_status_enum" NOT NULL DEFAULT 'active'
      `);
    }

    if (!existing.has('lastLoginAt')) {
      await queryRunner.query(`
        ALTER TABLE "staff_members"
        ADD COLUMN "lastLoginAt" TIMESTAMP
      `);
    }

    if (!existing.has('note')) {
      await queryRunner.query(`
        ALTER TABLE "staff_members"
        ADD COLUMN "note" varchar(500)
      `);
    }

    if (!existing.has('createdAt')) {
      await queryRunner.query(`
        ALTER TABLE "staff_members"
        ADD COLUMN "createdAt" TIMESTAMP NOT NULL DEFAULT now()
      `);
    }

    if (!existing.has('updatedAt')) {
      await queryRunner.query(`
        ALTER TABLE "staff_members"
        ADD COLUMN "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      `);
    }

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "staff_members"
        ADD CONSTRAINT "FK_staff_members_shop"
        FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "staff_members"
        ADD CONSTRAINT "UQ_staff_members_phone" UNIQUE ("phone");
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "staff_members"
        ADD CONSTRAINT "UQ_staff_members_staffId" UNIQUE ("staffId");
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
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
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_staff_members_staffId_shopId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_staff_members_shopId_status"`);
  }
}
