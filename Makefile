.PHONY: help build up down stop-all dev shell test coverage clean logs frontend frontend-down firebase firebase-down seed-cli clear-data firebase-status sync-data

# Export BuildKit variables for all targets
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Default target
help:
	@echo "Available commands:"
	@echo "  build     - Build the Docker image"
	@echo "  up        - Start ALL services (dev + frontend + firebase)"
	@echo "  dev       - Start development container only"
	@echo "  down      - Stop and remove ALL containers (including firebase, frontend)"
	@echo "  stop-all  - Stop all containers without removing them"
	@echo "  shell     - Open an interactive shell in the container"
	@echo "  test      - Run tests in container"
	@echo "  coverage  - Run tests with coverage report"
	@echo "  clean     - Remove ALL containers, volumes, and unused images"
	@echo "  logs      - Show container logs"
	@echo "  frontend  - Start frontend server on http://localhost:3000"
	@echo "  frontend-down - Stop frontend server"
	@echo "  firebase  - Start Firebase emulator (UI: http://localhost:4000)"
	@echo "  firebase-down - Stop Firebase emulator"
	@echo "  seed-cli  - Seed Firebase data via CLI"
	@echo "  clear-data - Clear all Firebase data via CLI"
	@echo "  sync-data - Sync data.json to Firebase emulator"
	@echo "  firebase-status - Show Firebase emulator status"
	@echo "  ag        - Add game (usage: make ag DATE=24_12_08)"
	@echo "  pg        - Print game (usage: make pg DATE=24_12_08)"
	@echo "  pgs       - Print all games"
	

# Build the Docker image
build:
	docker compose -f docker/docker-compose.yml build --parallel

# Start ALL services for complete development environment
up:
	@echo "Starting complete development environment..."
	docker compose -f docker/docker-compose.yml --profile firebase --profile frontend up -d
	@echo ""
	@echo "🎉 PUTR development environment started!"
	@echo "📱 Services available:"
	@echo "   • Main app (backend): http://localhost:3000/backend/"
	@echo "   • Frontend: http://localhost:3000"
	@echo "   • Firebase UI: http://localhost:4000"
	@echo "   • Firestore API: http://localhost:8080"
	@echo "   • Firebase Auth: http://localhost:9099"
	@echo ""
	@echo "🔧 Quick commands:"
	@echo "   • Seed data: make seed-cli"
	@echo "   • Run tests: make test"
	@echo "   • View logs: make logs"
	@echo "   • Shell access: make shell"

# Stop and remove containers
down:
	@echo "Stopping and removing all services..."
	docker compose -f docker/docker-compose.yml --profile firebase --profile frontend down

# Stop all containers without removing them
stop-all:
	@echo "Stopping all containers..."
	docker compose -f docker/docker-compose.yml --profile firebase --profile frontend stop

# Start development container only
dev:
	@echo "Starting development container only..."
	docker compose -f docker/docker-compose.yml up -d putr
	@echo "Development container started. Use 'make up' for full environment."

# Open an interactive shell in the running container
shell:
	docker compose -f docker/docker-compose.yml exec putr /bin/bash

# Run tests
test:
	docker compose -f docker/docker-compose.yml run --rm test

# Run tests with coverage
coverage:
	docker compose -f docker/docker-compose.yml run --rm coverage

# Clean up containers and images
clean:
	@echo "Cleaning up all containers, volumes, and images..."
	docker compose -f docker/docker-compose.yml --profile firebase --profile frontend --profile test down -v
	docker system prune -f

# Show logs
logs:
	docker compose -f docker/docker-compose.yml logs -f putr

# PUTR CLI commands
ag:
	@if [ -z "$(DATE)" ]; then echo "Usage: make ag DATE=24_12_08"; exit 1; fi
	docker compose -f docker/docker-compose.yml exec putr bash -c "cd /app && python backend/main.py ag $(DATE)"

pg:
	@if [ -z "$(DATE)" ]; then echo "Usage: make pg DATE=24_12_08"; exit 1; fi
	docker compose -f docker/docker-compose.yml exec putr bash -c "cd /app && python backend/main.py pg $(DATE)"

pgs:
	docker compose -f docker/docker-compose.yml exec putr bash -c "cd /app && python backend/main.py pgs"

plg:
	@if [ -z "$(NICKNAME)" ]; then echo "Usage: make plg NICKNAME=\"Player Name\""; exit 1; fi
	docker compose -f docker/docker-compose.yml exec putr bash -c "cd /app && python backend/main.py plg $(NICKNAME)"

# Frontend commands
frontend:
	docker compose -f docker/docker-compose.yml --profile frontend up -d frontend
	@echo "Frontend server started at http://localhost:3000"

frontend-down:
	docker compose -f docker/docker-compose.yml --profile frontend down

# Firebase commands
firebase:
	docker compose -f docker/docker-compose.yml --profile firebase up -d firebase
	@echo "Firebase emulator started:"
	@echo "  UI: http://localhost:4000"
	@echo "  Firestore: http://localhost:8080"
	@echo "  Auth: http://localhost:9099"

firebase-down:
	docker compose -f docker/docker-compose.yml --profile firebase down

# Seed data commands
seed-cli:
	@echo "Seeding Firebase data via CLI (in container)..."
	@docker compose -f docker/docker-compose.yml exec putr bash -c "cd /app && python firebase/seed_cli.py seed"

clear-data:
	@echo "Clearing Firebase data via CLI (in container)..."
	@docker compose -f docker/docker-compose.yml exec putr bash -c "cd /app && python firebase/seed_cli.py clear"

firebase-status:
	@echo "Checking Firebase emulator status (in container)..."
	@docker compose -f docker/docker-compose.yml exec putr bash -c "cd /app && python firebase/seed_cli.py status"

# Sync data.json to Firebase
sync-data:
	@echo "Syncing data.json to Firebase emulator..."
	@docker compose -f docker/docker-compose.yml exec putr bash -c "cd /app && python firebase/sync_data.py sync"
