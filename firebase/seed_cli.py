#!/usr/bin/env python3
"""
Firebase CLI Seeder for PUTR
Usage: python firebase/seed_cli.py [command]
Commands: seed, clear, status
"""

import sys
import json
import requests
import pandas as pd
from datetime import datetime
from typing import Dict, Any, List
import argparse
import os
import re
from collections import defaultdict

# Determine Firebase Emulator endpoint based on environment
def get_firestore_url():
    # Check if we're in a Docker container by looking for /.dockerenv
    if os.path.exists('/.dockerenv'):
        # In Docker, use the firebase service name
        return "http://firebase:8080/v1/projects/putr-dev/databases/(default)/documents"
    else:
        # Local development, use localhost
        return "http://localhost:8080/v1/projects/putr-dev/databases/(default)/documents"

FIRESTORE_EMULATOR_URL = get_firestore_url()

def make_firestore_request(method: str, path: str = "", data: Dict[Any, Any] = None) -> requests.Response:
    """Make a request to the Firestore emulator REST API."""
    url = f"{FIRESTORE_EMULATOR_URL}{path}"
    
    if method.upper() == "GET":
        return requests.get(url)
    elif method.upper() == "POST":
        return requests.post(url, json=data)
    elif method.upper() == "DELETE":
        return requests.delete(url)
    else:
        raise ValueError(f"Unsupported HTTP method: {method}")

def convert_to_firestore_value(value: Any) -> Dict[str, Any]:
    """Convert Python value to Firestore value format."""
    if isinstance(value, str):
        return {"stringValue": value}
    elif isinstance(value, bool):
        return {"booleanValue": value}
    elif isinstance(value, int):
        return {"integerValue": str(value)}
    elif isinstance(value, float):
        return {"doubleValue": value}
    elif isinstance(value, datetime):
        return {"timestampValue": value.isoformat() + "Z"}
    elif isinstance(value, list):
        return {"arrayValue": {"values": [convert_to_firestore_value(item) for item in value]}}
    elif isinstance(value, dict):
        return {"mapValue": {"fields": {k: convert_to_firestore_value(v) for k, v in value.items()}}}
    else:
        return {"stringValue": str(value)}

def test_connection() -> bool:
    """Test connection to Firebase emulator."""
    print("🔄 Testing Firebase connection...")
    try:
        # Try to make a simple request
        response = requests.get(f"{FIRESTORE_EMULATOR_URL}/test", timeout=5)
        print("✅ Firebase emulator connection successful")
        return True
    except requests.exceptions.RequestException as e:
        print(f"❌ Firebase connection failed: {e}")
        print("Make sure Firebase emulator is running: make firebase")
        return False

