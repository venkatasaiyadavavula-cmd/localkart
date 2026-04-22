"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkipCache = exports.CacheInterceptor = exports.CacheTTL = exports.CacheKey = exports.CACHE_TTL_METADATA = exports.CACHE_KEY_METADATA = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const ioredis_1 = require("@nestjs-modules/ioredis");
const ioredis_2 = require("ioredis");
const core_1 = require("@nestjs/core");
const common_2 = require("@nestjs/common");
exports.CACHE_KEY_METADATA = 'cacheKey';
exports.CACHE_TTL_METADATA = 'cacheTTL';
const CacheKey = (key) => (0, common_2.SetMetadata)(exports.CACHE_KEY_METADATA, key);
exports.CacheKey = CacheKey;
const CacheTTL = (ttl) => (0, common_2.SetMetadata)(exports.CACHE_TTL_METADATA, ttl);
exports.CacheTTL = CacheTTL;
let CacheInterceptor = class CacheInterceptor {
    redis;
    reflector;
    constructor(redis, reflector) {
        this.redis = redis;
        this.reflector = reflector;
    }
    async intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        if (request.method !== 'GET') {
            return next.handle();
        }
        const skipCache = this.reflector.get('skipCache', context.getHandler());
        if (skipCache) {
            return next.handle();
        }
        const customKey = this.reflector.get(exports.CACHE_KEY_METADATA, context.getHandler());
        const cacheKey = customKey ? `cache:${customKey}` : `cache:${request.url}`;
        const ttl = this.reflector.get(exports.CACHE_TTL_METADATA, context.getHandler()) || 60;
        try {
            const cachedData = await this.redis.get(cacheKey);
            if (cachedData) {
                console.log(`✅ CACHE HIT: ${cacheKey}`);
                return (0, rxjs_1.of)(JSON.parse(cachedData));
            }
            console.log(`❌ CACHE MISS: ${cacheKey}`);
            return next.handle().pipe((0, operators_1.tap)(async (data) => {
                if (data) {
                    await this.redis.setex(cacheKey, ttl, JSON.stringify(data));
                    console.log(`💾 CACHED: ${cacheKey} (TTL: ${ttl}s)`);
                }
            }));
        }
        catch (error) {
            console.error('Redis error, skipping cache:', error.message);
            return next.handle();
        }
    }
};
exports.CacheInterceptor = CacheInterceptor;
exports.CacheInterceptor = CacheInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, ioredis_1.InjectRedis)()),
    __metadata("design:paramtypes", [ioredis_2.Redis,
        core_1.Reflector])
], CacheInterceptor);
const SkipCache = () => (0, common_2.SetMetadata)('skipCache', true);
exports.SkipCache = SkipCache;
//# sourceMappingURL=cache.interceptor.js.map