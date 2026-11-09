# Multi-stage production build for ChainedRisk
# Stage 1: Build React SPA
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Runtime with Python 3.11 + Nginx
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    gettext-base \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /etc/nginx/sites-enabled/default

WORKDIR /app

# Install Python backend dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application, schemas, and seeds
COPY backend/ ./backend
COPY seed/ ./seed
COPY schemas/ ./schemas
RUN mkdir -p /app/data /etc/nginx/templates /etc/nginx/conf.d /usr/share/nginx/html

# Copy compiled frontend distribution
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx templates and entrypoint
COPY default.conf.template /etc/nginx/templates/default.conf.template
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENV CR_ENV=production
ENV PYTHONUNBUFFERED=1
ENV PORT=10000

EXPOSE 80 10000

ENTRYPOINT ["/docker-entrypoint.sh"]
