"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddDailyOffers0041700000000004 = void 0;
class AddDailyOffers0041700000000004 {
    name = 'AddDailyOffers0041700000000004';
    async up(queryRunner) {
        await queryRunner.query(`
            CREATE TABLE "daily_offers" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "shopId" uuid NOT NULL,
                "productId" uuid NOT NULL,
                "offerPrice" decimal(12,2) NOT NULL,
                "originalPrice" decimal(12,2) NOT NULL,
                "discountPercentage" integer NOT NULL,
                "startsAt" TIMESTAMP NOT NULL DEFAULT now(),
                "expiresAt" TIMESTAMP NOT NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_daily_offers" PRIMARY KEY ("id"),
                CONSTRAINT "FK_daily_offers_shop" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_daily_offers_product" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_daily_offers_shopId" ON "daily_offers" ("shopId")`);
        await queryRunner.query(`CREATE INDEX "IDX_daily_offers_expiresAt" ON "daily_offers" ("expiresAt")`);
        await queryRunner.query(`CREATE INDEX "IDX_daily_offers_isActive" ON "daily_offers" ("isActive")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "daily_offers"`);
    }
}
exports.AddDailyOffers0041700000000004 = AddDailyOffers0041700000000004;
//# sourceMappingURL=004_add_daily_offers.js.map