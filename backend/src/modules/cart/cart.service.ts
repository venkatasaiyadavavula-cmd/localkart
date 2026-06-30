import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Product, ProductStatus } from '../../core/entities/product.entity';
import { Shop, ShopStatus } from '../../core/entities/shop.entity';
import { AddToCartDto, UpdateCartItemDto, CartItem } from './dto/cart-item.dto';

@Injectable()
export class CartService {
  private readonly CART_PREFIX = 'cart:';
  private readonly CART_TTL = 7 * 24 * 60 * 60; // 7 days

  constructor(
    @InjectRedis() private readonly redis: Redis,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
  ) {}

  private getCartKey(userId: string): string {
    return `${this.CART_PREFIX}${userId}`;
  }

  async getCart(userId: string) {
    const cartKey = this.getCartKey(userId);
    const cartData = await this.redis.get(cartKey);
    if (!cartData) {
      return { items: [], totalAmount: 0, totalItems: 0 };
    }
    const items: CartItem[] = JSON.parse(cartData);
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    return { items, totalAmount, totalItems };
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto) {
    const { productId, quantity = 1 } = addToCartDto;

    // Validate product exists and is available
    const product = await this.productRepository.findOne({
      where: { id: productId, status: ProductStatus.APPROVED },
      relations: ['shop'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.stock < quantity) {
      throw new BadRequestException(`Only ${product.stock} items available`);
    }

    // Validate shop is approved
    if (product.shop.status !== ShopStatus.APPROVED) {
      throw new BadRequestException('Shop is not currently accepting orders');
    }

    const cartKey = this.getCartKey(userId);
    let items: CartItem[] = [];

    const existingCart = await this.redis.get(cartKey);
    if (existingCart) {
      items = JSON.parse(existingCart);

      // Check if adding from same shop
      const existingShopId = items[0]?.shopId;
      if (existingShopId && existingShopId !== product.shopId) {
        throw new BadRequestException('You can only order from one shop at a time. Please clear cart first.');
      }
    }

    // Check if product already in cart
    const existingItemIndex = items.findIndex((item) => item.productId === productId);
    if (existingItemIndex > -1) {
      const newQuantity = items[existingItemIndex].quantity + quantity;
      if (newQuantity > product.stock) {
        throw new BadRequestException(`Cannot add more than available stock (${product.stock})`);
      }
      items[existingItemIndex].quantity = newQuantity;
    } else {
      items.push({
        productId: product.id,
        shopId: product.shopId,
        name: product.name,
        price: Number(product.price),
        quantity,
        image: product.images?.[0] || null,
        maxQuantity: product.stock,
      });
    }

    await this.redis.setex(cartKey, this.CART_TTL, JSON.stringify(items));
    return this.getCart(userId);
  }

  async updateCartItem(userId: string, productId: string, updateDto: UpdateCartItemDto) {
    const cartKey = this.getCartKey(userId);
    const existingCart = await this.redis.get(cartKey);
    if (!existingCart) {
      throw new NotFoundException('Cart is empty');
    }

    const items: CartItem[] = JSON.parse(existingCart);
    const itemIndex = items.findIndex((item) => item.productId === productId);
    if (itemIndex === -1) {
      throw new NotFoundException('Product not in cart');
    }

    const product = await this.productRepository.findOne({
      where: { id: productId, status: ProductStatus.APPROVED },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const newQuantity = updateDto.quantity;
    if (newQuantity > product.stock) {
      throw new BadRequestException(`Only ${product.stock} items available`);
    }

    items[itemIndex].quantity = newQuantity;
    await this.redis.setex(cartKey, this.CART_TTL, JSON.stringify(items));
    return this.getCart(userId);
  }

  async removeCartItem(userId: string, productId: string) {
    const cartKey = this.getCartKey(userId);
    const existingCart = await this.redis.get(cartKey);
    if (!existingCart) {
      return { message: 'Cart is empty' };
    }

    let items: CartItem[] = JSON.parse(existingCart);
    items = items.filter((item) => item.productId !== productId);

    if (items.length === 0) {
      await this.redis.del(cartKey);
    } else {
      await this.redis.setex(cartKey, this.CART_TTL, JSON.stringify(items));
    }
    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cartKey = this.getCartKey(userId);
    await this.redis.del(cartKey);
    return { message: 'Cart cleared' };
  }

  // For order processing: validate and lock inventory
  async validateCartForCheckout(userId: string) {
    const cart = await this.getCart(userId);
    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const productIds = cart.items.map((item) => item.productId);
    const products = await this.productRepository.find({
      where: { id: In(productIds) },
      relations: ['shop'],
    });

    for (const item of cart.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        throw new BadRequestException(`Product ${item.name} is no longer available`);
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(`Only ${product.stock} of ${item.name} available`);
      }
      if (product.shop.status !== ShopStatus.APPROVED) {
        throw new BadRequestException(`Shop for ${item.name} is not accepting orders`);
      }
    }

    return { cart, products };
  }
}
