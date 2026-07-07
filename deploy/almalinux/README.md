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

## Domain or IP support

A domain is recommended for final production because it allows HTTPS and secure cookies.

If no domain is available yet, deploy with the server public IP first:

```text
PUBLIC_HOST=SERVER_IP
PUBLIC_ORIGIN=http://SERVER_IP
```

When a domain becomes available, switch to:

```text
PUBLIC_HOST=your-domain.com
PUBLIC_ORIGIN=https://your-domain.com
```

Then rebuild the frontend and enable TLS with Certbot.

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

If you already cloned the repository, skip the clone command and make sure the app path is `/opt/wavelab/app` or set `APP_ROOT` when running `deploy.sh`.

Recommended path:

```bash
sudo useradd --system --create-home --shell /bin/bash wavelab || true
sudo mkdir -p /opt/wavelab
sudo chown -R wavelab:wavelab /opt/wavelab
sudo -u wavelab git clone -b main https://github.com/karlbernaldez/pagasa-wave.git /opt/wavelab/app
```

If the repo is already cloned somewhere else, either move it:

```bash
sudo mkdir -p /opt/wavelab
sudo mv /path/to/current/clone /opt/wavelab/app
sudo chown -R wavelab:wavelab /opt/wavelab/app
```

or run the deployment helper with a custom root:

```bash
sudo APP_ROOT=/path/to/current/clone bash deploy/almalinux/deploy.sh SERVER_IP
```

Install Node.js 20 or 22 LTS before running the deployment helper. Confirm:

```bash
node -v
npm -v
corepack --version
```

## Configure backend environment

Create the backend environment file. Use your server IP while there is no domain:

```bash
SERVER_IP=203.0.113.10
sudo mkdir -p /etc/wavelab
sudo cp /opt/wavelab/app/deploy/almalinux/backend.env.example /etc/wavelab/backend.env
sudo sed -i "s|__PUBLIC_ORIGIN__|http://$SERVER_IP|g" /etc/wavelab/backend.env
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
CORS_ALLOWED_ORIGINS=http://SERVER_IP
```

Do not put `JWT_SECRET` or `JWT_REFRESH_SECRET` in frontend env files.

## Configure frontend environment

Create the frontend build env. Use your server IP while there is no domain:

```bash
SERVER_IP=203.0.113.10
sudo -u wavelab cp /opt/wavelab/app/deploy/almalinux/frontend.env.example /opt/wavelab/app/frontend/.env.production
sudo -u wavelab sed -i "s|__PUBLIC_ORIGIN__|http://$SERVER_IP|g" /opt/wavelab/app/frontend/.env.production
sudo -u wavelab nano /opt/wavelab/app/frontend/.env.production
```

Expected values for IP-only deployment:

```text
VITE_API_URL=http://SERVER_IP
VITE_MAPBOX_ACCESS_TOKEN=...
```

Only public browser-safe values should be placed here.

## Deploy without a domain

Run from the repository root with the server public IP:

```bash
cd /opt/wavelab/app
sudo bash deploy/almalinux/deploy.sh SERVER_IP
```

You can also let the script try to auto-detect the public IP:

```bash
cd /opt/wavelab/app
sudo bash deploy/almalinux/deploy.sh
```

Explicitly passing the IP is safer.

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

## Enable domain and HTTPS later

After DNS points to the server, update backend env:

```bash
sudo nano /etc/wavelab/backend.env
```

Change:

```text
CORS_ALLOWED_ORIGINS=http://SERVER_IP
```

to:

```text
CORS_ALLOWED_ORIGINS=https://your-domain.com
```

Update frontend env:

```bash
sudo -u wavelab nano /opt/wavelab/app/frontend/.env.production
```

Change:

```text
VITE_API_URL=http://SERVER_IP
```

to:

```text
VITE_API_URL=https://your-domain.com
```

Update Nginx for the domain and rebuild frontend:

```bash
cd /opt/wavelab/app
sudo bash deploy/almalinux/deploy.sh your-domain.com
```

Then enable HTTPS:

```bash
sudo dnf install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

After HTTPS is active, validate again.

## Validate after deployment

For IP-only deployment:

```bash
curl -i http://127.0.0.1:5000/status
curl -i http://SERVER_IP/api/status
sudo systemctl status redis
sudo systemctl status nginx
sudo systemctl status wavelab-backend
sudo journalctl -u wavelab-backend -n 100 --no-pager
sudo tail -n 100 /var/log/nginx/error.log
```

For domain + HTTPS deployment:

```bash
curl -i https://your-domain.com/api/status
sudo systemctl status redis
sudo systemctl status nginx
sudo systemctl status wavelab-backend
```

Application smoke tests:

```text
- Login works
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
sudo bash deploy/almalinux/deploy.sh SERVER_IP
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
- IP-only HTTP deployment is acceptable for initial staging, but final production should use a domain and HTTPS.
