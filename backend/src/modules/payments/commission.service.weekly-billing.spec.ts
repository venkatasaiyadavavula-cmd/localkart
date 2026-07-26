import { CommissionService } from './commission.service';
import { CommissionBill, CommissionBillStatus } from '../../core/entities/commission-bill.entity';
import { Order, OrderStatus } from '../../core/entities/order.entity';
import { VideoUploadCharge } from '../../core/entities/video-upload-charge.entity';

describe('CommissionService.generateWeeklyBillForShop', () => {
  const shopId = 'shop-1';
  const weekEndingFriday = '2025-07-18';

  function buildWeeklyService() {
    const innerBillRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((data) => data),
      save: jest.fn(async (data) => ({ id: 'bill-new', ...data })),
    };
    const orderRepo = {
      find: jest.fn().mockResolvedValue([]),
    };
    const videoChargeRepo = {
      find: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue(undefined),
    };

    const manager = {
      getRepository: jest.fn((entity: unknown) => {
        if (entity === CommissionBill) return innerBillRepo;
        if (entity === Order) return orderRepo;
        if (entity === VideoUploadCharge) return videoChargeRepo;
        throw new Error(`Unexpected entity ${entity}`);
      }),
    };

    const dataSource = {
      transaction: jest.fn(async (cb: (m: typeof manager) => Promise<unknown>) => cb(manager)),
    };

    const outerBillRepo = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    const service = new CommissionService(
      outerBillRepo as never,
      {} as never,
      {} as never,
      dataSource as never,
      { sendCommissionReminder: jest.fn() } as never,
    );

    return { service, innerBillRepo, orderRepo, videoChargeRepo, dataSource };
  }

  it('returns null when there are no delivered orders and no unbilled video charges', async () => {
    const { service } = buildWeeklyService();
    const bill = await service.generateWeeklyBillForShop(shopId, weekEndingFriday);
    expect(bill).toBeNull();
  });

  it('creates a bill for video-only weeks and links accrual rows', async () => {
    const { service, orderRepo, videoChargeRepo, innerBillRepo } = buildWeeklyService();
    orderRepo.find.mockResolvedValue([]);
    videoChargeRepo.find.mockResolvedValue([
      { id: 'vc-1', amount: 10, shopId },
      { id: 'vc-2', amount: 10, shopId },
    ]);

    const bill = await service.generateWeeklyBillForShop(shopId, weekEndingFriday);

    expect(bill).toMatchObject({
      shopId,
      billDate: weekEndingFriday,
      orderCount: 0,
      commissionAmount: 0,
      videoUploadFees: 20,
      status: CommissionBillStatus.PENDING,
    });
    expect(videoChargeRepo.update).toHaveBeenCalledWith(
      { id: expect.anything() },
      { commissionBillId: 'bill-new' },
    );
    expect(innerBillRepo.save).toHaveBeenCalled();
  });

  it('sums commission and video upload fees on the same weekly bill', async () => {
    const { service, orderRepo, videoChargeRepo } = buildWeeklyService();
    orderRepo.find.mockResolvedValue([
      {
        totalAmount: 500,
        commissionAmount: 50,
        status: OrderStatus.DELIVERED,
      },
    ]);
    videoChargeRepo.find.mockResolvedValue([{ id: 'vc-1', amount: 10, shopId }]);

    const bill = await service.generateWeeklyBillForShop(shopId, weekEndingFriday);

    expect(bill).toMatchObject({
      orderCount: 1,
      commissionAmount: 50,
      videoUploadFees: 10,
    });
  });

  it('returns existing bill without re-processing accruals', async () => {
    const existing = { id: 'bill-existing', shopId, billDate: weekEndingFriday };
    const outerBillRepo = { findOne: jest.fn().mockResolvedValue(existing) };
    const service = new CommissionService(
      outerBillRepo as never,
      {} as never,
      {} as never,
      { transaction: jest.fn() } as never,
      { sendCommissionReminder: jest.fn() } as never,
    );

    const bill = await service.generateWeeklyBillForShop(shopId, weekEndingFriday);
    expect(bill).toBe(existing);
  });
});
