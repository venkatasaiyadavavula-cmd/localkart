import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drop legacy `amount` column on commission_bills.
 * Production DB had NOT NULL `amount` from an early schema; the app uses `commissionAmount` only.
 * Weekly bill generation (commission.service generateWeeklyBillForShop) never set `amount`, causing INSERT failures.
 */
export class DropCommissionBillsLegacyAmount0151700000000015 implements MigrationInterface {
  name = 'DropCommissionBillsLegacyAmount0151700000000015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "commission_bills"
      DROP COLUMN IF EXISTS "amount";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "commission_bills"
      ADD COLUMN IF NOT EXISTS "amount" numeric(10,2);
    `);
    await queryRunner.query(`
      UPDATE "commission_bills"
      SET "amount" = "commissionAmount"
      WHERE "amount" IS NULL;
    `);
  }
}
