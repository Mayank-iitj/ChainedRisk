#!/bin/sh
set -e

export PORT="${PORT:-80}"

# Auto-detect nameserver from /etc/resolv.conf
SYSTEM_RESOLVER=$(awk '/^nameserver/{print $2}' /etc/resolv.conf 2>/dev/null | tr '\n' ' ')
export DNS_RESOLVER="${SYSTEM_RESOLVER:-1.1.1.1 8.8.8.8}"

# If an external BACKEND_URL was supplied, use it; otherwise start embedded backend
if [ -n "$BACKEND_URL" ] && [ "$BACKEND_URL" != "http://127.0.0.1:8000" ] && [ "$BACKEND_URL" != "http://localhost:8000" ]; then
    export BACKEND_URL="${BACKEND_URL%/}"
    echo "[ChainedRisk] Routing to external backend: ${BACKEND_URL}"
else
    export BACKEND_URL="http://127.0.0.1:8000"
    echo "[ChainedRisk] Starting embedded backend on 127.0.0.1:8000..."
    if [ -d "/app/backend" ]; then
        cd /app
        python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 &
        UVICORN_PID=$!
        sleep 2
    fi
fi

# Extract hostname for Host header and SNI
BACKEND_HOST=$(echo "$BACKEND_URL" | sed -E 's|^https?://||' | sed -E 's|/.*$||' | sed -E 's|:[0-9]+$||')
export BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"

# Generate runtime-config.js for client-side discovery
mkdir -p /usr/share/nginx/html
cat <<EOF > /usr/share/nginx/html/runtime-config.js
window.__RUNTIME_CONFIG__ = {
  BACKEND_URL: "${BACKEND_URL}",
  GOOGLE_CLIENT_ID: "${GOOGLE_CLIENT_ID:-506395453665-diof91lvuhuhp4kgji3umibrjunuthq8.apps.googleusercontent.com}"
};
EOF

echo "[ChainedRisk] Starting Nginx on port ${PORT} with upstream ${BACKEND_URL}..."

# Remove any default sites to prevent port conflicts
rm -rf /etc/nginx/sites-enabled/default 2>/dev/null || true
mkdir -p /etc/nginx/templates /etc/nginx/conf.d

if [ -f /etc/nginx/templates/default.conf.template ]; then
    envsubst '${PORT} ${BACKEND_URL} ${BACKEND_HOST} ${DNS_RESOLVER}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
elif [ -f /etc/nginx/conf.d/default.conf.template ]; then
    envsubst '${PORT} ${BACKEND_URL} ${BACKEND_HOST} ${DNS_RESOLVER}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
fi

exec nginx -g "daemon off;"
