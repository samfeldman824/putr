# Firebase Configuration

This folder contains all Firebase-related configuration and tools for the PUTR project.

## Files

- **`firebase.json`** - Firebase project configuration and emulator settings
- **`firestore.rules`** - Security rules for Firestore database
- **`firestore.indexes.json`** - Database indexes configuration
- **`.firebaserc`** - Firebase project aliases
- **`seed_cli.py`** - Python CLI script for seeding sample data from ledger files

**Note**: The Dockerfile for Firebase is located at `docker/Dockerfile.firebase` for better organization.

## Quick Commands

```bash
# Start Firebase emulator
make firebase

# Seed data via CLI
make seed-cli

# Clear all data
make clear-data

# Check emulator status
make firebase-status

# Stop Firebase emulator
make firebase-down
```

## Emulator Access

- **Emulator UI**: http://localhost:4000
- **Firestore**: localhost:8080
- **Auth**: localhost:9099

## Sample Data

The seed data is processed from real ledger CSV files:
- Recent players from December 2024 games (Chong, Chun, cito, etc.)
- 4 games from ledger files (24_12_08, 24_12_12, 24_12_17, 24_12_18)
- Calculated player statistics including win rates and net earnings
- Game data with actual pot sizes and player participation

## CLI Seeding (Recommended)

The Python CLI seeder processes real ledger files to create realistic test data:

```bash
# Direct usage (requires requests and pandas libraries)
python3 firebase/seed_cli.py seed    # Seed data from real ledger files
python3 firebase/seed_cli.py clear   # Clear all data
python3 firebase/seed_cli.py status  # Show database status
```

## Development Workflow

1. **Start Firebase emulator:**
   ```bash
   make firebase  # Starts at http://localhost:4000
   ```

2. **Seed initial data:**
   ```bash
   make seed-cli  # Loads data from ledger files (24_12_08, 24_12_12, 24_12_17, 24_12_18)
   ```

3. **Start frontend:**
   ```bash
   make frontend  # Serves at http://localhost:3000
   ```

4. **View and manage data:**
   - **UI**: http://localhost:4000 (browse/edit collections)
   - **API**: `http://localhost:8080` (REST endpoints)
   - **Frontend**: http://localhost:3000 (leaderboard display)

5. **Clear and reset:**
   ```bash
   make clear-data  # Remove all Firebase data
   make seed-cli    # Reload fresh data
   ```

## Frontend Connection

The frontend (`script.js`) automatically detects `localhost` and connects to the Firebase emulator:
- Project ID: `putr-dev`
- Firestore: `localhost:8080`
- Uses real-time listeners for live updates
- Falls back to production Firebase if not on localhost

## Troubleshooting

**Firebase won't start**: Check Docker logs with `docker compose logs firebase`. Ensure Java is available in the container.

**No data appears in emulator UI**: Data is loaded into Firestore backend. Visit http://localhost:4000/firestore to see collections.

**"Failed to connect" errors**: Verify all containers are running:
   ```bash
   docker compose ps
   # Should show: firebase, frontend, putr services running
   ```

**Clear cache issues**: The frontend caches data in sessionStorage. Use incognito mode or:
   ```bash
   # In browser console:
   sessionStorage.clear()
   localStorage.clear()
   location.reload()
   ```

**Seed data not loading**: Ensure ledger CSV files exist in `ledgers/` with format `ledger<YY_MM_DD>.csv`

**Reset everything**:
   ```bash
   make firebase-down
   make clear-data
   make firebase
   make seed-cli
   ```
