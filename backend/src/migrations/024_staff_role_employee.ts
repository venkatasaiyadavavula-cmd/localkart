import { MigrationInterface, QueryRunner } from 'typeorm';

export class StaffRoleEmployee0241700000000024 implements MigrationInterface {
  name = 'StaffRoleEmployee0241700000000024';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TYPE "staff_members_role_enum" ADD VALUE 'employee';
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      UPDATE "staff_members"
      SET "role" = 'employee'
      WHERE "role"::text IN ('worker', 'store_manager', 'products_manager', 'delivery_staff');
    `);

    await queryRunner.query(`
      ALTER TABLE "staff_members"
      ALTER COLUMN "role" SET DEFAULT 'employee';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "staff_members"
      ALTER COLUMN "role" SET DEFAULT 'worker';
    `);

    await queryRunner.query(`
      UPDATE "staff_members"
      SET "role" = 'worker'
      WHERE "role"::text = 'employee';
    `);
  }
}
