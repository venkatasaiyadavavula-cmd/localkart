"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const dotenv = __importStar(require("dotenv"));
const bcrypt = __importStar(require("bcrypt"));
const user_entity_1 = require("../core/entities/user.entity");
const shop_entity_1 = require("../core/entities/shop.entity");
const category_entity_1 = require("../core/entities/category.entity");
const product_entity_1 = require("../core/entities/product.entity");
dotenv.config();
const AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'localkart',
    entities: [user_entity_1.User, shop_entity_1.Shop, category_entity_1.Category, product_entity_1.Product],
    synchronize: false,
});
async function seed() {
    await AppDataSource.initialize();
    console.log('🌱 Seeding Kadapa data...');
    const userRepo = AppDataSource.getRepository(user_entity_1.User);
    const shopRepo = AppDataSource.getRepository(shop_entity_1.Shop);
    const categoryRepo = AppDataSource.getRepository(category_entity_1.Category);
    const productRepo = AppDataSource.getRepository(product_entity_1.Product);
    const adminExists = await userRepo.findOne({ where: { phone: '9999999999' } });
    if (!adminExists) {
        const admin = userRepo.create({
            name: 'Admin User',
            phone: '9999999999',
            email: 'admin@localkart.com',
            password: await bcrypt.hash('Admin@123', 10),
            role: user_entity_1.UserRole.ADMIN,
            isPhoneVerified: true,
        });
        await userRepo.save(admin);
        console.log('✅ Admin created');
    }
    const categories = [
        { name: 'Groceries', slug: 'groceries', commissionRate: 2 },
        { name: 'Fashion', slug: 'fashion', commissionRate: 4 },
        { name: 'Electronics', slug: 'electronics', commissionRate: 3 },
        { name: 'Home Essentials', slug: 'home-essentials', commissionRate: 4 },
        { name: 'Beauty', slug: 'beauty', commissionRate: 5 },
        { name: 'Accessories', slug: 'accessories', commissionRate: 5 },
    ];
    for (const cat of categories) {
        const exists = await categoryRepo.findOne({ where: { slug: cat.slug } });
        if (!exists) {
            await categoryRepo.save(categoryRepo.create(cat));
        }
    }
    console.log('✅ Categories seeded');
    const kadapaShops = [
        {
            ownerPhone: '9988776655',
            ownerName: 'Sri Venkateswara Kirana',
            shop: {
                name: 'Sri Venkateswara Kirana & General Store',
                description: 'Your neighborhood grocery store with fresh vegetables and daily essentials.',
                address: 'Near RTC Bus Stand, Kadapa',
                city: 'Kadapa',
                state: 'Andhra Pradesh',
                pincode: '516001',
                latitude: 14.4673,
                longitude: 78.8242,
                contactPhone: '9988776655',
                contactEmail: 'venkateswara@example.com',
                deliveryCharge: 20,
                freeDeliveryAbove: 300,
            },
        },
        {
            ownerPhone: '9876543210',
            ownerName: 'Kadapa Mobiles',
            shop: {
                name: 'Kadapa Mobiles & Electronics',
                description: 'Authorized dealer for all major mobile brands. Repair services available.',
                address: 'Madras Road, Kadapa',
                city: 'Kadapa',
                state: 'Andhra Pradesh',
                pincode: '516001',
                latitude: 14.4710,
                longitude: 78.8215,
                contactPhone: '9876543210',
                contactEmail: 'kadapamobiles@example.com',
                deliveryCharge: 30,
                freeDeliveryAbove: 500,
            },
        },
        {
            ownerPhone: '9966332211',
            ownerName: 'Lakshmi Fashions',
            shop: {
                name: 'Lakshmi Fashions & Boutique',
                description: 'Trendy clothing, sarees, and accessories for all occasions.',
                address: 'Seven Roads Junction, Kadapa',
                city: 'Kadapa',
                state: 'Andhra Pradesh',
                pincode: '516001',
                latitude: 14.4650,
                longitude: 78.8180,
                contactPhone: '9966332211',
                contactEmail: 'lakshmifashions@example.com',
                deliveryCharge: 25,
                freeDeliveryAbove: 400,
            },
        },
    ];
    for (const shopData of kadapaShops) {
        let owner = await userRepo.findOne({ where: { phone: shopData.ownerPhone } });
        if (!owner) {
            owner = userRepo.create({
                name: shopData.ownerName,
                phone: shopData.ownerPhone,
                email: `${shopData.ownerPhone}@example.com`,
                password: await bcrypt.hash('Shop@123', 10),
                role: user_entity_1.UserRole.SELLER,
                isPhoneVerified: true,
            });
            await userRepo.save(owner);
        }
        const existingShop = await shopRepo.findOne({ where: { ownerId: owner.id } });
        if (!existingShop) {
            const shop = shopRepo.create({
                ...shopData.shop,
                slug: shopData.shop.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                ownerId: owner.id,
                status: shop_entity_1.ShopStatus.APPROVED,
                location: () => `ST_SetSRID(ST_MakePoint(${shopData.shop.longitude}, ${shopData.shop.latitude}), 4326)`,
            });
            await shopRepo.save(shop);
            console.log(`✅ Shop "${shop.name}" created`);
        }
    }
    const firstShop = await shopRepo.findOne({ where: { contactPhone: '9988776655' } });
    if (firstShop) {
        const products = [
            { name: 'Tata Salt (1kg)', price: 28, mrp: 30, stock: 100, categoryType: product_entity_1.ProductCategoryType.GROCERIES },
            { name: 'Fortune Sunflower Oil (1L)', price: 145, mrp: 160, stock: 50, categoryType: product_entity_1.ProductCategoryType.GROCERIES },
            { name: 'Aashirvaad Atta (5kg)', price: 220, mrp: 240, stock: 30, categoryType: product_entity_1.ProductCategoryType.GROCERIES },
            { name: 'Surf Excel Matic (1kg)', price: 180, mrp: 200, stock: 25, categoryType: product_entity_1.ProductCategoryType.HOME_ESSENTIALS },
        ];
        for (const p of products) {
            const exists = await productRepo.findOne({ where: { name: p.name, shopId: firstShop.id } });
            if (!exists) {
                await productRepo.save(productRepo.create({
                    ...p,
                    slug: p.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                    shopId: firstShop.id,
                    status: product_entity_1.ProductStatus.APPROVED,
                }));
            }
        }
        console.log('✅ Sample products added');
    }
    console.log('🎉 Kadapa seeding completed!');
    await AppDataSource.destroy();
}
seed().catch(console.error);
//# sourceMappingURL=seed-kadapa.js.map