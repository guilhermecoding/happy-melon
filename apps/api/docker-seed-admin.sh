#!/bin/sh
set -e
cd /app/apps/api
exec node --import tsx src/auth/seed-admin.ts
