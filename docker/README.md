# Docker Development Environment for PUTR

This directory contains Docker configuration files for developing PUTR in a containerized environment.

## Quick Start

1. **Build and start the complete development environment:**
   ```bash
   make build
   make up  # Starts: backend + frontend + firebase
   ```

2. **Access the services:**
   - Frontend (Leaderboard): http://localhost:3000
   - Firebase Emulator UI: http://localhost:4000
   - Firestore API: http://localhost:8080
   - Firebase Auth: http://localhost:9099

3. **Seed initial data:**
   ```bash
   make seed-cli  # Load sample data from ledger files
   ```

4. **Open a shell in the container:**
   ```bash
   make shell
   ```

5. **Run PUTR CLI commands:**
   ```bash
   make pgs                           # Print all games
   make pg DATE=24_12_08             # Print specific game
   make ag DATE=24_12_08             # Add game from ledger
   make plg NICKNAME="Player Name"   # Print player's last games
   ```

## Available Commands

### Main Services
- `make up` - Start all services (backend, frontend, firebase)
- `make down` - Stop and remove all containers
- `make build` - Build Docker images
- `make clean` - Remove all containers, volumes, and images

### Individual Services
- `make dev` - Start backend container only
- `make frontend` - Start frontend server (http://localhost:3000)
- `make firebase` - Start Firebase emulator (http://localhost:4000)
- `make firebase-down` - Stop Firebase emulator
- `make frontend-down` - Stop frontend server

### Container Management
- `make shell` - Open interactive bash shell in running backend container
- `make logs` - Show backend container logs
- `make stop-all` - Stop all containers without removing them

### Testing
- `make test` - Run pytest in container
- `make coverage` - Run tests with coverage report

### Firebase Data
- `make seed-cli` - Seed Firebase with sample data from ledger files
- `make clear-data` - Clear all Firebase data
- `make firebase-status` - Check Firebase emulator status

### PUTR CLI Commands
- `make pgs` - Print all available games
- `make pg DATE=YY_MM_DD` - Print game results for specific date
- `make ag DATE=YY_MM_DD` - Add game from CSV ledger
- `make plg NICKNAME="Player Name"` - Print last games for player

## Development Workflow

1. **Initial setup:**
   ```bash
   make build
   make up              # Starts all services
   make seed-cli        # Load sample data
   ```

2. **View the application:**
   - Open http://localhost:3000 in your browser
   - View Firebase data at http://localhost:4000

3. **Run backend commands:**
   ```bash
   make pgs             # View all games
   make ag DATE=24_12_08  # Add a game
   ```

4. **Work interactively:**
   ```bash
   make shell
   # Now you're inside container at /app/backend
   python main.py --help
   ```

5. **Run tests:**
   ```bash
   make test
   make coverage
   ```

6. **Clean up when done:**
   ```bash
   make down
   make clean  # To remove all volumes and images
   ```

## File Structure

- `Dockerfile` - Main PUTR application container
- `Dockerfile.firebase` - Firebase emulator container
- `docker-compose.yml` - Multi-service orchestration
- `.dockerignore` - Files to exclude from builds
- `README.md` - Docker-specific documentation

**Note**: Firebase has its own dedicated `Dockerfile.firebase` in `docker/` for better separation of concerns.
## Features

- **Volume Mounting**: Code changes reflected immediately in containers
- **Multi-service Architecture**: Separate containers for backend, frontend, and Firebase
- **Python Cache**: Pip cache preserved between rebuilds for faster installation
- **Working Directory**: Backend container starts in `/app/backend` for CLI access
- **Interactive Shell**: Full bash access for development and debugging
- **Firebase Integration**: Built-in Firebase emulator with Firestore and Auth
- **Data Persistence**: Game data and ledgers automatically persisted via volumes
- **Frontend Server**: Python HTTP server for static assets at port 3000

## Troubleshooting

**Frontend shows 500 error**: Hard refresh your browser (Cmd+Shift+R on Mac) to clear cached error pages. Incognito mode works immediately.

**Firebase connection fails**: Check that the Firebase container is running with `docker-compose ps`. Restart with `make firebase`.

**No player data shows**: Run `make seed-cli` to load sample data from ledger files into Firebase.

**Container won't start**: Run `make logs` to see error messages.

**Permission issues**: Files created in containers run as root and may have ownership issues.

**Port conflicts**: Check for conflicts on ports 3000 (frontend), 4000 (Firebase UI), 8080 (Firestore), 9099 (Auth).

**Data persistence**: Game data (`data.json`), ledgers, and Firebase data are persisted through Docker volumes.

**Clear everything and start fresh**:
   ```bash
   make clean     # Removes containers, volumes, and images
   make build
   make up
   make seed-cli
   ```
