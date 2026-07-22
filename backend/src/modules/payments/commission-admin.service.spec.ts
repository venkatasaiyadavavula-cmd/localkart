import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CommissionService } from './commission.service';
import { CommissionBillStatus } from '../../core/entities/commission-bill.entity';

jest.mock('../../config/razorpay.config', () => ({
  __esModule: true,
  default: { orders: { create: jest.fn() } },
}));

function buildBill(overrides: Record<string, unknown> = {}) {
  return {
    id: 'bill-1',
    shopId: 'shop-1',
    billDate: '2026-07-18',
    weekStartDate: '2026-07-12',
    orderCount: 3,
    totalOrderValue: 1000,
    commissionAmount: 50,
    fineAmount: 25,
    daysOverdue: 2,
    status: CommissionBillStatus.OVERDUE,
    razorpayOrderId: null,
    razorpayPaymentId: null,
    adminPaymentRef: null,
    adminNote: null,
    paidAt: null,
    createdAt: new Date('2026-07-18T17:00:00Z'),
    updatedAt: new Date('2026-07-18T17:00:00Z'),
    shop: { id: 'shop-1', name: 'Fresh Mart' },
    ...overrides,
  };
}

describe('CommissionService admin billing', () => {
  let billRepo: {
    findAndCount: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    count: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let shopRepo: { findOne: jest.Mock };
  let service: CommissionService;

  beforeEach(() => {
    billRepo = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    shopRepo = { findOne: jest.fn() };
    service = new CommissionService(
      billRepo as any,
      {} as any,
      shopRepo as any,
      {} as any,
      { sendCommissionReminder: jest.fn() } as any,
    );
  });

  describe('getAdminBills', () => {
    it('filters by status and enriches totals', async () => {
      const bill = buildBill();
      billRepo.findAndCount.mockResolvedValue([[bill], 1]);

      const result = await service.getAdminBills({ status: 'overdue', page: 1, limit: 20 });

      expect(billRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: CommissionBillStatus.OVERDUE },
        }),
      );
      expect(result.data).toHaveLength(1);
      expect(result.data[0].totalDue).toBe(75);
      expect(result.data[0].weekLabel).toContain('–');
      expect(result.data[0].shop?.name).toBe('Fresh Mart');
    });

    it('rejects invalid status filter', async () => {
      await expect(service.getAdminBills({ status: 'bogus' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('omits status filter when status is all', async () => {
      billRepo.findAndCount.mockResolvedValue([[], 0]);
      await service.getAdminBills({ status: 'all' });
      expect(billRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });
  });

  describe('getAdminSummary', () => {
    it('aggregates outstanding, overdue counts, and paid totals', async () => {
      const qb = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
      };

      qb.getRawOne
        .mockResolvedValueOnce({ total: '150.50' })
        .mockResolvedValueOnce({ count: '5' })
        .mockResolvedValueOnce({ total: '80' })
        .mockResolvedValueOnce({ total: '40' });

      billRepo.createQueryBuilder.mockReturnValue(qb);
      billRepo.count.mockResolvedValueOnce(3).mockResolvedValueOnce(5);

      const summary = await service.getAdminSummary();

      expect(summary.totalOutstanding).toBe(150.5);
      expect(summary.overdueBillCount).toBe(3);
      expect(summary.overdueShopCount).toBe(5);
      expect(summary.collectedThisWeek).toBe(80);
      expect(summary.collectedThisMonth).toBe(40);
      expect(summary.billsGeneratedThisWeek).toBe(5);
    });
  });

  describe('markBillPaidAdmin', () => {
    it('transitions unpaid bill to paid and clears fines', async () => {
      const pending = buildBill({ status: CommissionBillStatus.PENDING, fineAmount: 25 });
      const paid = buildBill({
        status: CommissionBillStatus.PAID,
        fineAmount: 0,
        daysOverdue: 0,
        totalDue: 0,
        paidAt: new Date(),
        adminPaymentRef: 'UPI-123',
        adminNote: 'Paid via phone',
      });

      billRepo.findOne
        .mockResolvedValueOnce(pending)
        .mockResolvedValueOnce({
          ...paid,
          fineAmount: 0,
          daysOverdue: 0,
          adminPaymentRef: 'UPI-123',
          adminNote: 'Paid via phone',
        });

      const result = await service.markBillPaidAdmin('bill-1', 'UPI-123', 'Paid via phone');

      expect(billRepo.update).toHaveBeenCalledWith(
        'bill-1',
        expect.objectContaining({
          status: CommissionBillStatus.PAID,
          fineAmount: 0,
          daysOverdue: 0,
          adminPaymentRef: 'UPI-123',
          adminNote: 'Paid via phone',
        }),
      );
      expect(result.success).toBe(true);
      expect(result.bill.status).toBe(CommissionBillStatus.PAID);
      expect(result.bill.totalDue).toBe(0);
    });

    it('throws when bill not found', async () => {
      billRepo.findOne.mockResolvedValue(null);
      await expect(service.markBillPaidAdmin('missing')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws when bill already paid', async () => {
      billRepo.findOne.mockResolvedValue(buildBill({ status: CommissionBillStatus.PAID }));
      await expect(service.markBillPaidAdmin('bill-1')).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
