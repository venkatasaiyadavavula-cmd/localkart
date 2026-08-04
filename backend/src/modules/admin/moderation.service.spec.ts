import { ModerationService } from './moderation.service';
import { ShopStatus, ManualOverride } from '../../core/entities/shop.entity';

describe('ModerationService.approveShop', () => {
  const shopRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const notificationsService = {
    sendSellerNotification: jest.fn(),
  };

  let service: ModerationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ModerationService(
      shopRepository as any,
      {} as any,
      notificationsService as any,
    );
  });

  it('clears force_closed override so the shop can open after approval', async () => {
    const shop = {
      id: 'shop-1',
      ownerId: 'owner-1',
      status: ShopStatus.PENDING,
      manualOverride: ManualOverride.FORCE_CLOSED,
      manualOverrideSetAt: new Date(),
      owner: { id: 'owner-1', password: 'hash' },
    };
    shopRepository.findOne.mockResolvedValue(shop);
    shopRepository.save.mockImplementation(async (s) => s);

    const result = await service.approveShop('shop-1');

    expect(result.status).toBe(ShopStatus.APPROVED);
    expect(result.manualOverride).toBe(ManualOverride.NONE);
    expect(result.manualOverrideSetAt).toBeNull();
    expect(shopRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        manualOverride: ManualOverride.NONE,
        manualOverrideSetAt: null,
      }),
    );
  });
});
