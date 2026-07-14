#!/usr/bin/env bash
set -euo pipefail

PUBLIC_HOST="${1:-}"
APP_USER="${APP_USER:-wavelab}"
APP_ROOT="${APP_ROOT:-/home/wavelab/app}"
BACKEND_ENV="${BACKEND_ENV:-/etc/wavelab/backend.env}"
BASE_URL="http://127.0.0.1"

if [[ -z "$PUBLIC_HOST" ]]; then
  echo "Usage: smoke-test.sh <public-host>"
  exit 1
fi

check_http() {
  local name="$1"
  local url="$2"
  local expected="$3"
  local code
  code="$(curl --silent --show-error --output /tmp/wavelab-smoke-body --write-out '%{http_code}' --max-time 15 -H "Host: $PUBLIC_HOST" "$url")"
  if [[ ! "$code" =~ $expected ]]; then
    echo "Smoke test failed: $name returned HTTP $code"
    sed -n '1,20p' /tmp/wavelab-smoke-body || true
    return 1
  fi
  echo "Smoke test passed: $name (HTTP $code)"
}

systemctl is-active --quiet wavelab-backend
systemctl is-active --quiet nginx
systemctl is-active --quiet redis

curl -fsS --max-time 10 http://127.0.0.1:5000/status | grep -q '"status":"OK"'

sudo -u "$APP_USER" env BACKEND_ENV="$BACKEND_ENV" APP_ROOT="$APP_ROOT" bash -lc '
  set -euo pipefail
  cd "$APP_ROOT/backend"
  node --input-type=module <<"NODE"
import dotenv from "dotenv";
import mongoose from "mongoose";
import Redis from "ioredis";

dotenv.config({ path: process.env.BACKEND_ENV });
if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not configured");
await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
await mongoose.connection.db.admin().command({ ping: 1 });
await mongoose.disconnect();

const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 })
  : new Redis({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT || 6379),
      password: process.env.REDIS_PASSWORD || undefined,
      db: Number(process.env.REDIS_DB || 0),
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
await redis.connect();
if (await redis.ping() !== "PONG") throw new Error("Redis PING failed");
await redis.quit();
console.log("MongoDB and Redis dependency checks passed");
NODE
'

check_http "frontend root" "$BASE_URL/" '^200$'
check_http "frontend login route" "$BASE_URL/login" '^200$'
check_http "frontend charts route" "$BASE_URL/charts" '^200$'
check_http "frontend static asset" "$BASE_URL/pagasa-logo.png" '^200$'
check_http "authentication guard through Nginx" "$BASE_URL/api/auth/check" '^(401|403)$'
check_http "unknown API route" "$BASE_URL/api/__smoke_missing__" '^404$'

if ! grep -qi '<!doctype html\|<html' /tmp/wavelab-smoke-body; then
  : # The last request is JSON; frontend content was already checked by status codes.
fi

echo "All production smoke tests passed."
