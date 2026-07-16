/**
 * Fixture-based dry-run sample (no DB required) — mirrors production merge preview format.
 * Run: npx ts-node src/scripts/merge-daily-bills-fixture-dry-run.ts
 */
import { CommissionBillStatus } from '../core/entities/commission-bill.entity';
import {
  formatDryRunReport,
  previewMergeDailyBillsIntoWeekly,
} from '../modules/payments/merge-daily-bills.util';

const shopA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const shopB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

const fixtureBills = [
  // Shop A — full week unpaid (7 daily bills)
  ...['2025-07-12', '2025-07-13', '2025-07-14', '2025-07-15', '2025-07-16', '2025-07-17', '2025-07-18'].map(
    (d, i) => ({
      id: `a-${d}`,
      shopId: shopA,
      billDate: d,
      weekStartDate: null,
      orderCount: 3 + i,
      totalOrderValue: 1000,
      commissionAmount: 50,
      commissionPercent: 5,
      fineAmount: 0,
      daysOverdue: 0,
      status: CommissionBillStatus.PENDING,
      razorpayOrderId: null,
      razorpayPaymentId: null,
      paidAt: null,
      reminderSentAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  ),
  // Shop B — partial payment week
  {
    id: 'b-mon',
    shopId: shopB,
    billDate: '2025-07-07',
    weekStartDate: null,
    orderCount: 2,
    totalOrderValue: 800,
    commissionAmount: 40,
    commissionPercent: 5,
    fineAmount: 0,
    daysOverdue: 0,
    status: CommissionBillStatus.PAID,
    razorpayOrderId: 'rzp_o1',
    razorpayPaymentId: 'pay_p1',
    paidAt: new Date('2025-07-08'),
    reminderSentAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'b-tue',
    shopId: shopB,
    billDate: '2025-07-08',
    weekStartDate: null,
    orderCount: 1,
    totalOrderValue: 400,
    commissionAmount: 20,
    commissionPercent: 5,
    fineAmount: 0,
    daysOverdue: 0,
    status: CommissionBillStatus.PENDING,
    razorpayOrderId: null,
    razorpayPaymentId: null,
    paidAt: null,
    reminderSentAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'b-wed',
    shopId: shopB,
    billDate: '2025-07-09',
    weekStartDate: null,
    orderCount: 4,
    totalOrderValue: 2000,
    commissionAmount: 100,
    commissionPercent: 5,
    fineAmount: 25,
    daysOverdue: 1,
    status: CommissionBillStatus.OVERDUE,
    razorpayOrderId: null,
    razorpayPaymentId: null,
    paidAt: null,
    reminderSentAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const shopNames = new Map([
  [shopA, 'Kadapa Fresh Mart'],
  [shopB, 'City Electronics'],
]);

const previews = previewMergeDailyBillsIntoWeekly(fixtureBills as any, shopNames, {
  today: new Date('2025-07-20T12:00:00+05:30'),
});

console.log(formatDryRunReport(previews));
