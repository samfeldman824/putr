# Docker Build Speed Optimization Plan

## Changes to Implement

### 1. Create `.dockerignore` File (Root Directory)

Create `.dockerignore` at project root to exclude unnecessary files from build context (MAJOR speed improvement):

```
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
*.egg-info/
dist/
build/
.pytest_cache/
.coverage
htmlcov/
.tox/

# Virtual environments
putr_env/
venv/
env/
ENV/

# IDEs and editors
.vscode/
.idea/
*.swp
*.swo
*~

# Git
.git/
.gitignore
.gitattributes

# Documentation and non-essential files
*.md
!README.md
DOCKER_OPTIMIZATION_PROMPT.md
WARP.md

# Development folders
ignore/
trash/
frontend/ledgers/
node_modules/

# CSV ledger files (163 files not needed in image)
ledgers/*.csv

# OS files
.DS_Store
Thumbs.db
```

**Impact**: Reduces build context from ~50MB+ to <5MB, saving 10-30 seconds per build

### 2. Optimize `docker/Dockerfile` (Main Backend Container)

Key changes:

- Remove `PIP_NO_CACHE_DIR=1` (conflicts with BuildKit cache mounts)
- Add BuildKit cache mount for pip
- Copy only necessary files instead of entire project
- Better layer ordering
```dockerfile
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
```


**Impact**:

- First build: ~30 seconds faster (system deps cached)
- Rebuild with code changes only: 2-5 seconds (only code layer rebuilt)
- Rebuild with dependency changes: 20-40 seconds faster (BuildKit cache mount)

### 3. Optimize `docker/Dockerfile.firebase` (Firebase Emulator)

Key changes:

- Pin firebase-tools version (avoid re-downloading "latest")
- Add BuildKit cache mount for npm
- Better layer ordering
```dockerfile
# Firebase Emulator Dockerfile
FROM node:18

# Set environment variables
ENV FIREBASE_PROJECT=putr-dev

# Install Java (required for Firestore emulator) - rarely changes
RUN apt-get update && \
    apt-get install -y default-jre-headless && \
    rm -rf /var/lib/apt/lists/*

# Install Firebase CLI globally with BuildKit cache mount and pinned version
RUN --mount=type=cache,target=/root/.npm \
    npm install -g firebase-tools@13.0.2

# Set working directory
WORKDIR /app

# Copy Firebase configuration files
COPY firebase.json .
COPY firestore.rules .
COPY firestore.indexes.json .
COPY .firebaserc .

# Expose Firebase emulator ports
EXPOSE 4000 8080 9099

# Start Firebase emulators with minimal logging
ENV FIREBASE_EMULATOR_HUB_LOG_LEVEL=error
CMD ["firebase", "emulators:start", "--project", "putr-dev", "--only", "firestore,auth,ui"]
```


**Impact**:

- First build: 1-2 minutes faster (npm cache mount)
- Rebuild: Uses cached npm packages, 40-60 seconds faster

### 4. Update `Makefile` - Enable BuildKit and Parallel Builds

Update the `build` command (lines 29-31):

```makefile
# Build the Docker image
build:
	DOCKER_BUILDKIT=1 docker-compose -f docker/docker-compose.yml build --parallel
```

**Impact**:

- BuildKit enables cache mounts and better build performance
- `--parallel` builds all 3 services (putr, firebase, frontend) simultaneously
- Parallel builds save 1-2 minutes on cold builds

### 5. Optional: Update `docker/docker-compose.yml` Build Context

Update build contexts to be more specific (optional but recommended):

For `putr` service (lines 3-5):

```yaml
build:
  context: ..
  dockerfile: docker/Dockerfile
```

For `firebase` service (lines 71-73):

```yaml
build:
  context: ../firebase
  dockerfile: ../docker/Dockerfile.firebase
```

**Impact**: Already reasonable, but ensures build contexts are minimal

## Expected Performance Improvements

### Cold Build (No Cache)

- **Before**: ~5-10 minutes
- **After**: <3 minutes (~50-70% improvement)
- **Savings**: 2-7 minutes

### Rebuild After Code Changes

- **Before**: ~2-3 minutes (unnecessary rebuilds)
- **After**: <10 seconds (only code layer rebuilt)
- **Savings**: ~2+ minutes per iteration

### Rebuild After Dependency Changes

- **Before**: ~2-3 minutes (re-downloads everything)
- **After**: <1 minute (BuildKit cache mounts preserve downloads)
- **Savings**: 1-2 minutes

### Parallel Builds

- **Before**: Sequential builds (5-10 min total)
- **After**: Parallel builds (<3 min total)
- **Savings**: 2-4 minutes from parallelization alone

## Testing Checklist

After implementing changes, verify:

1. **Cold build test**: `docker system prune -a -f && make build`

   - Should complete in <3 minutes

2. **Code change test**: Edit `backend/poker.py` → `make build`

   - Should complete in <10 seconds

3. **Dependency change test**: Edit `requirements.txt` → `make build`

   - Should complete in <1 minute

4. **Verify services**: `make up`

   - All services should start normally

5. **Verify workflow**: `make test`, `make ag DATE=24_12_08`

   - All existing commands should work unchanged

## Files to Modify

1. **Create**: `.dockerignore` (project root)
2. **Modify**: `docker/Dockerfile` (main backend)
3. **Modify**: `docker/Dockerfile.firebase` (Firebase emulator)
4. **Modify**: `Makefile` (build command only)
5. **(Optional)**: `docker/docker-compose.yml` (build context clarification)

## Summary

These optimizations leverage modern Docker BuildKit features, proper layer caching, and build context reduction to achieve 50-70% faster builds:

- `.dockerignore` reduces build context transfer time
- BuildKit cache mounts eliminate re-downloading dependencies
- Better layer ordering maximizes cache hits
- Parallel builds utilize multiple CPU cores
- Pinned versions prevent unnecessary re-downloads

All existing commands and workflows remain unchanged - only build speed improves.