def load_ledger_files(ledger_paths: List[str]) -> Dict[str, Any]:
    """Load and process ledger files to create game and player data."""
    games = {}
    player_stats = defaultdict(lambda: {
        "net": 0.0,
        "totalGames": 0,
        "biggestWin": 0.0,
        "biggestLoss": 0.0,
        "games_played": [],
        "player_nicknames": set()
    })
    
    for ledger_path in ledger_paths:
        try:
            # Extract date from filename
            filename = os.path.basename(ledger_path)
            match = re.search(r"ledger(.*?)\.csv", filename)
            if not match:
                continue
                
            game_date = match.group(1)
            game_id = f"game_{game_date}"
            
            # Read CSV file
            df = pd.read_csv(ledger_path)
            
            # Calculate net winnings by player
            player_nets = df.groupby('player_nickname')['net'].sum().to_dict()
            total_pot = abs(df['buy_in'].sum()) / 100.0  # Convert cents to dollars
            players_in_game = list(player_nets.keys())
            
            # Create game entry
            date_parts = game_date.split('_')
            year = f"20{date_parts[0]}"
            month = date_parts[1]
            day = date_parts[2]
            
            games[game_id] = {
                "id": game_id,
                "date": f"{year}-{month}-{day}",
                "timestamp": datetime(int(year), int(month), int(day)),
                "location": "Poker Room",
                "gameType": "Texas Hold'em",
                "totalPot": total_pot,
                "players": players_in_game,
                "notes": f"Game with {len(players_in_game)} players"
            }
            
            # Update player stats
            for nickname, net_cents in player_nets.items():
                net_dollars = net_cents / 100.0  # Convert cents to dollars
                stats = player_stats[nickname]
                
                stats["net"] += net_dollars
                stats["totalGames"] += 1
                stats["games_played"].append(game_date)
                stats["player_nicknames"].add(nickname)
                
                if net_dollars > stats["biggestWin"]:
                    stats["biggestWin"] = net_dollars
                if net_dollars < stats["biggestLoss"]:
                    stats["biggestLoss"] = net_dollars
                    
        except Exception as e:
            print(f"  ⚠️ Error processing {ledger_path}: {e}")
            continue
    
    # Convert player stats to final format
    players = {}
    for nickname, stats in player_stats.items():
        # Calculate win rate (simple approximation)
        wins = sum(1 for game_date in stats["games_played"] 
                  if any(player_nets.get(nickname, 0) > 0 for player_nets in 
                        [pd.read_csv(f"/app/ledgers/ledger{game_date}.csv").groupby('player_nickname')['net'].sum().to_dict() 
                         for game_date in stats["games_played"] 
                         if os.path.exists(f"/app/ledgers/ledger{game_date}.csv")]))
        win_rate = wins / stats["totalGames"] if stats["totalGames"] > 0 else 0.0
        
        players[nickname] = {
            "flag": "https://flagsapi.com/US/flat/32.png",  # Default flag
            "putr": max(50.0, 100.0 + stats["net"]),  # Simple PUTR calculation
            "net": round(stats["net"], 2),
            "totalGames": stats["totalGames"],
            "biggestWin": round(stats["biggestWin"], 2),
            "biggestLoss": round(stats["biggestLoss"], 2),
            "winRate": round(win_rate, 2),
            "playerId": f"seed_{abs(hash(nickname)) % 10000}",
            "lastGameDate": datetime(2024, 12, 18) if stats['games_played'] else datetime.now(),
            "player_nicknames": list(stats["player_nicknames"])
        }
    
    # Calculate overall stats
    total_games = len(games)
    total_pot = sum(game["totalPot"] for game in games.values())
    top_performer = max(players.keys(), key=lambda p: players[p]["net"]) if players else "Unknown"
    
    return {
        "players": players,
        "games": games,
        "stats": {
            "gameStats": {
                "totalGames": total_games,
                "totalPot": round(total_pot, 2),
                "averageGameDuration": 180,  # Default duration
                "mostPopularLocation": "Poker Room",
                "biggestPot": round(max((game["totalPot"] for game in games.values()), default=0), 2),
                "topPerformer": top_performer,
                "lastUpdated": datetime.now()
            }
        }
    }

def seed_data() -> None:
    """Seed Firebase with data from real ledger files."""
    print("🌱 Starting data seeding from ledger files...")
    
    if not test_connection():
        sys.exit(1)
    
    # Select 4 recent ledger files to seed from
    ledger_files = [
        "/app/ledgers/ledger24_12_08.csv",
        "/app/ledgers/ledger24_12_12.csv", 
        "/app/ledgers/ledger24_12_17.csv",
        "/app/ledgers/ledger24_12_18.csv"
    ]
    
    # Check which files exist
    existing_files = [f for f in ledger_files if os.path.exists(f)]
    if not existing_files:
        print("❌ No ledger files found! Make sure the ledger files are available.")
        sys.exit(1)
        
    print(f"📂 Processing {len(existing_files)} ledger files:")
    for f in existing_files:
        print(f"   • {os.path.basename(f)}")
    
    # Load and process ledger data
    try:
        processed_data = load_ledger_files(existing_files)
        
        # Seed players
        print("📊 Seeding players from ledger data...")
        for player_name, player_data in processed_data["players"].items():
            firestore_data = {
                "fields": {k: convert_to_firestore_value(v) for k, v in player_data.items()}
            }
            response = make_firestore_request("POST", f"/players?documentId={player_name}", firestore_data)
            if response.status_code in [200, 201]:
                print(f"  ✓ Added player: {player_name} (net: ${player_data['net']:.2f})")
            else:
                print(f"  ❌ Failed to add player {player_name}: {response.status_code}")
        
        # Seed games
        print("🎮 Seeding games from ledger data...")
        for game_id, game_data in processed_data["games"].items():
            firestore_data = {
                "fields": {k: convert_to_firestore_value(v) for k, v in game_data.items()}
            }
            response = make_firestore_request("POST", f"/games?documentId={game_id}", firestore_data)
            if response.status_code in [200, 201]:
                print(f"  ✓ Added game: {game_id} (${game_data['totalPot']:.2f} pot)")
            else:
                print(f"  ❌ Failed to add game {game_id}: {response.status_code}")
        
        # Seed stats
        print("📈 Seeding statistics...")
        for stat_id, stat_data in processed_data["stats"].items():
            firestore_data = {
                "fields": {k: convert_to_firestore_value(v) for k, v in stat_data.items()}
            }
            response = make_firestore_request("POST", f"/stats?documentId={stat_id}", firestore_data)
            if response.status_code in [200, 201]:
                print(f"  ✓ Added stats: {stat_id}")
            else:
                print(f"  ❌ Failed to add stats {stat_id}: {response.status_code}")
        
        print(f"\n🎉 Data seeding completed successfully!")
        print(f"   📊 Players seeded: {len(processed_data['players'])}")
        print(f"   🎮 Games seeded: {len(processed_data['games'])}")
        print(f"   💰 Total pot value: ${processed_data['stats']['gameStats']['totalPot']:.2f}")
        print("   View data at: http://localhost:4000")
        
    except Exception as e:
        print(f"❌ Error processing ledger data: {e}")
        sys.exit(1)

