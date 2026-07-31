import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductLikes0281700000000028 implements MigrationInterface {
  name = 'ProductLikes0281700000000028';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_likes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "likedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_likes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_product_likes_user_product" UNIQUE ("userId", "productId")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_product_likes_userId" ON "product_likes" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_product_likes_productId" ON "product_likes" ("productId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "product_likes"`);
  }
}
