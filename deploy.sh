#!/bin/bash
set -e

# =============================================================================
# RentAMan - Full Deployment Script for AWS EC2 Ubuntu
# Domain: rentaman.brillixtechnologies.com
# =============================================================================
# USAGE: Run this script on your EC2 Ubuntu server
#   chmod +x deploy.sh
#   ./deploy.sh
#
# IMPORTANT: Replace placeholder values before running:
#   - GITHUB_REPO_URL (line ~60)
#   - JWT secrets (generated during script)
#   - Razorpay keys
#   - SMTP credentials
# =============================================================================

DOMAIN="rentaman.brillixtechnologies.com"
API_DOMAIN="api.rentaman.brillixtechnologies.com"
APP_DIR="/var/www/rentaman"
LOG_DIR="/var/log/pm2"

echo "==========================================="
echo " RentAMan Deployment Script"
echo " Frontend: $DOMAIN"
echo " Backend:  $API_DOMAIN"
echo "==========================================="
echo ""

# ---------------------------------------------------------------------------
# STEP 1: Install Node.js, PM2, Docker, and Dependencies
# ---------------------------------------------------------------------------
echo ">>> STEP 1: Installing system dependencies..."

# Update packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "Node.js already installed: $(node -v)"
fi

# Install PM2
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
else
    echo "PM2 already installed: $(pm2 -v)"
fi

# Install Docker
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    sudo apt install -y ca-certificates curl gnupg
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo usermod -aG docker $USER
else
    echo "Docker already installed: $(docker --version)"
fi

# Install build tools for bcrypt native compilation
sudo apt install -y build-essential python3

echo "Node.js: $(node -v)"
echo "npm: $(npm -v)"
echo "PM2: $(pm2 -v)"
echo "Docker: $(docker --version)"
echo ""
echo ">>> STEP 1 COMPLETE"
echo ""

# ---------------------------------------------------------------------------
# STEP 2: Clone Project and Install Dependencies
# ---------------------------------------------------------------------------
echo ">>> STEP 2: Setting up project..."

sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# !! REPLACE THIS WITH YOUR ACTUAL GITHUB REPO URL !!
GITHUB_REPO_URL="https://github.com/YOUR_USERNAME/rentAMan.git"

if [ ! -d "$APP_DIR/.git" ]; then
    echo "Cloning repository..."
    git clone $GITHUB_REPO_URL $APP_DIR
else
    echo "Repository already cloned, pulling latest..."
    cd $APP_DIR
    git pull origin main
fi

cd $APP_DIR
echo "Installing dependencies..."
npm install

echo ">>> STEP 2 COMPLETE"
echo ""

# ---------------------------------------------------------------------------
# STEP 3: Start Docker Services (PostgreSQL + MinIO)
# ---------------------------------------------------------------------------
echo ">>> STEP 3: Starting Docker services..."

cd $APP_DIR
docker compose up -d

echo "Waiting for PostgreSQL to be ready..."
sleep 10

# Verify containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ">>> STEP 3 COMPLETE"
echo ""

# ---------------------------------------------------------------------------
# STEP 4: Configure Environment Variables
# ---------------------------------------------------------------------------
echo ">>> STEP 4: Configuring environment variables..."

# Generate JWT secrets
JWT_SECRET=$(openssl rand -base64 48)
JWT_REFRESH_SECRET=$(openssl rand -base64 48)

# Backend .env
cat > $APP_DIR/backend/.env << EOF
# App
NODE_ENV=production
PORT=3001
API_PREFIX=api/v1

# Database
DATABASE_URL=postgresql://rentaman:rentaman_secret@localhost:5432/rentaman_db?schema=public

# JWT
JWT_SECRET=$JWT_SECRET
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
JWT_REFRESH_EXPIRATION=7d

# S3 / MinIO
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=rentaman-uploads
S3_REGION=us-east-1

# Razorpay - UPDATE THESE WITH YOUR KEYS
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# SMTP - UPDATE THESE WITH YOUR CREDENTIALS
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="RentAMan <noreply@rentaman.com>"

# Frontend URL
FRONTEND_URL=https://$DOMAIN

# CORS
CORS_ORIGIN=https://$DOMAIN
EOF

# Frontend .env.local
cat > $APP_DIR/frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=https://$API_DOMAIN/api/v1
NEXT_PUBLIC_WS_URL=https://$API_DOMAIN
EOF

echo ""
echo "!!! IMPORTANT: Edit these files with your actual credentials !!!"
echo "  - $APP_DIR/backend/.env (Razorpay keys, SMTP credentials)"
echo ""
echo ">>> STEP 4 COMPLETE"
echo ""

# ---------------------------------------------------------------------------
# STEP 5: Setup MinIO Bucket
# ---------------------------------------------------------------------------
echo ">>> STEP 5: Setting up MinIO bucket..."

# Download MinIO Client if not present
if ! command -v mc &> /dev/null; then
    curl -sL https://dl.min.io/client/mc/release/linux-amd64/mc -o /tmp/mc
    sudo mv /tmp/mc /usr/local/bin/mc
    sudo chmod +x /usr/local/bin/mc
fi

# Wait for MinIO to be ready
sleep 5

# Configure and create bucket
mc alias set local http://localhost:9000 minioadmin minioadmin
mc mb local/rentaman-uploads --ignore-existing
mc anonymous set download local/rentaman-uploads

echo ">>> STEP 5 COMPLETE"
echo ""

# ---------------------------------------------------------------------------
# STEP 6: Database Setup (Prisma Migrations + Seed)
# ---------------------------------------------------------------------------
echo ">>> STEP 6: Setting up database..."

