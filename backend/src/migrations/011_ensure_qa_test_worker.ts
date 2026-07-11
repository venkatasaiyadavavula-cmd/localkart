import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

/**
 * Ensures the E2E staff account qa_test_worker exists with a known password.
 * Playwright staff tests depend on staffId=qa_test_worker / password=Test@1234.
 */
export class EnsureQaTestWorker0111700000000011 implements MigrationInterface {
  name = 'EnsureQaTestWorker0111700000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const shops: Array<{ id: string }> = await queryRunner.query(`
      SELECT s.id
      FROM shops s
      INNER JOIN users u ON u.id = s."ownerId"
      WHERE u.phone = '9988776655'
      LIMIT 1
    `);

    const shopId = shops[0]?.id;
    if (!shopId) {
      console.warn('[011_ensure_qa_test_worker] Seed seller shop not found — skipping');
      return;
    }

    const passwordHash = await bcrypt.hash('Test@1234', 10);
    const staffId = 'qa_test_worker';
    const phone = '+919876500001';

    const existing: Array<{ id: string }> = await queryRunner.query(
      `SELECT id FROM staff_members WHERE "staffId" = $1 LIMIT 1`,
      [staffId],
    );

    if (existing[0]?.id) {
      await queryRunner.query(
        `UPDATE staff_members
         SET "passwordHash" = $1, status = 'active', role = 'worker', "shopId" = $2, name = $3
         WHERE id = $4`,
        [passwordHash, shopId, 'QA Test Worker', existing[0].id],
      );
    } else {
      await queryRunner.query(
        `INSERT INTO staff_members ("shopId", name, phone, "staffId", "passwordHash", role, status)
         VALUES ($1, $2, $3, $4, $5, 'worker', 'active')`,
        [shopId, 'QA Test Worker', phone, staffId, passwordHash],
      );
    }
  }

  public async down(): Promise<void> {
    // Keep QA account — no rollback
  }
}
