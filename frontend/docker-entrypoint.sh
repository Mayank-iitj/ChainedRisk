#!/bin/sh
set -e

export PORT="${PORT:-80}"
BACKEND_URL="${BACKEND_URL:-http://127.0.0.1:8000}"
export BACKEND_URL="${BACKEND_URL%/}"

echo "[ChainedRisk] Starting Nginx on port ${PORT} with backend ${BACKEND_URL}..."

if [ -f /etc/nginx/templates/default.conf.template ]; then
    envsubst '${PORT} ${BACKEND_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
elif [ -f /etc/nginx/conf.d/default.conf.template ]; then
    envsubst '${PORT} ${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
fi

exec nginx -g "daemon off;"