cd $APP_DIR/backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed initial data
npx prisma db seed

echo ">>> STEP 6 COMPLETE"
echo ""

# ---------------------------------------------------------------------------
# STEP 7: Build Backend and Frontend
# ---------------------------------------------------------------------------
echo ">>> STEP 7: Building applications..."

cd $APP_DIR

echo "Building backend..."
npm run build:backend

echo "Building frontend..."
npm run build:frontend

echo ">>> STEP 7 COMPLETE"
echo ""

# ---------------------------------------------------------------------------
# STEP 8: Setup PM2 Process Management
# ---------------------------------------------------------------------------
echo ">>> STEP 8: Starting PM2 processes..."

# Create log directory
sudo mkdir -p $LOG_DIR
sudo chown $USER:$USER $LOG_DIR

# Stop existing processes if any
pm2 delete rentaman-backend 2>/dev/null || true
pm2 delete rentaman-frontend 2>/dev/null || true

# Start all processes using ecosystem config
cd $APP_DIR
pm2 start ecosystem.config.js

# Save process list and enable startup
pm2 save

echo ""
echo "Run this command to enable auto-start on reboot:"
echo "  pm2 startup"
echo "Then run the command PM2 outputs (starts with 'sudo env PATH=...')"
echo ""

# Setup log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true

pm2 status

echo ">>> STEP 8 COMPLETE"
echo ""

# ---------------------------------------------------------------------------
# STEP 9: Configure Apache as Reverse Proxy
# ---------------------------------------------------------------------------
echo ">>> STEP 9: Configuring Apache reverse proxy..."

# Enable required modules
sudo a2enmod proxy proxy_http proxy_wstunnel rewrite headers ssl

# Frontend VirtualHost
sudo tee /etc/apache2/sites-available/rentaman-frontend.conf > /dev/null << EOF
<VirtualHost *:80>
    ServerName $DOMAIN

    ProxyPreserveHost On

    # Proxy all requests to Next.js
    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/

    ErrorLog \${APACHE_LOG_DIR}/rentaman-frontend-error.log
    CustomLog \${APACHE_LOG_DIR}/rentaman-frontend-access.log combined
</VirtualHost>
EOF

# Backend API VirtualHost
sudo tee /etc/apache2/sites-available/rentaman-backend.conf > /dev/null << EOF
<VirtualHost *:80>
    ServerName $API_DOMAIN

    ProxyPreserveHost On

    # WebSocket support for Socket.io
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule /(.*) ws://127.0.0.1:3001/\$1 [P,L]

    # Proxy API requests to NestJS
    ProxyPass / http://127.0.0.1:3001/
    ProxyPassReverse / http://127.0.0.1:3001/

    ErrorLog \${APACHE_LOG_DIR}/rentaman-backend-error.log
    CustomLog \${APACHE_LOG_DIR}/rentaman-backend-access.log combined
</VirtualHost>
EOF

# Enable sites
sudo a2ensite rentaman-frontend.conf
sudo a2ensite rentaman-backend.conf

# Test and reload Apache
sudo apachectl configtest
sudo systemctl reload apache2

echo ">>> STEP 9 COMPLETE"
echo ""

# ---------------------------------------------------------------------------
# STEP 10: Firewall (UFW)
# ---------------------------------------------------------------------------
echo ">>> STEP 10: Configuring firewall..."

sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
echo "y" | sudo ufw enable

sudo ufw status

echo ">>> STEP 10 COMPLETE"
echo ""

# ---------------------------------------------------------------------------
# DONE (Steps 11-14 require manual action)
# ---------------------------------------------------------------------------
echo "==========================================="
echo " AUTOMATED STEPS COMPLETE!"
echo "==========================================="
echo ""
echo "REMAINING MANUAL STEPS:"
echo ""
echo "1. DNS RECORDS - Add these A records in your DNS provider:"
echo "   $DOMAIN         -> $(curl -s ifconfig.me)"
echo "   $API_DOMAIN     -> $(curl -s ifconfig.me)"
echo ""
echo "2. UPDATE CREDENTIALS - Edit backend .env with real values:"
echo "   nano $APP_DIR/backend/.env"
echo "   (Update Razorpay keys, SMTP credentials)"
echo "   Then restart: pm2 restart rentaman-backend"
echo ""
echo "3. SSL CERTIFICATES - Run after DNS propagation:"
echo "   sudo apt install -y certbot python3-certbot-apache"
echo "   sudo certbot --apache -d $DOMAIN -d $API_DOMAIN"
echo ""
echo "4. POST-SSL WEBSOCKET FIX - After certbot creates SSL vhost:"
echo "   sudo nano /etc/apache2/sites-available/rentaman-backend-le-ssl.conf"
echo "   Add inside <VirtualHost *:443>:"
echo "     RewriteEngine On"
echo "     RewriteCond %{HTTP:Upgrade} websocket [NC]"
echo "     RewriteCond %{HTTP:Connection} upgrade [NC]"
echo "     RewriteRule /(.*) ws://127.0.0.1:3001/\$1 [P,L]"
echo "   Then: sudo systemctl reload apache2"
echo ""
echo "5. ENABLE PM2 STARTUP:"
echo "   pm2 startup"
echo "   (Run the sudo command it outputs)"
echo "   pm2 save"
echo ""
echo "6. VERIFY:"
echo "   curl http://localhost:3001/api/v1/health"
echo "   curl http://localhost:3000"
echo "   pm2 status"
echo "   docker ps"
echo ""
echo "==========================================="
