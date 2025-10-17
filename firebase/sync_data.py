#!/usr/bin/env python3
"""
Simple script to sync data.json to Firebase emulator
Usage: python firebase/sync_data.py [sync|clear]
"""

import json
import requests
import argparse
import os
import sys
from datetime import datetime
from typing import Dict, Any

# Constants (add at the top of your file)
REQUEST_TIMEOUT = 10  # seconds

def get_firestore_url():
    """Determine Firebase Emulator endpoint"""
    if os.path.exists('/.dockerenv'):
        return "http://firebase:8080/v1/projects/putr-dev/databases/(default)/documents"
    else:
        return "http://localhost:8080/v1/projects/putr-dev/databases/(default)/documents"

FIRESTORE_URL = get_firestore_url()

def to_firestore_value(value: Any) -> Dict[str, Any]:
    """Convert Python value to Firestore format"""
    if value is None:
        return {"nullValue": None}
    elif isinstance(value, bool):
        return {"booleanValue": value}
    elif isinstance(value, int):
        return {"integerValue": str(value)}
    elif isinstance(value, float):
        return {"doubleValue": value}
    elif isinstance(value, str):
        return {"stringValue": value}
    elif isinstance(value, list):
        return {"arrayValue": {"values": [to_firestore_value(v) for v in value]}}
    elif isinstance(value, dict):
        return {"mapValue": {"fields": {k: to_firestore_value(v) for k, v in value.items()}}}
    else:
        return {"stringValue": str(value)}

def test_connection() -> bool:
    """Test Firebase emulator connection"""
    try:
        requests.get(f"{FIRESTORE_URL}/test", timeout=5)
        return True
    except requests.exceptions.RequestException:
        print("❌ Firebase emulator not reachable")
        print("   Run: make firebase")
        return False

def clear_data():
    """Clear all Firebase collections"""
    print("🗑️  Clearing Firebase data...")
    
    if not test_connection():
        return False
    
    collections = ['players', 'games', 'stats']
    total_deleted = 0
    
    for collection in collections:
        try:
            response = requests.get(f"{FIRESTORE_URL}/{collection}")
            if response.status_code == 200:
                docs = response.json().get("documents", [])
                for doc in docs:
                    doc_id = doc["name"].split("/")[-1]
                    requests.delete(f"{FIRESTORE_URL}/{collection}/{doc_id}")
                    total_deleted += 1
                if docs:
                    print(f"   ✓ Cleared {len(docs)} documents from {collection}")
        except Exception as e:
            print(f"   ⚠️ Error clearing {collection}: {e}")
    
    print(f"\n✅ Cleared {total_deleted} documents total")
    return True

def sync_data():
    """Sync data.json to Firebase emulator"""
    print("🔄 Syncing data.json to Firebase...")
    
    if not test_connection():
        return False
    
    # Read data.json
    data_path = "data.json"
    if not os.path.exists(data_path):
        print(f"❌ {data_path} not found")
        return False
    
    with open(data_path, 'r') as f:
        data = json.load(f)
    
    print(f"📂 Found {len(data)} players in data.json")
    
    # Clear existing data first
    clear_data()
    print()
    
    # Sync players
    print("👥 Syncing players...")
    players_synced = 0
    
    for player_name, player_data in data.items():
        # Convert player data to Firestore format (keep field names identical)
        firestore_doc = {
            "fields": {}
        }
        
        # Copy all fields with exact same names
        for key, value in player_data.items():
            firestore_doc["fields"][key] = to_firestore_value(value)
        
        # Use player name as document ID (keep original with spaces)
        doc_id = player_name
        
        try:
            response = requests.post(
                f"{FIRESTORE_URL}/players?documentId={doc_id}",
                json=firestore_doc,
                timeout=REQUEST_TIMEOUT
            )
            if response.status_code in [200, 201]:
                players_synced += 1
                print(f"   ✓ {player_name}: ${player_data.get('net', 0):.2f} net")
            else:
                print(f"   ❌ Failed to sync {player_name}: {response.status_code}")
        except requests.exceptions.Timeout:
            print(f"   ❌ Timeout syncing {player_name} (>{REQUEST_TIMEOUT}s)")
        except requests.exceptions.ConnectionError:
            print(f"   ❌ Connection error syncing {player_name}")
        except Exception as e:
            print(f"   ❌ Error syncing {player_name}: {e}")
    
    # Create aggregate stats
    print("\n📊 Creating aggregate stats...")
    total_games = max((len(p.get("games_played", [])) for p in data.values()), default=0) if data else 0
    total_net = sum(p.get("net", 0) for p in data.values())
    
    stats_doc = {
        "fields": {
            "totalPlayers": to_firestore_value(len(data)),
            "totalGames": to_firestore_value(total_games),
            "totalNet": to_firestore_value(round(total_net, 2)),
            "lastSync": to_firestore_value(datetime.now().isoformat()),
            "source": to_firestore_value("data.json")
        }
    }
    
    try:
        response = requests.post(
            f"{FIRESTORE_URL}/stats?documentId=aggregate",
            json=stats_doc,
            timeout=REQUEST_TIMEOUT
        )
        if response.status_code in [200, 201]:
            print("   ✓ Aggregate stats created")
    except Exception as e:
        print(f"   ⚠️ Could not create stats: {e}")
    
    # Print summary
    print("\n" + "="*50)
    print("✅ SYNC COMPLETE!")
    print("="*50)
    print(f"📊 Players synced: {players_synced}/{len(data)}")
    print(f"🎮 Total games: {total_games}")
    print(f"💰 Total net: ${total_net:.2f}")
    print("\n🔗 View data:")
    print("   Firebase UI: http://localhost:4000")
    print("   Firestore: http://localhost:8080")
    
    return True

def main():
    """CLI entry point"""
    parser = argparse.ArgumentParser(
        description="🔥 Sync data.json to Firebase emulator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python firebase/sync_data.py sync     # Sync data.json to Firebase
  python firebase/sync_data.py clear    # Clear all Firebase data
  
Make sure Firebase emulator is running first:
  make firebase
        """
    )
    
    parser.add_argument(
        'command',
        choices=['sync', 'clear'],
        help='Command to execute'
    )
    
    args = parser.parse_args()
    
    success = False
    if args.command == 'sync':
        success = sync_data()
    elif args.command == 'clear':
        success = clear_data()
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
