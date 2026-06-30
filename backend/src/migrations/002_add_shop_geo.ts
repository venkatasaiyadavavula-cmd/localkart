import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShopGeo0021700000000002 implements MigrationInterface {
  name = 'AddShopGeo0021700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure PostGIS is enabled
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);

    // Add location column if not exists (for existing tables)
    await queryRunner.query(`
      ALTER TABLE "shops" 
      ADD COLUMN IF NOT EXISTS "location" geography(Point,4326)
    `);

    // Update location from lat/lng for existing rows
    await queryRunner.query(`
      UPDATE "shops" 
      SET "location" = ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography
      WHERE "location" IS NULL
    `);

    // Recreate spatial index
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_shops_location"`);
    await queryRunner.query(`CREATE INDEX "IDX_shops_location" ON "shops" USING GIST ("location");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_shops_location"`);
    await queryRunner.query(`ALTER TABLE "shops" DROP COLUMN IF EXISTS "location"`);
  }
}
