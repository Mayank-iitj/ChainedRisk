#!/bin/sh
set -e

export PORT="${PORT:-80}"

# Auto-detect nameserver from /etc/resolv.conf
SYSTEM_RESOLVER=$(awk '/^nameserver/{print $2}' /etc/resolv.conf 2>/dev/null | tr '\n' ' ')
export DNS_RESOLVER="${SYSTEM_RESOLVER:-1.1.1.1 8.8.8.8}"

# If BACKEND_URL not set, default to 127.0.0.1:8000
BACKEND_URL="${BACKEND_URL:-http://127.0.0.1:8000}"
export BACKEND_URL="${BACKEND_URL%/}"

# Extract hostname for Host header and SNI (strip protocol, path, port)
BACKEND_HOST=$(echo "$BACKEND_URL" | sed -E 's|^https?://||' | sed -E 's|/.*$||' | sed -E 's|:[0-9]+$||')
export BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"

# Generate runtime-config.js for direct client-side consumption
cat <<EOF > /usr/share/nginx/html/runtime-config.js
window.__RUNTIME_CONFIG__ = {
  BACKEND_URL: "${BACKEND_URL}",
  GOOGLE_CLIENT_ID: "${GOOGLE_CLIENT_ID:-506395453665-diof91lvuhuhp4kgji3umibrjunuthq8.apps.googleusercontent.com}"
};
EOF

echo "[ChainedRisk] Starting Nginx on port ${PORT}..."
echo "[ChainedRisk] Backend: ${BACKEND_URL} (Host: ${BACKEND_HOST}, Resolvers: ${DNS_RESOLVER})"

if [ -f /etc/nginx/templates/default.conf.template ]; then
    envsubst '${PORT} ${BACKEND_URL} ${BACKEND_HOST} ${DNS_RESOLVER}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
elif [ -f /etc/nginx/conf.d/default.conf.template ]; then
    envsubst '${PORT} ${BACKEND_URL} ${BACKEND_HOST} ${DNS_RESOLVER}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
fi

exec nginx -g "daemon off;"
