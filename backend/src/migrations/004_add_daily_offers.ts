import { MigrationInterface, QueryRunner } from "typeorm"

export class AddDailyOffers0041700000000004 implements MigrationInterface {
    name = 'AddDailyOffers0041700000000004'

    public async up(queryRunner: QueryRunner): Promise<void> {
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
        `)
        
        await queryRunner.query(`CREATE INDEX "IDX_daily_offers_shopId" ON "daily_offers" ("shopId")`)
        await queryRunner.query(`CREATE INDEX "IDX_daily_offers_expiresAt" ON "daily_offers" ("expiresAt")`)
        await queryRunner.query(`CREATE INDEX "IDX_daily_offers_isActive" ON "daily_offers" ("isActive")`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "daily_offers"`)
    }
}
