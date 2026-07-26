import { MigrationInterface, QueryRunner } from 'typeorm';

export class SponsoredProductPausedByAdmin0211700000000021 implements MigrationInterface {
  name = 'SponsoredProductPausedByAdmin0211700000000021';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sponsored_products"
      ADD COLUMN IF NOT EXISTS "pausedByAdmin" boolean NOT NULL DEFAULT false;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sponsored_products" DROP COLUMN IF EXISTS "pausedByAdmin";
    `);
  }
}
