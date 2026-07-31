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

## 📝 API Overview

Base URL: `http://localhost:3001/api/v1` (production: `https://localkart.store/api/v1`)

### Backend modules (`backend/src/modules/`)

| Module | Route prefix | Purpose |
|--------|--------------|---------|
| **auth** | `/auth` | Register, login, OTP, password reset, JWT refresh |
| **users** | `/users` | Profile read/update |
| **addresses** | `/addresses` | Saved delivery addresses (CRUD, default) |
| **catalog** | `/catalog` | Products, categories, search, seller catalog, likes, today-offers |
| **cart** | `/cart` | Guest and authenticated cart |
| **orders** | `/orders` | Order create, status, OTP delivery, admin list |
| **payments** | `/payments` | Razorpay create/verify |
| **commission** | `/commission` | Weekly commission bills (seller pay, admin manage) |
| **webhooks** | `/webhooks` | Razorpay webhook handler |
| **returns** | `/returns` | Return/dispute requests and admin resolution |
| **reviews** | `/reviews` | Product reviews and helpful votes |
| **wishlist** | `/wishlist` | Wishlist toggle and list |
| **seller** | `/seller` | Shop profile, subscriptions, ad campaigns, earnings |
| **seller/staff** | `/seller/staff` | Staff employee management |
| **staff/work** | `/staff/work` | Staff panel (products, orders) |
| **admin** | `/admin` | Dashboard, moderation, commission rates, fraud, ad campaigns |
| **location** | `/location` | Nearby shops, delivery charge |
| **media** | `/media` | Image/video upload (S3 presigned URLs) |
| **ai** | `/ai` | AI-assisted product descriptions |
| **notifications** | — | Internal SMS, email, WhatsApp services (no public HTTP routes) |

### Example endpoints

**Authentication**
- `POST /auth/register` — User registration
- `POST /auth/login` — User login
- `POST /auth/verify-otp` — Verify phone number
- `POST /auth/send-otp` — Resend OTP

**Catalog & browse**
- `GET /catalog/products` — List/search products (filters, pagination)
- `GET /catalog/products/:slug` — Product detail by slug
- `POST /catalog/products/:id/like` — Toggle product like (JWT)
- `GET /catalog/categories` — List categories
- `GET /catalog/today-offers` — Daily offers near location

**Orders & payments**
- `POST /orders` — Create order
- `GET /orders/:id` — Order details
- `POST /orders/:id/verify-otp` — Verify delivery OTP
- `POST /payments/create` — Create Razorpay order
- `POST /payments/verify` — Verify payment

**Admin**
- `GET /admin/dashboard` — Dashboard stats
- `PUT /admin/products/:id/approve` — Approve product listing
- `GET /admin/fraud/suspicious-orders` — Fraud monitoring
- `GET /commission/admin/bills` — Weekly commission bills

See Swagger at `/api/docs` when enabled for the full route list.

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
