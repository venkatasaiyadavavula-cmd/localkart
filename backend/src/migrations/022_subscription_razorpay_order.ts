import { MigrationInterface, QueryRunner } from 'typeorm';

export class SubscriptionRazorpayOrder0221700000000022 implements MigrationInterface {
  name = 'SubscriptionRazorpayOrder0221700000000022';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD COLUMN IF NOT EXISTS "razorpayOrderId" character varying;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "razorpayOrderId";
    `);
  }
}
