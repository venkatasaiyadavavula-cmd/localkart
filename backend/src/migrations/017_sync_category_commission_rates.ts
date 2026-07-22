import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ensure top-level browse categories have the platform default commission rates.
 * Product.categoryType maps to categories.slug (home_essentials → home-essentials).
 */
export class SyncCategoryCommissionRates0171700000000017 implements MigrationInterface {
  name = 'SyncCategoryCommissionRates0171700000000017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const defaults: Array<{ slug: string; name: string; rate: number; order: number }> = [
      { slug: 'groceries', name: 'Groceries', rate: 2, order: 1 },
      { slug: 'fashion', name: 'Fashion', rate: 4, order: 2 },
      { slug: 'electronics', name: 'Electronics', rate: 3, order: 3 },
      { slug: 'home-essentials', name: 'Home Essentials', rate: 4, order: 4 },
      { slug: 'beauty', name: 'Beauty', rate: 5, order: 5 },
      { slug: 'accessories', name: 'Accessories', rate: 5, order: 6 },
    ];

    for (const cat of defaults) {
      await queryRunner.query(
        `
        INSERT INTO "categories" ("name", "slug", "commissionRate", "isActive", "displayOrder", "mpath")
        VALUES ($1, $2, $3, true, $4, '')
        ON CONFLICT ("slug") DO UPDATE
        SET "commissionRate" = CASE
          WHEN "categories"."commissionRate" IS NULL OR "categories"."commissionRate" = 0
          THEN EXCLUDED."commissionRate"
          ELSE "categories"."commissionRate"
        END
        `,
        [cat.name, cat.slug, cat.rate, cat.order],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Non-destructive: leave rates as-is on rollback.
    await queryRunner.query(`SELECT 1`);
  }
}
