import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShopPhone0251700000000025 implements MigrationInterface {
  name = 'AddShopPhone0251700000000025';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "shops"
      ADD COLUMN IF NOT EXISTS "phone" character varying(20);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "shops" DROP COLUMN IF EXISTS "phone";
    `);
  }
}
