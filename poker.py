import pandas as pd
import json
import sys
import re
import os
# Extract the JSON file path from command line arguments
# base = '/Users/samfeldman/Code/putr/ledgers/ledger'
# day = sys.argv[1]
# file_path = base + day + '.csv'


# Read the data from the specified JSON file
# data = pd.read_csv(file_path)
# print(file)

# Create an object to store net winnings for each player
# net_winnings_by_player = {}

# Group by 'player_nickname' and sum the 'net' column for each player
# net_winnings_by_player = (data.groupby('player_nickname')['net'].sum() / 100).to_dict()
# print(net_winnings_by_player)

# data_json_file_path = 'data.json'

# try:
#     with open(data_json_file_path, 'r') as file:
#         data = json.load(file)
#         # print(data)
# except FileNotFoundError as e:
#     print('Error reading the data file:', e)
#     sys.exit(1)

# for player in data:
#     for name in player['player_nicknames']:
#         if name in net_winnings_by_player:
#             print(name, net_winnings_by_player[name])
#             player['net'] += net_winnings_by_player[name]
#             player['games_played'].append(day)

# for player in data:
#     player['net'] = 0
#     player['games_played'] = []



# with open(data_json_file_path, 'w') as json_file:
#     json.dump(data, json_file, indent=4)


def add_poker_game(game_data_path: str, dest_path: str):
    if not game_data_path.endswith(".csv"):
        print("Error: Game data file must be a CSV File")
        sys.exit(1)
    if not dest_path.endswith(".json"):
        print("Error: Destination Path but be a JSON File")

    day = re.search(r'ledger(.*?)\.csv', game_data_path.split('/')[-1]).group(1)
    print(day)

    try:
        game_data = pd.read_csv(game_data_path)
        
    except FileNotFoundError as e:
        print('File not found', e)
        sys.exit(1)



    try:
        with open(dest_path, 'r') as dest_file:
            json_data = json.load(dest_file)
            
    except FileNotFoundError as e:
        print('Error reading the data file:', e)
        sys.exit(1)

    net_winnings_by_player = (game_data.groupby('player_nickname')['net'].sum() / 100).to_dict()
    
    for player in json_data:
        for name in player['player_nicknames']:
            if name in net_winnings_by_player:
                print(name, net_winnings_by_player[name])
                player['net'] += net_winnings_by_player[name]
                player['games_played'].append(day)

    with open(dest_path, 'w') as json_file:
        json.dump(json_data, json_file, indent=4)

def add_all_games(folder_path: str, dest_path: str):
    for file in os.listdir(folder_path):
        if file.endswith('.csv'):
            filepath = 'ledgers/' + file
            add_poker_game(filepath, dest_path)

def unique_nicknames(file_path: str):
    unique_nicknames = set()
    
    for file in os.listdir(file_path):
        if file != ".DS_Store":
            file_name = file_path + '/' + file
            print(file_name)
            data = pd.read_csv(file_name)
            unique_nicknames.update(data['player_nickname'].unique())
    
    print(list(unique_nicknames))

def reset_net_games_played(json_path: str):
    try:
        with open(json_path, 'r') as dest_file:
            json_data = json.load(dest_file)
            
    except FileNotFoundError as e:
        print('Error reading the data file:', e)
        sys.exit(1)
    
    for player in json_data:
        player['net'] = 0
        player['games_played'] = []

    with open(json_path, 'w') as json_file:
        json.dump(json_data, json_file, indent=4)
    
def sort_days_list(json_path: str):
    try:
        with open(json_path, 'r') as dest_file:
            json_data = json.load(dest_file)
            
    except FileNotFoundError as e:
        print('Error reading the data file:', e)
        sys.exit(1)

    for player in json_data:
        player['games_played'] = sorted(player['games_played'])

    with open(json_path, 'w') as json_file:
        json.dump(json_data, json_file, indent=4)

if __name__ == "__main__":
    
    # add_poker_game('ledgers/ledger10_30.csv', 'data.json')
    # unique_nicknames('ledgers')
    # reset_net_games_played('data.json')
    sort_days_list('data.json')
    # add_all_games('ledgers', 'data.json')
    print('done')