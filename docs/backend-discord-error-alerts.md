# Backend Discord error alerts

WaveLab can send backend `error`-level logs to a Discord webhook while continuing to write the normal systemd journal and rotating log files.

## Behavior

- only Winston `error` events are sent
- unhandled Express errors pass through the shared error logger
- database and Socket.IO startup failures use the shared logger
- common credential fields and credentials embedded in MongoDB URIs are redacted
- Discord mentions are disabled
- duplicate errors are suppressed for five minutes by default
- webhook failures never stop the backend process
- stack traces and metadata are truncated to Discord-safe sizes

Warnings such as invalid OTP attempts are not sent. Errors such as SMTP delivery failures are sent.

## Production configuration

Create a dedicated Discord webhook for backend monitoring. Do not commit its URL to the repository.

Add these values to `/etc/wavelab/backend.env`:

```text
BACKEND_ERROR_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
BACKEND_ERROR_DISCORD_COOLDOWN_MS=300000
BACKEND_ERROR_DISCORD_TIMEOUT_MS=10000
```

The cooldown and timeout values are optional. They are expressed in milliseconds.

Keep the environment file restricted:

```bash
sudo chown root:root /etc/wavelab/backend.env
sudo chmod 600 /etc/wavelab/backend.env
```

Restart and validate:

```bash
sudo systemctl restart wavelab-backend
sudo systemctl is-active wavelab-backend
sudo journalctl -u wavelab-backend --since "5 minutes ago" --no-pager -l
```

## Supervised test

Use a temporary Node command from the backend directory so the production application does not need an intentionally broken endpoint:

```bash
cd /home/wavelab/app/backend
sudo -u wavelab env \
  BACKEND_ERROR_DISCORD_WEBHOOK_URL='YOUR_WEBHOOK_URL' \
  NODE_ENV=production \
  node --input-type=module -e "import { logger } from './utils/logger.js'; logger.error('Supervised Discord alert test', { test: true }); setTimeout(() => process.exit(0), 1500);"
```

For production validation, prefer loading the webhook from the protected environment file rather than exposing it in shell history:

```bash
cd /home/wavelab/app/backend
sudo bash -c 'set -a; source /etc/wavelab/backend.env; set +a; exec sudo -u wavelab --preserve-env=BACKEND_ERROR_DISCORD_WEBHOOK_URL,NODE_ENV node --input-type=module -e "import { logger } from \"./utils/logger.js\"; logger.error(\"Supervised Discord alert test\", { test: true }); setTimeout(() => process.exit(0), 1500);"'
```

Confirm one alert arrives in Discord and that no secret values appear in the message.

## Rollback

Remove `BACKEND_ERROR_DISCORD_WEBHOOK_URL` from `/etc/wavelab/backend.env` and restart the backend:

```bash
sudo systemctl restart wavelab-backend
```

With no webhook configured, Discord transport is not created. Normal journald and rotating-file logging continue unchanged.
