import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReviewHelpfulVotes0131700000000013 implements MigrationInterface {
  name = 'ReviewHelpfulVotes0131700000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "review_helpful_votes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "reviewId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_review_helpful_votes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_review_helpful_votes_review_user" UNIQUE ("reviewId", "userId")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "review_helpful_votes";`);
  }
}
