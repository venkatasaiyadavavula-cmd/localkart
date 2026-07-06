"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixStaffMembersSchema0091700000000009 = void 0;
const ensure_staff_members_columns_1 = require("./helpers/ensure-staff-members-columns");
class FixStaffMembersSchema0091700000000009 {
    name = 'FixStaffMembersSchema0091700000000009';
    async up(queryRunner) {
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
        await (0, ensure_staff_members_columns_1.ensureStaffMembersColumns)(queryRunner);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_staff_members_shopId_status"
      ON "staff_members" ("shopId", "status")
    `);
        await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_staff_members_staffId_shopId"
      ON "staff_members" ("staffId", "shopId")
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_staff_members_staffId_shopId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_staff_members_shopId_status"`);
    }
}
exports.FixStaffMembersSchema0091700000000009 = FixStaffMembersSchema0091700000000009;
//# sourceMappingURL=009_fix_staff_members_schema.js.map