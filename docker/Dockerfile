# syntax=docker/dockerfile:1.2
# Use Python 3.11 slim image for smaller size
FROM python:3.11-slim

# Set environment variables (removed PIP_NO_CACHE_DIR)
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Set work directory
WORKDIR /app

# Install system dependencies (rarely change - good cache layer)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better Docker layer caching
COPY requirements.txt .

# Install Python dependencies with BuildKit cache mount
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

# Copy only necessary project files (not entire . directory)
COPY backend/ ./backend/
COPY firebase/ ./firebase/
COPY data.json .

# Create necessary directories if they don't exist
RUN mkdir -p ledgers

# Set the default working directory to backend for CLI commands
WORKDIR /app/backend

# Default command - can be overridden
CMD ["python", "main.py", "--help"]