import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShopDocumentUrls0261700000000026 implements MigrationInterface {
  name = 'AddShopDocumentUrls0261700000000026';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "shops"
      ADD COLUMN IF NOT EXISTS "fssaiDocumentUrl" character varying,
      ADD COLUMN IF NOT EXISTS "gstDocumentUrl" character varying,
      ADD COLUMN IF NOT EXISTS "panDocumentUrl" character varying,
      ADD COLUMN IF NOT EXISTS "shopPhotoUrl" character varying;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "shops"
      DROP COLUMN IF EXISTS "fssaiDocumentUrl",
      DROP COLUMN IF EXISTS "gstDocumentUrl",
      DROP COLUMN IF EXISTS "panDocumentUrl",
      DROP COLUMN IF EXISTS "shopPhotoUrl";
    `);
  }
}
