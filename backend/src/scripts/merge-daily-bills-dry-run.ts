#!/usr/bin/env ts-node
/**
 * DRY-RUN ONLY — reads commission_bills via raw SQL, prints merge preview. Does NOT write.
 */
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { CommissionBillStatus } from '../core/entities/commission-bill.entity';
import {
  formatDryRunReport,
  previewMergeDailyBillsIntoWeekly,
} from '../modules/payments/merge-daily-bills.util';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || process.env.DB_NAME || 'localkart',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  await ds.initialize();

  const rows: any[] = await ds.query(`
    SELECT id, "shopId", "billDate", "weekStartDate", "orderCount", "totalOrderValue",
           "commissionAmount", "commissionPercent", "fineAmount", "daysOverdue", status,
           "razorpayOrderId", "razorpayPaymentId", "paidAt", "reminderSentAt",
           "createdAt", "updatedAt"
    FROM commission_bills
    ORDER BY "billDate" ASC
  `);

  const bills = rows.map((r) => ({
    ...r,
    billDate: String(r.billDate).slice(0, 10),
    weekStartDate: r.weekStartDate ? String(r.weekStartDate).slice(0, 10) : null,
    status: r.status as CommissionBillStatus,
  }));

  const shopIds = [...new Set(bills.map((b) => b.shopId))];
  const shopNames = new Map<string, string>();
  if (shopIds.length > 0) {
    const shopRows: { id: string; name: string }[] = await ds.query(
      `SELECT id, name FROM shops WHERE id = ANY($1)`,
      [shopIds],
    );
    for (const row of shopRows) shopNames.set(row.id, row.name);
  }

  console.log(`Loaded ${bills.length} commission bill(s) from database`);

  const previews = previewMergeDailyBillsIntoWeekly(bills as any, shopNames);
  const report = formatDryRunReport(previews);
  console.log('\n' + report);

  const outPath =
    process.env.DRY_RUN_OUTPUT ||
    path.join(__dirname, '../../../commission-merge-dry-run.txt');
  fs.writeFileSync(outPath, report);
  console.log(`\nReport written to ${outPath}`);
  console.log('NO DATA WAS MODIFIED — this is a dry run.');

  await ds.destroy();
}

main().catch((err) => {
  console.error('Dry-run failed:', err.message);
  process.exit(1);
});
