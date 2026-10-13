# ==============================================================================
# SANGITA TRAVELS PUNE (PUNE MUMBAI CAB) - BACKEND DOCKERFILE
# Multi-stage secure container for Python 3.11 with SQLite WAL & persistent storage
# ==============================================================================

FROM python:3.11-slim as runtime

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080 \
    ENVIRONMENT=production

WORKDIR /app

# Install system dependencies (curl for healthchecks, sqlite3)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source
COPY backend /app/backend

# Create persistent storage directories
RUN mkdir -p /app/backend/data /app/backend/data/logs

# Create and switch to non-root system user
RUN useradd -u 1001 -m -s /bin/bash appuser && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/api/health || exit 1

WORKDIR /app/backend

CMD ["sh", "-c", "python migrate.py up && python server.py"]
