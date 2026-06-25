# 🚀 DigitalOcean Server Deployment Guide

## 📋 Prerequisites
- DigitalOcean Droplet (Ubuntu 20.04 or 22.04 recommended)
- SSH access to your server
- Domain name (optional)
- PowerShell on your local machine

---

## 🔗 Step 1: Connect to DigitalOcean Server

### From PowerShell (Windows):
```powershell
# Replace with your server IP
ssh root@your-server-ip

# Example:
# ssh root@143.198.123.45
```

### First time connection - you'll see:
```
The authenticity of host 'xxx.xxx.xxx.xxx' can't be established.
ECDSA key fingerprint is SHA256:...
Are you sure you want to continue connecting (yes/no)? yes
```

Type `yes` and enter your password (or use SSH key if configured).

---

## 🛠️ Step 2: Update Server & Install Dependencies

### Run these commands on your server:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x (using NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node.js installation
node --version
npm --version

# Install PostgreSQL 14 with PostGIS
sudo apt install -y postgresql postgresql-contrib postgis

# Install Redis
sudo apt install -y redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Install Nginx
sudo apt install -y nginx

# Install Git
sudo apt install -y git

# Install PM2 (process manager)
sudo npm install -g pm2
```

---

## 🗄️ Step 3: Setup PostgreSQL Database

```bash
# Switch to postgres user
sudo -u postgres psql

# Inside psql, run these commands:
CREATE DATABASE localkart;
CREATE USER localkart_user WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE localkart TO localkart_user;
\q

# Enable PostGIS extension
sudo -u postgres psql -d localkart -c "CREATE EXTENSION postgis;"
```

---

## 📁 Step 4: Clone Repository

```bash
# Navigate to home directory
cd ~

# Clone repository (replace with your actual repo URL)
git clone https://github.com/venkatasaiyadavavula-cmd/localkart.git

# Navigate to project
cd localkart
```

---

## 🔧 Step 5: Setup Backend

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file
nano .env
```

### Copy this to your .env file:
```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-domain.com

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=localkart_user
DB_PASSWORD=your_strong_password
DB_NAME=localkart

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=7d

# SMS (Twilio or Fast2SMS)
SMS_SERVICE=console
# For production, configure Twilio or Fast2SMS

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@your-domain.com

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# AWS S3 (optional)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=ap-south-1
AWS_S3_BUCKET=localkart-uploads
```

Save with `Ctrl+X`, then `Y`, then `Enter`.

```bash
# Run database migrations
npm run migration:run

# Build the application
npm run build

# Start with PM2
pm2 start dist/main.js --name localkart-backend
pm2 save
pm2 startup
```

---

## 🎨 Step 6: Setup Frontend

```bash
# Navigate to frontend
cd ~/localkart/frontend

# Install dependencies
npm install

# Create .env.local file
nano .env.local
```

### Copy this to your .env.local:
```env
NEXT_PUBLIC_API_URL=https://your-domain.com/api/v1
```

Save with `Ctrl+X`, then `Y`, then `Enter`.

```bash
# Build frontend
npm run build

# Start with PM2
pm2 start npm --name localkart-frontend -- start
pm2 save
```

---

## 🌐 Step 7: Configure Nginx Reverse Proxy

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/localkart
```

### Copy this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API Docs
    location /api/docs {
        proxy_pass http://localhost:3001/api/docs;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

Save with `Ctrl+X`, then `Y`, then `Enter`.

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/localkart /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## 🔒 Step 8: Setup SSL with Let's Encrypt (Optional but Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is already configured
```

---

## 🔥 Step 9: Configure Firewall

```bash
# Allow SSH
sudo ufw allow OpenSSH

# Allow HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## 📊 Step 10: Monitor Application

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs localkart-backend
pm2 logs localkart-frontend

# Restart application
pm2 restart localkart-backend
pm2 restart localkart-frontend

# Stop application
pm2 stop localkart-backend
pm2 stop localkart-frontend
```

---

## 🔄 Step 11: Update Application

When you push new code to GitHub:

```bash
cd ~/localkart
git pull

# Update backend
cd backend
npm install
npm run build
pm2 restart localkart-backend

# Update frontend
cd ~/localkart/frontend
npm install
npm run build
pm2 restart localkart-frontend
```

---

## 📱 Step 12: Test Your Application

1. Open browser and go to: `https://your-domain.com`
2. Test API docs: `https://your-domain.com/api/docs`
3. Test API health: `https://your-domain.com/api/v1`

---

## 🐛 Troubleshooting

### Check if services are running:
```bash
# PostgreSQL
sudo systemctl status postgresql

# Redis
sudo systemctl status redis-server

# Nginx
sudo systemctl status nginx

# PM2
pm2 status
```

### View logs:
```bash
# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# PM2 logs
pm2 logs

# Application logs
cd ~/localkart/backend
tail -f logs/combined.log
```

### Restart services:
```bash
# Restart Nginx
sudo systemctl restart nginx

# Restart PostgreSQL
sudo systemctl restart postgresql

# Restart Redis
sudo systemctl restart redis-server
```

---

## 📝 Quick Reference Commands

### Connect to server:
```powershell
ssh root@your-server-ip
```

### Check PM2 status:
```bash
pm2 status
```

### Restart backend:
```bash
cd ~/localkart/backend
pm2 restart localkart-backend
```

### Restart frontend:
```bash
cd ~/localkart/frontend
pm2 restart localkart-frontend
```

### View Nginx logs:
```bash
sudo tail -f /var/log/nginx/error.log
```

---

## ✅ Deployment Checklist

- [ ] Server connected via SSH
- [ ] Node.js 18.x installed
- [ ] PostgreSQL with PostGIS installed
- [ ] Redis installed and running
- [ ] Nginx installed and configured
- [ ] Repository cloned
- [ ] Backend dependencies installed
- [ ] Backend .env configured
- [ ] Database migrations run
- [ ] Backend running with PM2
- [ ] Frontend dependencies installed
- [ ] Frontend .env configured
- [ ] Frontend built and running with PM2
- [ ] Nginx reverse proxy configured
- [ ] SSL certificate installed (optional)
- [ ] Firewall configured
- [ ] Application tested

---

## 🎉 Your LocalKart is now live!

Access it at: `https://your-domain.com`
