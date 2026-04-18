import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPgvector0031700000000003 implements MigrationInterface {
  name = 'AddPgvector0031700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. pgvector extension ని enable చేయండి
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector;`);

    // 2. products table లో image_embedding column add చేయండి
    await queryRunner.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS image_embedding vector(512)
    `);

    // 3. vector similarity search కోసం index create చేయండి (cosine similarity)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS products_embedding_idx 
      ON products USING ivfflat (image_embedding vector_cosine_ops)
      WITH (lists = 100);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS products_embedding_idx;`);
    await queryRunner.query(`ALTER TABLE products DROP COLUMN IF EXISTS image_embedding;`);
  }
}