def clear_data() -> None:
    """Clear all data from Firebase."""
    print("🗑️  Starting data clearing...")
    
    if not test_connection():
        sys.exit(1)
    
    try:
        collections = ['players', 'games', 'stats', 'locations', 'test']
        total_deleted = 0
        
        for collection_name in collections:
            print(f"📂 Clearing collection: {collection_name}")
            
            # Get all documents in collection
            response = make_firestore_request("GET", f"/{collection_name}")
            if response.status_code == 200:
                data = response.json()
                documents = data.get("documents", [])
                
                if documents:
                    for doc in documents:
                        # Extract document ID from document name
                        doc_path = doc["name"]
                        doc_id = doc_path.split("/")[-1]
                        
                        # Delete document
                        delete_response = make_firestore_request("DELETE", f"/{collection_name}/{doc_id}")
                        if delete_response.status_code == 200:
                            total_deleted += 1
                    
                    print(f"  ✓ Deleted {len(documents)} documents from {collection_name}")
                else:
                    print(f"  - No documents found in {collection_name}")
            else:
                print(f"  - Collection {collection_name} not found or empty")
        
        print(f"\n🎉 Data clearing completed! Deleted {total_deleted} documents total.")
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error clearing data: {e}")
        sys.exit(1)

def show_status() -> None:
    """Show Firebase emulator status."""
    print("📊 Firebase Emulator Status")
    
    if not test_connection():
        sys.exit(1)
    
    try:
        collections = ['players', 'games', 'stats', 'locations']
        
        print("\n📈 Collection Summary:")
        for collection_name in collections:
            response = make_firestore_request("GET", f"/{collection_name}")
            if response.status_code == 200:
                data = response.json()
                documents = data.get("documents", [])
                print(f"  {collection_name}: {len(documents)} documents")
                
                if documents and len(documents) <= 10:
                    for doc in documents:
                        doc_path = doc["name"]
                        doc_id = doc_path.split("/")[-1]
                        print(f"    - {doc_id}")
                elif len(documents) > 10:
                    print(f"    - ... ({len(documents)} documents total)")
            else:
                print(f"  {collection_name}: 0 documents")
        
        print("\n🔗 Emulator URLs:")
        print("  Firebase UI: http://localhost:4000")
        print("  Firestore: http://localhost:8080")
        print("  Auth: http://localhost:9099")
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error getting status: {e}")
        sys.exit(1)

def main():
    """Main CLI function."""
    parser = argparse.ArgumentParser(
        description="🎯 Firebase CLI Seeder for PUTR",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Commands:
  seed     Seed the database with data from real ledger files
  clear    Clear all data from the database  
  status   Show database status and document counts

Examples:
  python firebase/seed_cli.py seed
  python firebase/seed_cli.py clear
  python firebase/seed_cli.py status

Prerequisites:
  - Firebase emulator must be running (make firebase)
  - Python requests and pandas libraries
        """
    )
    
    parser.add_argument('command', 
                       choices=['seed', 'clear', 'status'], 
                       help='Command to execute')
    
    args = parser.parse_args()
    
    print("🔥 PUTR Firebase CLI Seeder\n")
    
    if args.command == 'seed':
        seed_data()
    elif args.command == 'clear':
        clear_data()
    elif args.command == 'status':
        show_status()

if __name__ == "__main__":
    main()