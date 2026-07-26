import { MigrationInterface, QueryRunner } from 'typeorm';

export class VideoUploadCharges0191700000000019 implements MigrationInterface {
  name = 'VideoUploadCharges0191700000000019';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "commission_bills"
      ADD COLUMN IF NOT EXISTS "videoUploadFees" numeric(12,2) NOT NULL DEFAULT 0;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "video_upload_charges" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "shopId" uuid NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        "productId" uuid,
        "storageKey" character varying,
        "commissionBillId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_video_upload_charges" PRIMARY KEY ("id"),
        CONSTRAINT "FK_video_upload_charges_shop" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_video_upload_charges_bill" FOREIGN KEY ("commissionBillId") REFERENCES "commission_bills"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_video_upload_charges_shop_created"
      ON "video_upload_charges" ("shopId", "createdAt");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_video_upload_charges_bill"
      ON "video_upload_charges" ("commissionBillId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "video_upload_charges";`);
    await queryRunner.query(`
      ALTER TABLE "commission_bills" DROP COLUMN IF EXISTS "videoUploadFees";
    `);
  }
}
