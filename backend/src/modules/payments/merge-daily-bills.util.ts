import { CommissionBill, CommissionBillStatus } from '../../core/entities/commission-bill.entity';
import {
  fridayForBillDate,
  getWeekStartSaturday,
  daysOverdueFromFridayDue,
} from './commission-week.util';

export interface MergedWeeklyBillPreview {
  shopId: string;
  shopName?: string;
  weekEndingFriday: string;
  weekStartDate: string;
  oldDailyBillCount: number;
  mergedOrderCount: number;
  mergedTotalOrderValue: number;
  mergedCommissionAmount: number;
  mergedFineAmount: number;
  mergedStatus: CommissionBillStatus;
  amountAlreadyPaid: number;
  remainingCommission: number;
  paidDailyCount: number;
  unpaidDailyCount: number;
  oldBillIds: string[];
  notes: string;
}

export interface MergeDailyBillsOptions {
  finePerDay?: number;
  today?: Date;
}

/**
 * Groups existing daily CommissionBill rows into weekly bills (Sat–Fri).
 *
 * Partial-payment policy:
 * - All daily bills PAID → weekly PAID, commissionAmount = sum(all daily commission)
 * - None paid → weekly PENDING, commissionAmount = sum(all)
 * - Some paid → weekly PENDING/OVERDUE, commissionAmount = sum(UNPAID daily only),
 *   amountAlreadyPaid = sum(PAID daily) recorded in preview for audit
 */
export function previewMergeDailyBillsIntoWeekly(
  bills: CommissionBill[],
  shopNames: Map<string, string> = new Map(),
  options: MergeDailyBillsOptions = {},
): MergedWeeklyBillPreview[] {
  const finePerDay = options.finePerDay ?? 25;
  const today = options.today ?? new Date();

  const groups = new Map<string, CommissionBill[]>();

  for (const bill of bills) {
    const friday = fridayForBillDate(bill.billDate);
    const key = `${bill.shopId}|${friday}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(bill);
  }

  const previews: MergedWeeklyBillPreview[] = [];

  for (const [key, group] of groups) {
    const [shopId, weekEndingFriday] = key.split('|');
    const weekStartDate = getWeekStartSaturday(weekEndingFriday);

    const paid = group.filter((b) => b.status === CommissionBillStatus.PAID);
    const unpaid = group.filter((b) => b.status !== CommissionBillStatus.PAID);

    const totalCommission = group.reduce((s, b) => s + Number(b.commissionAmount), 0);
    const amountAlreadyPaid = paid.reduce((s, b) => s + Number(b.commissionAmount), 0);
    const remainingCommission = unpaid.reduce((s, b) => s + Number(b.commissionAmount), 0);

    let mergedStatus: CommissionBillStatus;
    let mergedCommissionAmount: number;
    let notes: string;

    if (paid.length === group.length) {
      mergedStatus = CommissionBillStatus.PAID;
      mergedCommissionAmount = totalCommission;
      notes = 'All daily bills paid — weekly bill marked PAID';
    } else if (paid.length === 0) {
      mergedStatus = CommissionBillStatus.PENDING;
      mergedCommissionAmount = totalCommission;
      notes = 'No daily bills paid — full weekly commission due';
    } else {
      mergedCommissionAmount = remainingCommission;
      notes = `Partial: ${paid.length} daily bill(s) paid (₹${amountAlreadyPaid.toFixed(2)}); weekly bill covers remaining ₹${remainingCommission.toFixed(2)}`;
      const daysLate = daysOverdueFromFridayDue(weekEndingFriday, today);
      mergedStatus =
        daysLate > 0 ? CommissionBillStatus.OVERDUE : CommissionBillStatus.PENDING;
    }

    const daysLate = daysOverdueFromFridayDue(weekEndingFriday, today);
    const mergedFineAmount =
      mergedStatus === CommissionBillStatus.PAID ? 0 : daysLate * finePerDay;

    previews.push({
      shopId,
      shopName: shopNames.get(shopId),
      weekEndingFriday,
      weekStartDate,
      oldDailyBillCount: group.length,
      mergedOrderCount: group.reduce((s, b) => s + b.orderCount, 0),
      mergedTotalOrderValue: parseFloat(
        group.reduce((s, b) => s + Number(b.totalOrderValue), 0).toFixed(2),
      ),
      mergedCommissionAmount: parseFloat(mergedCommissionAmount.toFixed(2)),
      mergedFineAmount,
      mergedStatus,
      amountAlreadyPaid: parseFloat(amountAlreadyPaid.toFixed(2)),
      remainingCommission: parseFloat(remainingCommission.toFixed(2)),
      paidDailyCount: paid.length,
      unpaidDailyCount: unpaid.length,
      oldBillIds: group.map((b) => b.id),
      notes,
    });
  }

  return previews.sort((a, b) =>
    a.weekEndingFriday.localeCompare(b.weekEndingFriday) || a.shopId.localeCompare(b.shopId),
  );
}

export function formatDryRunReport(previews: MergedWeeklyBillPreview[]): string {
  const lines: string[] = [
    '=== Weekly Commission Bill Merge — DRY RUN ===',
    `Generated: ${new Date().toISOString()}`,
    `Groups: ${previews.length}`,
    '',
    'shopId | shop | week (Sat–Fri) | old daily # | orders | commission | fine | status | paid daily | notes',
    '---',
  ];

  for (const p of previews) {
    lines.push(
      [
        p.shopId.slice(0, 8),
        p.shopName ?? '—',
        `${p.weekStartDate} → ${p.weekEndingFriday}`,
        p.oldDailyBillCount,
        p.mergedOrderCount,
        `₹${p.mergedCommissionAmount}`,
        `₹${p.mergedFineAmount}`,
        p.mergedStatus,
        `${p.paidDailyCount}/${p.oldDailyBillCount}`,
        p.notes,
      ].join(' | '),
    );
  }

  const partial = previews.filter((p) => p.paidDailyCount > 0 && p.unpaidDailyCount > 0);
  if (partial.length) {
    lines.push('', '=== PARTIAL PAYMENT WEEKS (review carefully) ===');
    for (const p of partial) {
      lines.push(
        `  ${p.shopName ?? p.shopId}: week ${p.weekEndingFriday} — already paid ₹${p.amountAlreadyPaid}, remaining ₹${p.remainingCommission}`,
      );
    }
  }

  return lines.join('\n');
}
