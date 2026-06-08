import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Redis } from 'ioredis';
import { Reflector } from '@nestjs/core';
export declare const CACHE_KEY_METADATA = "cacheKey";
export declare const CACHE_TTL_METADATA = "cacheTTL";
export declare const CacheKey: (key: string) => import("@nestjs/common").CustomDecorator<string>;
export declare const CacheTTL: (ttl: number) => import("@nestjs/common").CustomDecorator<string>;
export declare class CacheInterceptor implements NestInterceptor {
    private readonly redis;
    private readonly reflector;
    constructor(redis: Redis, reflector: Reflector);
    intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>>;
}
export declare const SkipCache: () => import("@nestjs/common").CustomDecorator<string>;
