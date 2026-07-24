import { MediaService } from './media.service';
import { putObjectBuffer } from '../../config/storage.config';

jest.mock('../../config/storage.config', () => ({
  getPublicObjectUrl: jest.fn((key: string) => `https://example.test/${key}`),
  getSignedUploadUrl: jest.fn(),
  putObjectBuffer: jest.fn().mockResolvedValue(undefined),
  getSignedViewUrl: jest.fn(),
}));

describe('MediaService.uploadVideo', () => {
  const mediaQueue = { add: jest.fn().mockResolvedValue({ id: 'job-1' }) };
  const shopRepo = { findOne: jest.fn() };
  const subscriptionRepo = { findOne: jest.fn().mockResolvedValue(null) };
  const productRepo = { createQueryBuilder: jest.fn() };

  let service: MediaService;
  let andWhere: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    andWhere = jest.fn().mockReturnThis();
    productRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere,
      getCount: jest.fn().mockResolvedValue(0),
    });
    shopRepo.findOne.mockResolvedValue({ id: 'shop-1', ownerId: 'seller-1' });

    service = new MediaService(
      mediaQueue as never,
      shopRepo as never,
      productRepo as never,
      subscriptionRepo as never,
    );
  });

  it('counts products with videos using jsonb_array_length (not array_length)', async () => {
    const file = {
      originalname: 'clip.mp4',
      mimetype: 'video/mp4',
      size: 1024,
      buffer: Buffer.from('fake'),
    } as Express.Multer.File;

    const result = await service.uploadVideo('seller-1', file);

    expect(andWhere).toHaveBeenCalledWith(
      expect.stringContaining('jsonb_array_length'),
    );
    expect(putObjectBuffer).toHaveBeenCalled();
    expect(result.uploadedByServer).toBe(true);
    expect(result.publicUrl).toContain('videos/shop-1/');
  });

  it('still returns publicUrl when transcode queue is unavailable', async () => {
    mediaQueue.add.mockRejectedValueOnce(new Error('Redis down'));

    const file = {
      originalname: 'clip.mp4',
      mimetype: 'video/mp4',
      size: 512,
      buffer: Buffer.from('x'),
    } as Express.Multer.File;

    const result = await service.uploadVideo('seller-1', file);

    expect(result.publicUrl).toBeTruthy();
    expect(result.uploadedByServer).toBe(true);
  });
});
