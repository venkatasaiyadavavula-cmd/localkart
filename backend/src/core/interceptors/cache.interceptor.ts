import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';

// Decorator metadata keys
export const CACHE_KEY_METADATA = 'cacheKey';
export const CACHE_TTL_METADATA = 'cacheTTL';

// Decorators for easy use in controllers
export const CacheKey = (key: string) => SetMetadata(CACHE_KEY_METADATA, key);
export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL_METADATA, ttl);

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    // Skip caching for non-GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    // Check if caching is disabled for this handler
    const skipCache = this.reflector.get<boolean>('skipCache', context.getHandler());
    if (skipCache) {
      return next.handle();
    }

    // Get custom cache key or generate from URL
    const customKey = this.reflector.get<string>(CACHE_KEY_METADATA, context.getHandler());
    const cacheKey = customKey ? `cache:${customKey}` : `cache:${request.url}`;

    // Get TTL from decorator or default to 60 seconds
    const ttl = this.reflector.get<number>(CACHE_TTL_METADATA, context.getHandler()) || 60;

    try {
      const cachedData = await this.redis.get(cacheKey);
      if (cachedData) {
        console.log(`✅ CACHE HIT: ${cacheKey}`);
        return of(JSON.parse(cachedData));
      }

      console.log(`❌ CACHE MISS: ${cacheKey}`);
      return next.handle().pipe(
        tap(async (data) => {
          if (data) {
            await this.redis.setex(cacheKey, ttl, JSON.stringify(data));
            console.log(`💾 CACHED: ${cacheKey} (TTL: ${ttl}s)`);
          }
        }),
      );
    } catch (error) {
      console.error('Redis error, skipping cache:', error.message);
      return next.handle();
    }
  }
}

// Decorator to skip caching for specific endpoints
export const SkipCache = () => SetMetadata('skipCache', true);
