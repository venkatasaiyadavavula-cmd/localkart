import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductVariants0231700000000023 implements MigrationInterface {
  name = 'ProductVariants0231700000000023';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "hasVariants" boolean NOT NULL DEFAULT false;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_variants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "productId" uuid NOT NULL,
        "attributes" jsonb NOT NULL,
        "stock" integer NOT NULL DEFAULT 0,
        "priceOverride" numeric(12,2),
        "sku" character varying,
        "image" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_variants" PRIMARY KEY ("id"),
        CONSTRAINT "FK_product_variants_product" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_product_variants_product"
      ON "product_variants" ("productId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "product_variants";`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "hasVariants";`);
  }
}
