import { MigrationInterface, QueryRunner } from 'typeorm';

export class DailyOfferDetails0071700000000007 implements MigrationInterface {
  name = 'DailyOfferDetails0071700000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_daily_offers_productId_createdAt"`);
    await queryRunner.query(`
      ALTER TABLE "daily_offers"
      DROP COLUMN IF EXISTS "sellerNotes",
      DROP COLUMN IF EXISTS "offerDetails"
    `);
  }
}
