import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdCampaignCharges0201700000000020 implements MigrationInterface {
  name = 'AdCampaignCharges0201700000000020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "commission_bills"
      ADD COLUMN IF NOT EXISTS "adCampaignFees" numeric(12,2) NOT NULL DEFAULT 0;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ad_campaign_charges" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "shopId" uuid NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        "productId" uuid,
        "sponsoredProductId" uuid,
        "featuredVideoId" uuid,
        "commissionBillId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ad_campaign_charges" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ad_campaign_charges_shop" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ad_campaign_charges_bill" FOREIGN KEY ("commissionBillId") REFERENCES "commission_bills"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ad_campaign_charges_shop_created"
      ON "ad_campaign_charges" ("shopId", "createdAt");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ad_campaign_charges_bill"
      ON "ad_campaign_charges" ("commissionBillId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "ad_campaign_charges";`);
    await queryRunner.query(`
      ALTER TABLE "commission_bills" DROP COLUMN IF EXISTS "adCampaignFees";
    `);
  }
}
