#!/usr/bin/env python3
"""
This script fetches data from your ComputerCraft API endpoint and updates
the JSON files in your GitHub repository.
"""

import os
import json
import time
import requests
from pathlib import Path

# Configuration
API_ENDPOINT = "https://your-api-endpoint.com/data"
API_KEY = os.environ.get("API_KEY")
DATA_DIR = Path("data")

# Create data directory if it doesn't exist
DATA_DIR.mkdir(exist_ok=True)

def fetch_server_data():
    """Fetch server data from the API"""
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(API_ENDPOINT, headers=headers)
        response.raise_for_status()  # Raise exception for HTTP errors
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        return None

def update_data_files(data):
    """Update JSON data files"""
    # Save current data with timestamp
    timestamp = int(time.time())
    data["last_updated"] = timestamp
    
    # Save to latest.json (current state)
    with open(DATA_DIR / "latest.json", "w") as f:
        json.dump(data, f, indent=2)
    
    # Save to history file
    history_file = DATA_DIR / "history.json"
    
    if history_file.exists():
        with open(history_file, "r") as f:
            try:
                history = json.load(f)
            except json.JSONDecodeError:
                history = {"updates": []}
    else:
        history = {"updates": []}
    
    # Add current data to history, keeping only last 24 hours (144 entries at 10 min intervals)
    history["updates"].append({
        "timestamp": timestamp,
        "player_count": data.get("playerCount", 0),
        "players": data.get("players", [])
    })
    
    # Keep history to a reasonable size
    if len(history["updates"]) > 144:
        history["updates"] = history["updates"][-144:]
    
    # Save updated history
    with open(history_file, "w") as f:
        json.dump(history, f, indent=2)
    
    print(f"Data files updated successfully. Player count: {data.get('playerCount', 0)}")

if __name__ == "__main__":
    print("Fetching server data...")
    server_data = fetch_server_data()
    
    if server_data:
        update_data_files(server_data)
    else:
        print("No data received, files not updated.")
