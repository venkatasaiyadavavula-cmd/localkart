import { MigrationInterface, QueryRunner } from 'typeorm';

export class ShopOperatingHours0051700000000005 implements MigrationInterface {
  name = 'ShopOperatingHours0051700000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "shops_manualoverride_enum" AS ENUM ('none', 'force_open', 'force_closed')
    `);

    await queryRunner.query(`
      ALTER TABLE "shops"
      ADD COLUMN "operatingHours" jsonb,
      ADD COLUMN "manualOverride" "shops_manualoverride_enum" NOT NULL DEFAULT 'force_closed',
      ADD COLUMN "manualOverrideSetAt" TIMESTAMP
    `);

    // Existing shops with hours set should follow schedule, not stay force-closed
    await queryRunner.query(`
      UPDATE "shops"
      SET "manualOverride" = 'none'
      WHERE "openingTime" IS NOT NULL AND "closingTime" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "shops"
      DROP COLUMN "manualOverrideSetAt",
      DROP COLUMN "manualOverride",
      DROP COLUMN "operatingHours"
    `);
    await queryRunner.query(`DROP TYPE "shops_manualoverride_enum"`);
  }
}
