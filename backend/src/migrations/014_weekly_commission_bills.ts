import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Weekly commission billing: billDate = Friday (due date), weekStartDate = Saturday.
 * Existing daily rows keep billDate as-is until merge script runs.
 */
export class WeeklyCommissionBills0141700000000014 implements MigrationInterface {
  name = 'WeeklyCommissionBills0141700000000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "commission_bills"
      ADD COLUMN IF NOT EXISTS "weekStartDate" date;
    `);

    await queryRunner.query(`
      UPDATE "commission_bills"
      SET "weekStartDate" = ("billDate"::date - INTERVAL '6 days')::date
      WHERE "weekStartDate" IS NULL;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_commission_bills_shop_week"
      ON "commission_bills" ("shopId", "billDate");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_commission_bills_shop_week";`);
    await queryRunner.query(`ALTER TABLE "commission_bills" DROP COLUMN IF EXISTS "weekStartDate";`);
  }
}
