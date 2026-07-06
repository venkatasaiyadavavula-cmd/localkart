import { MigrationInterface, QueryRunner } from 'typeorm';
import { ensureStaffMembersColumns } from './helpers/ensure-staff-members-columns';

/**
 * Safety-net migration for DBs where 006 ran before the column-fix helper existed.
 * Idempotent — no-ops when schema is already correct.
 */
export class FixStaffMembersSchema0091700000000009 implements MigrationInterface {
  name = 'FixStaffMembersSchema0091700000000009';

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

    await ensureStaffMembersColumns(queryRunner);

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
