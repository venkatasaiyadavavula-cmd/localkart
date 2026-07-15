import { CommissionBillStatus } from '../../core/entities/commission-bill.entity';
import {
  daysOverdueFromFridayDue,
  formatWeekLabel,
  fridayForBillDate,
  getWeekEndingFriday,
  getWeekStartSaturday,
  getWeekOrderRange,
  toIstDateString,
} from './commission-week.util';
import {
  formatDryRunReport,
  previewMergeDailyBillsIntoWeekly,
} from './merge-daily-bills.util';

describe('commission-week.util', () => {
  it('Saturday 2025-07-12 maps to week ending Friday 2025-07-18', () => {
    const sat = new Date('2025-07-12T10:00:00+05:30');
    expect(getWeekEndingFriday(sat)).toBe('2025-07-18');
    expect(getWeekStartSaturday('2025-07-18')).toBe('2025-07-12');
  });

  it('Friday 2025-07-18 is its own week end', () => {
    const fri = new Date('2025-07-18T22:00:00+05:30');
    expect(getWeekEndingFriday(fri)).toBe('2025-07-18');
  });

  it('daysOverdue is 0 on Friday due date, 1 on Saturday', () => {
    expect(daysOverdueFromFridayDue('2025-07-18', new Date('2025-07-18T23:00:00+05:30'))).toBe(0);
    expect(daysOverdueFromFridayDue('2025-07-18', new Date('2025-07-19T10:00:00+05:30'))).toBe(1);
    expect(daysOverdueFromFridayDue('2025-07-18', new Date('2025-07-21T10:00:00+05:30'))).toBe(3);
  });

  it('getWeekOrderRange covers Sat 00:00 through Fri 23:59 IST', () => {
    const { start, end } = getWeekOrderRange('2025-07-18');
    expect(toIstDateString(start)).toBe('2025-07-12');
    expect(end.getTime()).toBe(new Date('2025-07-18T23:59:59.999+05:30').getTime());
  });
});

describe('merge-daily-bills.util', () => {
  const shopId = 'shop-aaa-bbbb-cccc-dddddddddddd';

  function dailyBill(
    billDate: string,
    commission: number,
    status: CommissionBillStatus,
    orderCount = 1,
  ) {
    return {
      id: `bill-${billDate}-${status}`,
      shopId,
      billDate,
      weekStartDate: null,
      orderCount,
      totalOrderValue: commission * 10,
      commissionAmount: commission,
      commissionPercent: 10,
      fineAmount: 0,
      daysOverdue: 0,
      status,
      razorpayOrderId: null,
      razorpayPaymentId: null,
      paidAt: status === CommissionBillStatus.PAID ? new Date() : null,
      reminderSentAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      shop: undefined as any,
    };
  }

  it('merges 7 daily bills into one weekly row', () => {
    const dailies = [
      '2025-07-12',
      '2025-07-13',
      '2025-07-14',
      '2025-07-15',
      '2025-07-16',
      '2025-07-17',
      '2025-07-18',
    ].map((d) => dailyBill(d, 10, CommissionBillStatus.PENDING));

    const previews = previewMergeDailyBillsIntoWeekly(dailies as any);
    expect(previews).toHaveLength(1);
    expect(previews[0].oldDailyBillCount).toBe(7);
    expect(previews[0].weekEndingFriday).toBe('2025-07-18');
    expect(previews[0].weekStartDate).toBe('2025-07-12');
    expect(previews[0].mergedCommissionAmount).toBe(70);
    expect(previews[0].mergedOrderCount).toBe(7);
    expect(previews[0].mergedStatus).toBe(CommissionBillStatus.PENDING);
  });

  it('all-paid week → PAID with full commission sum', () => {
    const dailies = ['2025-07-12', '2025-07-13'].map((d) =>
      dailyBill(d, 25, CommissionBillStatus.PAID),
    );
    const [p] = previewMergeDailyBillsIntoWeekly(dailies as any);
    expect(p.mergedStatus).toBe(CommissionBillStatus.PAID);
    expect(p.mergedCommissionAmount).toBe(50);
    expect(p.amountAlreadyPaid).toBe(50);
    expect(p.remainingCommission).toBe(0);
  });

  it('partial-paid week → remaining commission only', () => {
    const dailies = [
      dailyBill('2025-07-12', 30, CommissionBillStatus.PAID),
      dailyBill('2025-07-13', 20, CommissionBillStatus.PENDING),
      dailyBill('2025-07-14', 10, CommissionBillStatus.OVERDUE),
    ];
    const [p] = previewMergeDailyBillsIntoWeekly(dailies as any, new Map(), {
      today: new Date('2025-07-15T12:00:00+05:30'),
    });
    expect(p.paidDailyCount).toBe(1);
    expect(p.unpaidDailyCount).toBe(2);
    expect(p.amountAlreadyPaid).toBe(30);
    expect(p.remainingCommission).toBe(30);
    expect(p.mergedCommissionAmount).toBe(30);
    expect(p.mergedStatus).toBe(CommissionBillStatus.PENDING);
  });

  it('fine calculated from Friday due date after merge', () => {
    const dailies = [dailyBill('2025-07-18', 100, CommissionBillStatus.PENDING)];
    const [p] = previewMergeDailyBillsIntoWeekly(dailies as any, new Map(), {
      today: new Date('2025-07-20T12:00:00+05:30'),
    });
    expect(p.mergedFineAmount).toBe(50); // 2 days × ₹25 (Sat + Sun)
  });

  it('maps mid-week daily billDate to correct Friday', () => {
    expect(fridayForBillDate('2025-07-14')).toBe('2025-07-18');
    expect(formatWeekLabel('2025-07-12', '2025-07-18')).toMatch(/12/);
  });

  it('dry-run report includes partial payment section', () => {
    const dailies = [
      dailyBill('2025-07-12', 10, CommissionBillStatus.PAID),
      dailyBill('2025-07-13', 15, CommissionBillStatus.PENDING),
    ];
    const report = formatDryRunReport(previewMergeDailyBillsIntoWeekly(dailies as any));
    expect(report).toContain('PARTIAL PAYMENT WEEKS');
    expect(report).toContain('remaining');
  });
});
