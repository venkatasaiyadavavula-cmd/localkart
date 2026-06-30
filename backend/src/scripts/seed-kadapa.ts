import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../core/entities/user.entity';
import { Shop, ShopStatus } from '../core/entities/shop.entity';
import { Category } from '../core/entities/category.entity';
import { Product, ProductStatus, ProductCategoryType } from '../core/entities/product.entity';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'localkart',
  entities: [User, Shop, Category, Product],
  synchronize: false,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('🌱 Seeding Kadapa data...');

  const userRepo = AppDataSource.getRepository(User);
  const shopRepo = AppDataSource.getRepository(Shop);
  const categoryRepo = AppDataSource.getRepository(Category);
  const productRepo = AppDataSource.getRepository(Product);

  // Create Admin
  const adminExists = await userRepo.findOne({ where: { phone: '9999999999' } });
  if (!adminExists) {
    const admin = userRepo.create({
      name: 'Admin User',
      phone: '9999999999',
      email: 'admin@localkart.com',
      password: await bcrypt.hash('Admin@123', 10),
      role: UserRole.ADMIN,
      isPhoneVerified: true,
    });
    await userRepo.save(admin);
    console.log('✅ Admin created');
  }

  // Create Categories
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

  // Kadapa Shops
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
        role: UserRole.SELLER,
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
        status: ShopStatus.APPROVED,
        location: `ST_SetSRID(ST_MakePoint(${shopData.shop.longitude}, ${shopData.shop.latitude}), 4326)` as any,
      });
      await shopRepo.save(shop);
      console.log(`✅ Shop "${shop.name}" created`);
    }
  }

  // Sample Products for first shop
  const firstShop = await shopRepo.findOne({ where: { contactPhone: '9988776655' } });
  if (firstShop) {
    const products = [
      { name: 'Tata Salt (1kg)', price: 28, mrp: 30, stock: 100, categoryType: ProductCategoryType.GROCERIES },
      { name: 'Fortune Sunflower Oil (1L)', price: 145, mrp: 160, stock: 50, categoryType: ProductCategoryType.GROCERIES },
      { name: 'Aashirvaad Atta (5kg)', price: 220, mrp: 240, stock: 30, categoryType: ProductCategoryType.GROCERIES },
      { name: 'Surf Excel Matic (1kg)', price: 180, mrp: 200, stock: 25, categoryType: ProductCategoryType.HOME_ESSENTIALS },
    ];

    for (const p of products) {
      const exists = await productRepo.findOne({ where: { name: p.name, shopId: firstShop.id } });
      if (!exists) {
        await productRepo.save(productRepo.create({
          ...p,
          slug: p.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          shopId: firstShop.id,
          status: ProductStatus.APPROVED,
        }));
      }
    }
    console.log('✅ Sample products added');
  }

  console.log('🎉 Kadapa seeding completed!');
  await AppDataSource.destroy();
}

seed().catch(console.error);
