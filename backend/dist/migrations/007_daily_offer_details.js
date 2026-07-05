"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyOfferDetails0071700000000007 = void 0;
class DailyOfferDetails0071700000000007 {
    name = 'DailyOfferDetails0071700000000007';
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "daily_offers"
      ADD COLUMN IF NOT EXISTS "sellerNotes" text,
      ADD COLUMN IF NOT EXISTS "offerDetails" jsonb
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_daily_offers_productId_createdAt"
      ON "daily_offers" ("productId", "createdAt")
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_daily_offers_productId_createdAt"`);
        await queryRunner.query(`
      ALTER TABLE "daily_offers"
      DROP COLUMN IF EXISTS "sellerNotes",
      DROP COLUMN IF EXISTS "offerDetails"
    `);
    }
}
exports.DailyOfferDetails0071700000000007 = DailyOfferDetails0071700000000007;
//# sourceMappingURL=007_daily_offer_details.js.map