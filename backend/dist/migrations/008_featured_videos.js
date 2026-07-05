"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeaturedVideos0081700000000008 = void 0;
class FeaturedVideos0081700000000008 {
    name = 'FeaturedVideos0081700000000008';
    async up(queryRunner) {
        await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "featured_videos_status_enum" AS ENUM ('active', 'expired', 'pending');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "featured_videos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "shopId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "videoUrl" varchar(500) NOT NULL,
        "amount" decimal(10,2) NOT NULL DEFAULT 29,
        "status" "featured_videos_status_enum" NOT NULL DEFAULT 'active',
        "expiresAt" TIMESTAMPTZ NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_featured_videos" PRIMARY KEY ("id"),
        CONSTRAINT "FK_featured_videos_shop" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_featured_videos_product" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE
      )
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_featured_videos_status_expires"
      ON "featured_videos" ("status", "expiresAt")
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS "featured_videos"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "featured_videos_status_enum"`);
    }
}
exports.FeaturedVideos0081700000000008 = FeaturedVideos0081700000000008;
//# sourceMappingURL=008_featured_videos.js.map