import { QueryRunner } from 'typeorm';

/**
 * Adds any missing staff_members columns on a pre-existing table before indexes run.
 * Safe to call when the table was created manually or via CREATE TABLE IF NOT EXISTS skip.
 */
export async function ensureStaffMembersColumns(queryRunner: QueryRunner): Promise<void> {
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

  if (!existing.has('shopId')) {
    await queryRunner.query(`ALTER TABLE "staff_members" ADD COLUMN "shopId" uuid`);
  }
  if (!existing.has('name')) {
    await queryRunner.query(`ALTER TABLE "staff_members" ADD COLUMN "name" varchar(100)`);
  }
  if (!existing.has('phone')) {
    await queryRunner.query(`ALTER TABLE "staff_members" ADD COLUMN "phone" varchar(15)`);
  }
  if (!existing.has('staffId')) {
    await queryRunner.query(`ALTER TABLE "staff_members" ADD COLUMN "staffId" varchar(30)`);
  }
  if (!existing.has('passwordHash')) {
    await queryRunner.query(`ALTER TABLE "staff_members" ADD COLUMN "passwordHash" varchar`);
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
    await queryRunner.query(`ALTER TABLE "staff_members" ADD COLUMN "lastLoginAt" TIMESTAMP`);
  }
  if (!existing.has('note')) {
    await queryRunner.query(`ALTER TABLE "staff_members" ADD COLUMN "note" varchar(500)`);
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
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_staff_members_shop'
      ) THEN
        ALTER TABLE "staff_members"
        ADD CONSTRAINT "FK_staff_members_shop"
        FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE;
      END IF;
    END $$;
  `);

  await queryRunner.query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'UQ_staff_members_phone'
      ) THEN
        ALTER TABLE "staff_members"
        ADD CONSTRAINT "UQ_staff_members_phone" UNIQUE ("phone");
      END IF;
    END $$;
  `);

  await queryRunner.query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'UQ_staff_members_staffId'
      ) THEN
        ALTER TABLE "staff_members"
        ADD CONSTRAINT "UQ_staff_members_staffId" UNIQUE ("staffId");
      END IF;
    END $$;
  `);
}
