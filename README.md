# 🛒 LocalKart - Hyperlocal E-Commerce Platform

A full-stack hyperlocal e-commerce marketplace that connects customers with local shops in their city. Built with NestJS backend, Next.js frontend, PostgreSQL database, and featuring real-time order tracking, AI-powered features, and same-day delivery.

## 🚀 Features

### For Customers
- **Browse Local Shops**: Discover products from shops in your neighborhood
- **Geolocation Search**: Find shops within your radius using PostGIS
- **Real-time Order Tracking**: Track orders with live status updates
- **Secure Payments**: Integrated with Razorpay for seamless payments
- **Reviews & Ratings**: Share your experience with products and shops
- **Wishlist**: Save products for later purchase
- **Multiple Addresses**: Save and manage delivery addresses

### For Sellers
- **Shop Management**: Create and manage your shop profile
- **Product Catalog**: Add, edit, and manage products with AI descriptions
- **Order Management**: Process orders with OTP-based delivery verification
- **Analytics Dashboard**: Track sales, revenue, and performance metrics
- **Sponsored Products**: Promote products with ad campaigns
- **Daily Offers**: Create time-limited special offers
- **Subscription Plans**: Choose plans based on product limits

### For Admin
- **Shop Approval**: Review and approve shop registrations
- **Product Moderation**: Approve or reject product listings
- **Commission Management**: Set and manage platform commissions
- **Fraud Detection**: Automated fraud detection system
- **Dispute Resolution**: Handle customer-seller disputes
- **Revenue Analytics**: Track platform earnings

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL with PostGIS (Geospatial)
- **ORM**: TypeORM
- **Cache**: Redis with Bull Queues
- **Authentication**: JWT with Passport
- **Payment**: Razorpay
- **File Storage**: AWS S3
- **SMS**: Twilio / Fast2SMS
- **Email**: Nodemailer

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **UI Components**: Radix UI + shadcn/ui
- **Maps**: Leaflet + React Leaflet
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod

## 📋 Prerequisites

- Node.js (v18+)
- PostgreSQL (v14+) with PostGIS extension
- Redis (v6+)
- AWS Account (for S3)
- Razorpay Account
- Twilio/Fast2SMS Account

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/venkatasaiyadavavula-cmd/localkart.git
cd localkart
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### 3. Database Setup

```bash
# Ensure PostgreSQL is running with PostGIS extension
createdb localkart

# Run migrations
npm run migration:run

# Seed database (optional)
npm run seed
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Edit .env.local with your API URL
nano .env.local
```

### 5. Start Development Servers

```bash
# Terminal 1: Start Backend
cd backend
npm run start:dev

# Terminal 2: Start Frontend
cd frontend
npm run dev
```

## 🌐 Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api/v1
- **API Documentation**: http://localhost:3001/api/docs (when Swagger is enabled)

## 📁 Project Structure

```
localkart/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── core/            # Entities, guards, decorators
│   │   ├── modules/         # Feature modules (auth, catalog, orders, etc.)
│   │   ├── migrations/      # Database migrations
│   │   └── main.ts          # Application entry point
│   ├── test/                # Test files
│   └── package.json
├── frontend/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components
│   ├── lib/                 # Utilities and API clients
│   ├── store/               # Zustand stores
│   ├── hooks/               # Custom React hooks
│   ├── types/               # TypeScript types
│   └── package.json
└── README.md
```

## 🔑 Environment Variables

See `.env.example` for all required environment variables. Key variables include:

- Database credentials (PostgreSQL)
- Redis connection details
- JWT secrets
- SMS service credentials (Twilio/Fast2SMS)
- Razorpay keys
- AWS S3 credentials
- Email service settings

## 🧪 Testing

```bash
# Backend Tests
cd backend
npm run test              # Unit tests
npm run test:e2e          # End-to-end tests
npm run test:cov          # Coverage report

# Frontend Tests
cd frontend
npm run test              # Component tests
```

## 🚀 Deployment

### Backend Deployment

```bash
cd backend
npm run build
npm run start:prod
```

### Frontend Deployment

```bash
cd frontend
npm run build
npm run start
```

### Docker Deployment (Optional)

```bash
docker-compose up -d
```

## 📝 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/verify-otp` - Verify phone number
- `POST /api/v1/auth/send-otp` - Resend OTP

### Catalog
- `GET /api/v1/catalog/products` - List products
- `GET /api/v1/catalog/products/:slug` - Get product details
- `GET /api/v1/catalog/categories` - List categories
- `POST /api/v1/catalog/products` - Create product (seller)

### Orders
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders/:id` - Get order details
- `POST /api/v1/orders/:id/verify-otp` - Verify delivery OTP
- `GET /api/v1/orders/track/:orderNumber` - Track order

### Payments
- `POST /api/v1/payments/create` - Create payment order
- `POST /api/v1/payments/verify` - Verify payment
- `POST /api/v1/payments/webhook` - Razorpay webhook

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and unlicensed.

## 👨‍💻 Author

**Venkata Sai Yadav**
- GitHub: [@venkatasaiyadavavula-cmd](https://github.com/venkatasaiyadavavula-cmd)

## 🙏 Acknowledgments

- NestJS team for the amazing framework
- Next.js team for the React framework
- Radix UI for beautiful components
- The open-source community

## 📞 Support

For support, email support@localkart.com or open an issue in the repository.
