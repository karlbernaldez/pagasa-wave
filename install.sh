#!/bin/bash
set -e  # Stop on error

# === CONFIG ===
APP_NAME="votewave"
APP_DIR="/var/www/$APP_NAME"
GIT_REPO="https://github.com/karlbernaldez/pagasa-wave.git"
BRANCH="main"
DOMAIN=""  # leave blank to auto-use server IP (no SSL)
EMAIL="admin@example.com"  # for Let's Encrypt notifications

BACKEND_PORT=5000
FRONTEND_BUILD_DIR="$APP_DIR/frontend/build"

echo "==============================="
echo "🚀 Installing $APP_NAME (frontend + backend)"
echo "==============================="

# --- Update & install dependencies ---
sudo apt update -y
sudo apt install -y git curl nginx

# --- Node.js setup ---
if ! command -v node >/dev/null 2>&1; then
  echo "📦 Installing Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi

# --- Install PM2 globally ---
sudo npm install -g pm2

# --- Clone or pull latest repo ---
if [ -d "$APP_DIR/.git" ]; then
  echo "📂 Updating existing repo..."
  cd "$APP_DIR"
  sudo git pull origin "$BRANCH"
else
  echo "📂 Cloning repository..."
  sudo git clone -b "$BRANCH" "$GIT_REPO" "$APP_DIR"
fi

# --- FRONTEND SETUP ---
echo "🧱 Building frontend..."
cd "$APP_DIR/frontend"

echo "📦 Installing frontend dependencies..."
if ! sudo npm install; then
  echo "⚠️ npm install failed — retrying with legacy peer deps..."
  sudo npm install --legacy-peer-deps
fi

sudo npm run build

# --- BACKEND SETUP ---
echo "⚙️ Setting up backend..."
cd "$APP_DIR/backend"

echo "📦 Installing backend dependencies..."
if ! sudo npm install; then
  echo "⚠️ npm install failed — retrying with legacy peer deps..."
  sudo npm install --legacy-peer-deps
fi

# Optional: If backend also has a build step (TypeScript, etc.)
if grep -q "\"build\"" package.json; then
  echo "🏗️ Building backend..."
  sudo npm run build
fi

# --- PM2 setup for backend ---
echo "🔧 Setting up PM2..."
pm2 delete "$APP_NAME-backend" || true
pm2 start npm --name "$APP_NAME-backend" -- run start
pm2 save
pm2 startup systemd -u "$USER" --hp "$HOME"

# --- Determine domain or IP ---
if [ -z "$DOMAIN" ]; then
  DOMAIN=$(hostname -I | awk '{print $1}')
  echo "🌐 No domain provided — using server IP: $DOMAIN (HTTP only)"
  USE_SSL=false
else
  echo "🌍 Using domain: $DOMAIN (will enable SSL)"
  USE_SSL=true
fi

# --- Nginx configuration ---
echo "🌐 Setting up Nginx..."
NGINX_CONF="/etc/nginx/sites-available/$APP_NAME"

sudo bash -c "cat > $NGINX_CONF" <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    root $FRONTEND_BUILD_DIR;
    index index.html index.htm;

    location /api {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location / {
        try_files \$uri /index.html;
    }
}
EOF

sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# --- SSL Setup (Certbot) ---
if [ "$USE_SSL" = true ]; then
  echo "🔒 Installing Certbot for SSL..."
  sudo apt install -y certbot python3-certbot-nginx

  echo "🔐 Requesting SSL certificate for $DOMAIN..."
  sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect

  echo "🔁 Setting up auto-renewal..."
  sudo systemctl enable certbot.timer
  sudo systemctl start certbot.timer
fi

# --- Done ---
echo "===================================="
echo "✅ $APP_NAME successfully deployed!"
if [ "$USE_SSL" = true ]; then
  echo "🌐 Frontend: https://$DOMAIN"
  echo "🛠️ Backend: https://$DOMAIN/api"
else
  echo "🌐 Frontend: http://$DOMAIN"
  echo "🛠️ Backend: http://$DOMAIN/api"
fi
echo "===================================="
