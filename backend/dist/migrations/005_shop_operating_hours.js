"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopOperatingHours0051700000000005 = void 0;
class ShopOperatingHours0051700000000005 {
    name = 'ShopOperatingHours0051700000000005';
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TYPE "shops_manualoverride_enum" AS ENUM ('none', 'force_open', 'force_closed')
    `);
        await queryRunner.query(`
      ALTER TABLE "shops"
      ADD COLUMN "operatingHours" jsonb,
      ADD COLUMN "manualOverride" "shops_manualoverride_enum" NOT NULL DEFAULT 'force_closed',
      ADD COLUMN "manualOverrideSetAt" TIMESTAMP
    `);
        await queryRunner.query(`
      UPDATE "shops"
      SET "manualOverride" = 'none'
      WHERE "openingTime" IS NOT NULL AND "closingTime" IS NOT NULL
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "shops"
      DROP COLUMN "manualOverrideSetAt",
      DROP COLUMN "manualOverride",
      DROP COLUMN "operatingHours"
    `);
        await queryRunner.query(`DROP TYPE "shops_manualoverride_enum"`);
    }
}
exports.ShopOperatingHours0051700000000005 = ShopOperatingHours0051700000000005;
//# sourceMappingURL=005_shop_operating_hours.js.map