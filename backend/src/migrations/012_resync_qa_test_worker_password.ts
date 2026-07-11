import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

/** Re-sync E2E staff password — 011 ran but password was later overwritten by seller UI reset during Playwright. */
export class ResyncQaTestWorkerPassword0121700000000012 implements MigrationInterface {
  name = 'ResyncQaTestWorkerPassword0121700000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const passwordHash = await bcrypt.hash('Test@1234', 10);
    const result = await queryRunner.query(
      `UPDATE staff_members
       SET "passwordHash" = $1, status = 'active', role = 'worker'
       WHERE "staffId" = 'qa_test_worker'`,
      [passwordHash],
    );
    if (!result?.[1]) {
      console.warn('[012_resync_qa_test_worker] qa_test_worker row not found — skipping');
    }
  }

  public async down(): Promise<void> {
    // Keep QA account — no rollback
  }
}
