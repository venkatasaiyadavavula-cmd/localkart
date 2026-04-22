"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddShopGeo0021700000000002 = void 0;
class AddShopGeo0021700000000002 {
    name = 'AddShopGeo0021700000000002';
    async up(queryRunner) {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);
        await queryRunner.query(`
      ALTER TABLE "shops" 
      ADD COLUMN IF NOT EXISTS "location" geography(Point,4326)
    `);
        await queryRunner.query(`
      UPDATE "shops" 
      SET "location" = ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography
      WHERE "location" IS NULL
    `);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_shops_location"`);
        await queryRunner.query(`CREATE INDEX "IDX_shops_location" ON "shops" USING GIST ("location");`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_shops_location"`);
        await queryRunner.query(`ALTER TABLE "shops" DROP COLUMN IF EXISTS "location"`);
    }
}
exports.AddShopGeo0021700000000002 = AddShopGeo0021700000000002;
//# sourceMappingURL=002_add_shop_geo.js.map