import { MigrationInterface, QueryRunner } from 'typeorm';

export class FeaturedVideoPauseByAdmin0271700000000027 implements MigrationInterface {
  name = 'FeaturedVideoPauseByAdmin0271700000000027';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "featured_videos_status_enum" ADD VALUE IF NOT EXISTS 'paused';
    `);
    await queryRunner.query(`
      ALTER TABLE "featured_videos"
      ADD COLUMN IF NOT EXISTS "pausedByAdmin" boolean NOT NULL DEFAULT false;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "featured_videos" DROP COLUMN IF EXISTS "pausedByAdmin";
    `);
    // PostgreSQL cannot remove enum values safely; leave 'paused' in enum on down.
  }
}
