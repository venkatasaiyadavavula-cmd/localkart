import { MigrationInterface, QueryRunner } from 'typeorm';

export class CommissionBillAdminFields0161700000000016 implements MigrationInterface {
  name = 'CommissionBillAdminFields0161700000000016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "commission_bills"
      ADD COLUMN IF NOT EXISTS "adminPaymentRef" character varying,
      ADD COLUMN IF NOT EXISTS "adminNote" text;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "commission_bills"
      DROP COLUMN IF EXISTS "adminNote",
      DROP COLUMN IF EXISTS "adminPaymentRef";
    `);
  }
}
