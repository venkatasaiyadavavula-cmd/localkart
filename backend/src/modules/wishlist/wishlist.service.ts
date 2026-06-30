import {
  Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wishlist } from '../../core/entities/wishlist.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepo: Repository<Wishlist>,
  ) {}

  async toggle(userId: string, productId: string): Promise<{ added: boolean }> {
    const existing = await this.wishlistRepo.findOne({
      where: { userId, productId },
    });

    if (existing) {
      await this.wishlistRepo.remove(existing);
      return { added: false };
    }

    await this.wishlistRepo.save(
      this.wishlistRepo.create({ userId, productId }),
    );
    return { added: true };
  }

  async getWishlist(userId: string) {
    return this.wishlistRepo.find({
      where: { userId },
      relations: ['product', 'product.shop'],
      order: { savedAt: 'DESC' },
    });
  }

  async isWishlisted(userId: string, productId: string): Promise<boolean> {
    return !!(await this.wishlistRepo.findOne({ where: { userId, productId } }));
  }

  async getWishlistProductIds(userId: string): Promise<string[]> {
    const items = await this.wishlistRepo.find({
      where: { userId },
      select: ['productId'],
    });
    return items.map(i => i.productId);
  }
}
