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

## Production origin and HTTPS

WaveLab production authentication requires HTTPS because access, refresh, CSRF, and trusted-device cookies are security-sensitive.

Use a DNS name with TLS for production:

```text
PUBLIC_HOST=your-domain.com
PUBLIC_ORIGIN=https://your-domain.com
```

Do not run the production configuration over plain HTTP. IP-only HTTP may be used only for isolated development/testing with a non-production environment configuration; it is not a supported production deployment mode.

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

Create the backend environment file after the production domain is known:

```bash
PUBLIC_ORIGIN=https://your-domain.com
sudo mkdir -p /etc/wavelab
sudo cp /opt/wavelab/app/deploy/almalinux/backend.env.example /etc/wavelab/backend.env
sudo sed -i "s|__PUBLIC_ORIGIN__|$PUBLIC_ORIGIN|g" /etc/wavelab/backend.env
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
CSRF_SECRET=...
COOKIE_SECURE=true
COOKIE_SAME_SITE=strict
ADMIN_KEY=...
CORS_ALLOWED_ORIGINS=https://your-domain.com
WAVELAB_CHAT_ENABLED=false
```

Use three separate, cryptographically random secrets for `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `CSRF_SECRET`. Do not put any of them in frontend env files.

## Configure frontend environment

Create the frontend build environment using the same HTTPS origin:

```bash
PUBLIC_ORIGIN=https://your-domain.com
sudo -u wavelab cp /opt/wavelab/app/deploy/almalinux/frontend.env.example /opt/wavelab/app/frontend/.env
sudo -u wavelab sed -i "s|__PUBLIC_ORIGIN__|$PUBLIC_ORIGIN|g" /opt/wavelab/app/frontend/.env
sudo -u wavelab nano /opt/wavelab/app/frontend/.env
```

Expected values:

```text
VITE_API_URL=https://your-domain.com
VITE_WW3_TILE_BASE=https://your-domain.com/wavetiles
VITE_MAPBOX_ACCESS_TOKEN=...
VITE_WAVELAB_CHAT_ENABLED=false
```

Only public browser-safe values should be placed here.

The chatbot/RAG capability is experimental and excluded from the core operational scope. Keep both chatbot flags absent or set to `false`. Enabling the backend API or frontend widget requires an explicit experimental deployment decision and must not be interpreted as operational authorization.

## Deploy with HTTPS

Point DNS to the server first, then obtain a TLS certificate for the production domain. Configure `PUBLIC_ORIGIN=https://your-domain.com` in the deployment environment and run:

```bash
cd /opt/wavelab/app
sudo PUBLIC_ORIGIN=https://your-domain.com bash deploy/almalinux/deploy.sh your-domain.com
```

Before enabling production traffic, confirm Nginx is serving the domain over HTTPS and that `CORS_ALLOWED_ORIGINS` exactly matches the HTTPS frontend origin.

## Validate after deployment

For the domain + HTTPS deployment:

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
- Production authentication requires HTTPS and secure cookies. Do not expose a production-configured WaveLab deployment over plain HTTP.
