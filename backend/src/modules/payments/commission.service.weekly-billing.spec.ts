import { CommissionService } from './commission.service';
import { CommissionBill, CommissionBillStatus } from '../../core/entities/commission-bill.entity';
import { Order, OrderStatus } from '../../core/entities/order.entity';
import { VideoUploadCharge } from '../../core/entities/video-upload-charge.entity';
import { AdCampaignCharge } from '../../core/entities/ad-campaign-charge.entity';

describe('CommissionService.generateWeeklyBillForShop', () => {
  const shopId = 'shop-1';
  const weekEndingFriday = '2025-07-18';

  function buildWeeklyService(initialBill: Record<string, unknown> | null = null) {
    let billState = initialBill
      ? { id: 'bill-existing', shopId, billDate: weekEndingFriday, ...initialBill }
      : null;

    const innerBillRepo = {
      findOne: jest.fn(async () => billState),
      create: jest.fn((data) => data),
      save: jest.fn(async (data) => {
        billState = { id: billState?.id ?? 'bill-new', ...data };
        return billState;
      }),
    };
    const orderRepo = {
      find: jest.fn().mockResolvedValue([]),
    };
    const videoChargeRepo = {
      find: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue(undefined),
    };

    const adChargeRepo = {
      find: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue(undefined),
    };

    const manager = {
      getRepository: jest.fn((entity: unknown) => {
        if (entity === CommissionBill) return innerBillRepo;
        if (entity === Order) return orderRepo;
        if (entity === VideoUploadCharge) return videoChargeRepo;
        if (entity === AdCampaignCharge) return adChargeRepo;
        throw new Error(`Unexpected entity ${entity}`);
      }),
    };

    const dataSource = {
      transaction: jest.fn(async (cb: (m: typeof manager) => Promise<unknown>) => cb(manager)),
    };

    const service = new CommissionService(
      { findOne: jest.fn() } as never,
      {} as never,
      {} as never,
      dataSource as never,
      { sendCommissionReminder: jest.fn() } as never,
    );

    return {
      service,
      innerBillRepo,
      orderRepo,
      videoChargeRepo,
      adChargeRepo,
      getBill: () => billState,
    };
  }

  it('returns null when there are no delivered orders, video charges, or ad charges', async () => {
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

  it('sums commission, video upload fees, and ad campaign fees on the same weekly bill', async () => {
    const { service, orderRepo, videoChargeRepo, adChargeRepo } = buildWeeklyService();
    orderRepo.find.mockResolvedValue([
      {
        totalAmount: 500,
        commissionAmount: 50,
        status: OrderStatus.DELIVERED,
      },
    ]);
    videoChargeRepo.find.mockResolvedValue([{ id: 'vc-1', amount: 10, shopId }]);
    adChargeRepo.find.mockResolvedValue([{ id: 'ac-1', amount: 200, shopId }]);

    const bill = await service.generateWeeklyBillForShop(shopId, weekEndingFriday);

    expect(bill).toMatchObject({
      orderCount: 1,
      commissionAmount: 50,
      videoUploadFees: 10,
      adCampaignFees: 200,
    });
  });

  it('creates a bill when only ad campaign accruals exist', async () => {
    const { service, adChargeRepo } = buildWeeklyService();
    adChargeRepo.find.mockResolvedValue([{ id: 'ac-1', amount: 50, shopId }]);

    const bill = await service.generateWeeklyBillForShop(shopId, weekEndingFriday);

    expect(bill).toMatchObject({
      orderCount: 0,
      commissionAmount: 0,
      adCampaignFees: 50,
    });
  });

  it('does not change an unpaid bill when generate runs again with no new accruals', async () => {
    const { service, innerBillRepo, videoChargeRepo, adChargeRepo } = buildWeeklyService({
      status: CommissionBillStatus.PENDING,
      videoUploadFees: 10,
      adCampaignFees: 0,
      orderCount: 0,
      commissionAmount: 0,
      totalOrderValue: 0,
    });

    await service.generateWeeklyBillForShop(shopId, weekEndingFriday);
    await service.generateWeeklyBillForShop(shopId, weekEndingFriday);

    expect(innerBillRepo.save).not.toHaveBeenCalled();
    expect(videoChargeRepo.update).not.toHaveBeenCalled();
    expect(adChargeRepo.update).not.toHaveBeenCalled();
  });

  it('tops up an existing unpaid bill when new accruals appear later in the same week', async () => {
    const { service, adChargeRepo, getBill } = buildWeeklyService({
      status: CommissionBillStatus.PENDING,
      videoUploadFees: 10,
      adCampaignFees: 0,
      orderCount: 0,
      commissionAmount: 0,
      totalOrderValue: 0,
    });

    adChargeRepo.find.mockResolvedValue([{ id: 'ac-late', amount: 200, shopId }]);

    const bill = await service.generateWeeklyBillForShop(shopId, weekEndingFriday);

    expect(bill).toMatchObject({
      videoUploadFees: 10,
      adCampaignFees: 200,
    });
    expect(adChargeRepo.update).toHaveBeenCalledWith(
      { id: expect.anything() },
      { commissionBillId: 'bill-existing' },
    );
    expect(getBill()).toMatchObject({ adCampaignFees: 200 });
  });

  it('does not reopen a paid bill; late accruals are billed on a later generate run', async () => {
    const { service, adChargeRepo, innerBillRepo } = buildWeeklyService({
      status: CommissionBillStatus.PAID,
      videoUploadFees: 10,
      adCampaignFees: 0,
      orderCount: 0,
      commissionAmount: 0,
      totalOrderValue: 0,
    });

    adChargeRepo.find.mockResolvedValue([{ id: 'ac-late', amount: 200, shopId }]);

    const bill = await service.generateWeeklyBillForShop(shopId, weekEndingFriday);

    expect(bill).toMatchObject({ status: CommissionBillStatus.PAID, adCampaignFees: 0 });
    expect(innerBillRepo.save).not.toHaveBeenCalled();
    expect(adChargeRepo.update).not.toHaveBeenCalled();

    const { service: service2, adChargeRepo: adRepo2 } = buildWeeklyService();
    adRepo2.find.mockResolvedValue([{ id: 'ac-late', amount: 200, shopId }]);

    const nextBill = await service2.generateWeeklyBillForShop(shopId, '2025-07-25');

    expect(nextBill).toMatchObject({ adCampaignFees: 200 });
    expect(adRepo2.update).toHaveBeenCalled();
  });
});
