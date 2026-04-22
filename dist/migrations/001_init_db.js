"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitDb0011700000000001 = void 0;
class InitDb0011700000000001 {
    name = 'InitDb0011700000000001';
    async up(queryRunner) {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);
        await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "phone" character varying(15) NOT NULL,
        "email" character varying(100),
        "password" character varying,
        "role" character varying NOT NULL DEFAULT 'customer',
        "isPhoneVerified" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        "address" character varying(255),
        "latitude" decimal(10,7),
        "longitude" decimal(10,7),
        "profileImage" character varying,
        "lastOtp" character varying,
        "lastOtpSentAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_phone" UNIQUE ("phone"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "shops" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(150) NOT NULL,
        "slug" character varying(100) NOT NULL,
        "description" text,
        "address" character varying(500) NOT NULL,
        "city" character varying(100) NOT NULL,
        "state" character varying(100) NOT NULL,
        "pincode" character varying(10) NOT NULL,
        "location" geography(Point,4326),
        "latitude" decimal(10,7) NOT NULL,
        "longitude" decimal(10,7) NOT NULL,
        "bannerImage" character varying,
        "logoImage" character varying,
        "contactPhone" character varying(15) NOT NULL,
        "contactEmail" character varying(100),
        "status" character varying NOT NULL DEFAULT 'pending',
        "totalProducts" integer NOT NULL DEFAULT 0,
        "totalOrders" integer NOT NULL DEFAULT 0,
        "totalEarnings" decimal(10,2) NOT NULL DEFAULT 0,
        "rating" integer NOT NULL DEFAULT 0,
        "reviewCount" integer NOT NULL DEFAULT 0,
        "openingTime" time,
        "closingTime" time,
        "deliveryPincodes" jsonb,
        "deliveryCharge" decimal(10,2) NOT NULL DEFAULT 0,
        "freeDeliveryAbove" decimal(10,2) NOT NULL DEFAULT 0,
        "fssaiLicense" character varying,
        "gstNumber" character varying,
        "panCard" character varying,
        "ownerId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_shops_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_shops" PRIMARY KEY ("id"),
        CONSTRAINT "FK_shops_owner" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
        await queryRunner.query(`CREATE INDEX "IDX_shops_location" ON "shops" USING GIST ("location");`);
        await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "slug" character varying(120) NOT NULL,
        "icon" character varying,
        "image" character varying,
        "description" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "displayOrder" integer NOT NULL DEFAULT 0,
        "commissionRate" decimal(5,2) NOT NULL DEFAULT 0,
        "mpath" character varying DEFAULT '',
        "parentId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_categories_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_categories" PRIMARY KEY ("id"),
        CONSTRAINT "FK_categories_parent" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(200) NOT NULL,
        "slug" character varying(250) NOT NULL,
        "description" text,
        "price" decimal(12,2) NOT NULL,
        "mrp" decimal(12,2),
        "discountPercentage" decimal(5,2),
        "stock" integer NOT NULL DEFAULT 0,
        "sku" character varying(50),
        "brand" character varying(100),
        "categoryType" character varying NOT NULL,
        "images" jsonb,
        "videos" jsonb,
        "attributes" jsonb,
        "status" character varying NOT NULL DEFAULT 'pending',
        "rejectionReason" character varying,
        "isSponsored" boolean NOT NULL DEFAULT false,
        "sponsoredUntil" TIMESTAMP,
        "viewCount" integer NOT NULL DEFAULT 0,
        "orderCount" integer NOT NULL DEFAULT 0,
        "rating" decimal(3,2) NOT NULL DEFAULT 0,
        "reviewCount" integer NOT NULL DEFAULT 0,
        "shopId" uuid NOT NULL,
        "categoryId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_products_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_products" PRIMARY KEY ("id"),
        CONSTRAINT "FK_products_shop" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_products_category" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "orderNumber" character varying(20) NOT NULL,
        "customerId" uuid NOT NULL,
        "shopId" uuid NOT NULL,
        "subtotal" decimal(12,2) NOT NULL,
        "deliveryCharge" decimal(10,2) NOT NULL DEFAULT 0,
        "discount" decimal(10,2) NOT NULL DEFAULT 0,
        "totalAmount" decimal(12,2) NOT NULL,
        "commissionAmount" decimal(12,2) NOT NULL DEFAULT 0,
        "commissionRate" decimal(5,2) NOT NULL DEFAULT 0,
        "paymentMethod" character varying NOT NULL DEFAULT 'cod',
        "paymentStatus" character varying NOT NULL DEFAULT 'pending',
        "status" character varying NOT NULL DEFAULT 'pending_otp',
        "shippingAddress" jsonb NOT NULL,
        "deliveryOtp" character varying,
        "deliveryNotes" text,
        "cancellationReason" character varying,
        "confirmedAt" TIMESTAMP,
        "deliveredAt" TIMESTAMP,
        "cancelledAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_orders_orderNumber" UNIQUE ("orderNumber"),
        CONSTRAINT "PK_orders" PRIMARY KEY ("id"),
        CONSTRAINT "FK_orders_customer" FOREIGN KEY ("customerId") REFERENCES "users"("id"),
        CONSTRAINT "FK_orders_shop" FOREIGN KEY ("shopId") REFERENCES "shops"("id")
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "orderId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "productName" character varying(200) NOT NULL,
        "productImage" character varying,
        "quantity" integer NOT NULL,
        "pricePerUnit" decimal(12,2) NOT NULL,
        "totalPrice" decimal(12,2) NOT NULL,
        "commissionRate" decimal(5,2) NOT NULL DEFAULT 0,
        "commissionAmount" decimal(12,2) NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_order_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_order_items_order" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_order_items_product" FOREIGN KEY ("productId") REFERENCES "products"("id")
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "shopId" uuid NOT NULL,
        "plan" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'pending',
        "productLimit" integer NOT NULL,
        "price" decimal(10,2) NOT NULL,
        "startDate" TIMESTAMP NOT NULL,
        "endDate" TIMESTAMP NOT NULL,
        "razorpaySubscriptionId" character varying,
        "razorpayPaymentId" character varying,
        "paymentDetails" jsonb,
        "autoRenew" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscriptions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_subscriptions_shop" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "orderId" uuid,
        "type" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'pending',
        "amount" decimal(12,2) NOT NULL,
        "currency" character varying NOT NULL DEFAULT 'INR',
        "razorpayPaymentId" character varying,
        "razorpayOrderId" character varying,
        "razorpaySignature" character varying,
        "metadata" jsonb,
        "failureReason" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transactions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_transactions_order" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "return_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "orderId" uuid NOT NULL,
        "customerId" uuid NOT NULL,
        "shopId" uuid NOT NULL,
        "reason" character varying NOT NULL,
        "description" text,
        "evidenceImages" jsonb,
        "evidenceVideo" character varying,
        "status" character varying NOT NULL DEFAULT 'pending',
        "refundAmount" decimal(12,2) NOT NULL,
        "rejectionReason" character varying,
        "pickupAddress" character varying,
        "pickupScheduledAt" TIMESTAMP,
        "pickupContactPhone" character varying,
        "resolvedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "REL_return_requests_order" UNIQUE ("orderId"),
        CONSTRAINT "PK_return_requests" PRIMARY KEY ("id"),
        CONSTRAINT "FK_return_requests_order" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_return_requests_customer" FOREIGN KEY ("customerId") REFERENCES "users"("id"),
        CONSTRAINT "FK_return_requests_shop" FOREIGN KEY ("shopId") REFERENCES "shops"("id")
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "sponsored_products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "productId" uuid NOT NULL,
        "shopId" uuid NOT NULL,
        "adType" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'pending',
        "costPerDay" decimal(10,2) NOT NULL,
        "startDate" date NOT NULL,
        "endDate" date NOT NULL,
        "totalCost" decimal(10,2) NOT NULL,
        "impressions" integer NOT NULL DEFAULT 0,
        "clicks" integer NOT NULL DEFAULT 0,
        "razorpayPaymentId" character varying,
        "targeting" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sponsored_products" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sponsored_products_product" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_sponsored_products_shop" FOREIGN KEY ("shopId") REFERENCES "shops"("id")
      )
    `);
        await queryRunner.query(`CREATE INDEX "IDX_orders_customerId" ON "orders" ("customerId");`);
        await queryRunner.query(`CREATE INDEX "IDX_orders_shopId" ON "orders" ("shopId");`);
        await queryRunner.query(`CREATE INDEX "IDX_products_shopId" ON "products" ("shopId");`);
        await queryRunner.query(`CREATE INDEX "IDX_products_categoryId" ON "products" ("categoryId");`);
        await queryRunner.query(`CREATE INDEX "IDX_subscriptions_shopId" ON "subscriptions" ("shopId");`);
        await queryRunner.query(`CREATE INDEX "IDX_sponsored_products_productId" ON "sponsored_products" ("productId");`);
        await queryRunner.query(`CREATE INDEX "IDX_sponsored_products_shopId" ON "sponsored_products" ("shopId");`);
        await queryRunner.query(`CREATE INDEX "IDX_transactions_orderId" ON "transactions" ("orderId");`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "sponsored_products"`);
        await queryRunner.query(`DROP TABLE "return_requests"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TABLE "subscriptions"`);
        await queryRunner.query(`DROP TABLE "order_items"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TABLE "shops"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP EXTENSION IF EXISTS postgis`);
    }
}
exports.InitDb0011700000000001 = InitDb0011700000000001;
//# sourceMappingURL=001_init_db.js.map