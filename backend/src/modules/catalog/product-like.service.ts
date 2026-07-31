import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductLike } from '../../core/entities/product-like.entity';

@Injectable()
export class ProductLikeService {
  constructor(
    @InjectRepository(ProductLike)
    private readonly likeRepo: Repository<ProductLike>,
  ) {}

  async toggle(userId: string, productId: string): Promise<{ liked: boolean }> {
    const existing = await this.likeRepo.findOne({
      where: { userId, productId },
    });

    if (existing) {
      await this.likeRepo.remove(existing);
      return { liked: false };
    }

    await this.likeRepo.save(
      this.likeRepo.create({ userId, productId }),
    );
    return { liked: true };
  }

  async getLikedProductIds(userId: string): Promise<string[]> {
    const items = await this.likeRepo.find({
      where: { userId },
      select: ['productId'],
    });
    return items.map((i) => i.productId);
  }
}
