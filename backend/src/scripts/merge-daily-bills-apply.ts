#!/usr/bin/env ts-node
/**
 * APPLY merge — run ONLY after dry-run is approved.
 * Set CONFIRM_MERGE=yes to execute writes.
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { CommissionBill, CommissionBillStatus } from '../core/entities/commission-bill.entity';
import {
  previewMergeDailyBillsIntoWeekly,
} from '../modules/payments/merge-daily-bills.util';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
  if (process.env.CONFIRM_MERGE !== 'yes') {
    console.error('Refusing to run: set CONFIRM_MERGE=yes after reviewing dry-run report.');
    process.exit(1);
  }

  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || process.env.DB_NAME || 'localkart',
    entities: [CommissionBill],
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  await ds.initialize();
  const billRepo = ds.getRepository(CommissionBill);

  const bills = await billRepo.find();
  const shopIds = [...new Set(bills.map((b) => b.shopId))];
  const shopNames = new Map<string, string>();
  if (shopIds.length > 0) {
    const rows: { id: string; name: string }[] = await ds.query(
      `SELECT id, name FROM shops WHERE id = ANY($1)`,
      [shopIds],
    );
    for (const row of rows) shopNames.set(row.id, row.name);
  }
  const previews = previewMergeDailyBillsIntoWeekly(bills, shopNames);

  await ds.transaction(async (manager) => {
    for (const p of previews) {
      if (p.oldDailyBillCount <= 1) {
        const single = bills.find((b) => b.id === p.oldBillIds[0]);
        if (single && !single.weekStartDate) {
          await manager.update(CommissionBill, single.id, {
            weekStartDate: p.weekStartDate,
            billDate: p.weekEndingFriday,
            daysOverdue: p.mergedStatus === CommissionBillStatus.PAID ? 0 : p.mergedFineAmount / 25,
            fineAmount: p.mergedFineAmount,
            status: p.mergedStatus,
          });
        }
        continue;
      }

      const paidBill = bills.find(
        (b) => p.oldBillIds.includes(b.id) && b.status === CommissionBillStatus.PAID,
      );

      const merged = manager.create(CommissionBill, {
        shopId: p.shopId,
        billDate: p.weekEndingFriday,
        weekStartDate: p.weekStartDate,
        orderCount: p.mergedOrderCount,
        totalOrderValue: p.mergedTotalOrderValue,
        commissionAmount: p.mergedCommissionAmount,
        commissionPercent: 0,
        fineAmount: p.mergedFineAmount,
        daysOverdue: p.mergedFineAmount > 0 ? Math.round(p.mergedFineAmount / 25) : 0,
        status: p.mergedStatus,
        razorpayPaymentId: paidBill?.razorpayPaymentId ?? null,
        razorpayOrderId: paidBill?.razorpayOrderId ?? null,
        paidAt: p.mergedStatus === CommissionBillStatus.PAID ? paidBill?.paidAt ?? new Date() : null,
      });
      await manager.save(merged);
      await manager.delete(CommissionBill, p.oldBillIds);
    }
  });

  console.log(`Merged ${previews.length} weekly group(s).`);
  await ds.destroy();
}

main().catch((err) => {
  console.error('Merge failed:', err.message);
  process.exit(1);
});
