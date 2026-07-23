import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Orders marked delivered before deliveredAt was consistently set have NULL
 * deliveredAt, which breaks revenue/dashboard/commission date filtering.
 */
export class BackfillOrderDeliveredAt0181700000000018 implements MigrationInterface {
  name = 'BackfillOrderDeliveredAt0181700000000018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "orders"
      SET "deliveredAt" = COALESCE("updatedAt", "createdAt", NOW())
      WHERE "deliveredAt" IS NULL
        AND "status" IN ('delivered', 'return_requested', 'returned')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Non-reversible: cannot distinguish backfilled rows from legitimately set timestamps.
    await queryRunner.query(`SELECT 1`);
  }
}
