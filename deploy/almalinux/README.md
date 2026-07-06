# WaveLab AlmaLinux Production Deployment

This folder contains the production deployment template for running WaveLab on AlmaLinux 9.x.

It replaces the old installer. Do not use the legacy root `install.sh` for AlmaLinux production deployments.

## Target architecture

```text
Nginx
  - serves frontend/dist
  - proxies /api to 127.0.0.1:5000
  - proxies /socket.io to 127.0.0.1:5000

systemd
  - runs backend/server.js as the wavelab user

Redis
  - required for startup and Socket.IO adapter

MongoDB
  - use managed MongoDB or a separately maintained MongoDB server
```

## Files

```text
deploy/almalinux/
├── README.md
├── backend.env.example
├── frontend.env.example
├── nginx.conf
├── wavelab-backend.service
└── deploy.sh
```

## Assumptions

- AlmaLinux 9.x server
- Repository checked out at `/opt/wavelab/app`
- Backend runs on `127.0.0.1:5000`
- Frontend build output is `/opt/wavelab/app/frontend/dist`
- Real secrets are stored in `/etc/wavelab/backend.env`
- Frontend `.env.production` contains only browser-safe public values

## First-time server preparation

Create the application user and clone the repository:

```bash
sudo useradd --system --create-home --shell /bin/bash wavelab || true
sudo mkdir -p /opt/wavelab
sudo chown -R wavelab:wavelab /opt/wavelab
sudo -u wavelab git clone -b main https://github.com/karlbernaldez/pagasa-wave.git /opt/wavelab/app
```

Install Node.js 20 or 22 LTS before running the deployment helper. Confirm:

```bash
node -v
npm -v
corepack --version
```

## Configure backend environment

Create the backend environment file:

```bash
sudo mkdir -p /etc/wavelab
sudo cp /opt/wavelab/app/deploy/almalinux/backend.env.example /etc/wavelab/backend.env
sudo sed -i 's/__DOMAIN__/your-domain.com/g' /etc/wavelab/backend.env
sudo chmod 600 /etc/wavelab/backend.env
sudo chown root:root /etc/wavelab/backend.env
sudo nano /etc/wavelab/backend.env
```

Required values:

```text
NODE_ENV=production
PORT=5000
MONGO_URI=...
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=...
JWT_REFRESH_SECRET=...
ADMIN_KEY=...
CORS_ALLOWED_ORIGINS=https://your-domain.com
```

Do not put `JWT_SECRET` or `JWT_REFRESH_SECRET` in frontend env files.

## Configure frontend environment

Create the frontend build env:

```bash
sudo -u wavelab cp /opt/wavelab/app/deploy/almalinux/frontend.env.example /opt/wavelab/app/frontend/.env.production
sudo -u wavelab sed -i 's/__DOMAIN__/your-domain.com/g' /opt/wavelab/app/frontend/.env.production
sudo -u wavelab nano /opt/wavelab/app/frontend/.env.production
```

Expected values:

```text
VITE_API_URL=https://your-domain.com
VITE_MAPBOX_ACCESS_TOKEN=...
```

Only public browser-safe values should be placed here.

## Deploy

Run from the repository root:

```bash
cd /opt/wavelab/app
sudo bash deploy/almalinux/deploy.sh your-domain.com
```

The script will:

- install required AlmaLinux packages
- enable Redis and Nginx
- prepare runtime directories
- validate backend env is not using placeholders
- run backend tests
- run frontend tests and build
- install the systemd service
- install the Nginx config
- start/restart the backend
- validate `/status` locally

## Enable HTTPS

After DNS points to the server:

```bash
sudo dnf install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

After HTTPS is active, confirm these values:

```text
/etc/wavelab/backend.env:
CORS_ALLOWED_ORIGINS=https://your-domain.com

/opt/wavelab/app/frontend/.env.production:
VITE_API_URL=https://your-domain.com
```

If frontend env changes, rebuild the frontend:

```bash
cd /opt/wavelab/app/frontend
sudo -u wavelab pnpm build
sudo systemctl reload nginx
```

## Validate after deployment

```bash
curl -i http://127.0.0.1:5000/status
curl -i https://your-domain.com/api/status
sudo systemctl status redis
sudo systemctl status nginx
sudo systemctl status wavelab-backend
sudo journalctl -u wavelab-backend -n 100 --no-pager
sudo tail -n 100 /var/log/nginx/error.log
```

Application smoke tests:

```text
- Login works with secure cookies
- OTP flow works
- Forecaster and Admin roles work
- Project creation works
- Studio map loads
- Submit/review/approve/publish workflow works
- Public charts page loads
- PDF generation works
- Socket notifications connect successfully
```

## Rollback

The simple rollback is to reset to a known-good commit and redeploy:

```bash
cd /opt/wavelab/app
sudo systemctl stop wavelab-backend
sudo -u wavelab git fetch origin
sudo -u wavelab git checkout main
sudo -u wavelab git reset --hard <known-good-commit-sha>
sudo bash deploy/almalinux/deploy.sh your-domain.com
```

For stronger production safety, use release directories:

```text
/opt/wavelab/releases/<commit-sha>
/opt/wavelab/current -> /opt/wavelab/releases/<commit-sha>
```

Then point the systemd `WorkingDirectory` and Nginx root at `/opt/wavelab/current` paths.

## Operational notes

- Redis is required before backend startup.
- Nginx must proxy both `/api/` and `/socket.io/`.
- SELinux may block Nginx proxying unless `httpd_can_network_connect` is enabled.
- Backend logs are written under `/opt/wavelab/app/backend/logs` and should be monitored for disk usage.
- Real env files must never be committed.
