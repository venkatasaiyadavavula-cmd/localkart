import { MigrationInterface, QueryRunner } from 'typeorm';

/** Align orders table with entity: subtotal + optional finalAmount for mixed deployments. */
export class SyncOrdersColumns0101700000000010 implements MigrationInterface {
  name = 'SyncOrdersColumns0101700000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD COLUMN IF NOT EXISTS "subtotal" decimal(12,2)
    `);

    await queryRunner.query(`
      UPDATE "orders"
      SET "subtotal" = COALESCE("subtotal", "totalAmount", 0)
      WHERE "subtotal" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD COLUMN IF NOT EXISTS "finalAmount" decimal(12,2)
    `);

    await queryRunner.query(`
      UPDATE "orders"
      SET "finalAmount" = COALESCE("finalAmount", "totalAmount", 0)
      WHERE "finalAmount" IS NULL
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'orders' AND column_name = 'shippingAddress'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'orders' AND column_name = 'deliveryAddress'
        ) THEN
          NULL;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "finalAmount"`);
  }
}
