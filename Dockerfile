# FastAPI Python Backend for Render Web Service
FROM python:3.11-slim
WORKDIR /app

# Install minimal runtime system utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application modules, schemas, and seeds
COPY backend/ ./backend
COPY seed/ ./seed
COPY schemas/ ./schemas

# Create persistent storage directory for SQLite
RUN mkdir -p /app/data

ENV CR_ENV=production
ENV PYTHONUNBUFFERED=1
ENV PORT=10000

EXPOSE 10000

CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-10000}"]
