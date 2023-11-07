import pandas as pd
import json
import sys
import re
import os

def add_poker_game(game_data_path: str, dest_path: str, exclude_list=[]):
    if not game_data_path.endswith(".csv"):
        print("Error: Game data file must be a CSV File")
        sys.exit(1)
    if not dest_path.endswith(".json"):
        print("Error: Destination Path but be a JSON File")

    day = re.search(r"ledger(.*?)\.csv", game_data_path.split("/")[-1]).group(1)
    print(day)

    try:
        game_data = pd.read_csv(game_data_path)

    except FileNotFoundError as e:
        print("File not found", e)
        sys.exit(1)

    try:
        with open(dest_path, "r") as dest_file:
            json_data = json.load(dest_file)

    except FileNotFoundError as e:
        print("Error reading the data file:", e)
        sys.exit(1)

    net_winnings_by_player = (
        game_data.groupby("player_nickname")["net"].sum() / 100
    ).to_dict()

    net_winnings_by_player = {
        key: value
        for key, value in net_winnings_by_player.items()
        if key not in exclude_list
    }

    players_updated = 0
    players_updated_list = []

    for player in json_data:
        for name in player["player_nicknames"]:
            if name in net_winnings_by_player:
                # print(name, net_winnings_by_player[name])
                player["net"] += net_winnings_by_player[name]
                player["games_played"].append(day)
                player["biggest_win"] = max(player["biggest_win"], net_winnings_by_player[name])
                player["biggest_loss"] = min(player["biggest_loss"], net_winnings_by_player[name])
                player["highest_net"] = max(player["highest_net"], player["net"])
                player["lowest_net"] = min(player["lowest_net"], player["net"])
                players_updated += 1
                players_updated_list.append(name)
                

    if players_updated == len(net_winnings_by_player):
        for name, net in net_winnings_by_player.items():
            print(name, net)
        with open(dest_path, "w") as json_file:
            json.dump(json_data, json_file, indent=4)
        sort_days_list(dest_path)
    else:
        for name in net_winnings_by_player.keys():
            if name not in players_updated_list:
                print(f"{name}")
        print("Not all players known")


def add_all_games(folder_path: str, dest_path: str, exclude_list=[]):
    for file in sorted(os.listdir(folder_path)):
        if file.endswith(".csv"):
            filepath = "ledgers/" + file
            print(filepath)
            add_poker_game(filepath, dest_path, exclude_list)


def print_winnings_of_game(ledger_path: str):
    if not ledger_path.endswith(".csv"):
        print("Error: Game ledger file must be a CSV File")
        sys.exit(1)

    try:
        game_data = pd.read_csv(ledger_path)

    except FileNotFoundError as e:
        print("File not found", e)
        sys.exit(1)

    net_winnings_by_player = (
        game_data.groupby("player_nickname")["net"].sum() / 100
    ).to_dict()
    sorted_winnings = dict(
        sorted(net_winnings_by_player.items(), key=lambda item: item[1], reverse=True)
    )
    for name, net in sorted_winnings.items():
        print(f"{name}: {net}")


def unique_nicknames(file_path: str):
    unique_nicknames = set()

    for file in os.listdir(file_path):
        if file != ".DS_Store":
            file_name = file_path + "/" + file
            print(file_name)
            data = pd.read_csv(file_name)
            unique_nicknames.update(data["player_nickname"].unique())

    print(list(unique_nicknames))


def reset_net_games_played(json_path: str):
    try:
        with open(json_path, "r") as dest_file:
            json_data = json.load(dest_file)

    except FileNotFoundError as e:
        print("Error reading the data file:", e)
        sys.exit(1)

    for player in json_data:
        player["net"] = 0
        player["games_played"] = []
        player["biggest_win"] = 0
        player["biggest_loss"] = 0
        player["highest_net"] = 0
        player["lowest_net"] = 0

    with open(json_path, "w") as json_file:
        json.dump(json_data, json_file, indent=4)


def sort_days_list(json_path: str):
    try:
        with open(json_path, "r") as dest_file:
            json_data = json.load(dest_file)

    except FileNotFoundError as e:
        print("Error reading the data file:", e)
        sys.exit(1)

    for player in json_data:
        player["games_played"] = sorted(player["games_played"])

    with open(json_path, "w") as json_file:
        json.dump(json_data, json_file, indent=4)


def add_fields(json_path: str):
    try:
        with open(json_path, "r") as dest_file:
            json_data = json.load(dest_file)

    except FileNotFoundError as e:
        print("Error reading the data file:", e)
        sys.exit(1)

    for player in json_data:
        player["highest_net"] = 0
        player["lowest_net"] = 0

    with open(json_path, "w") as json_file:
        json.dump(json_data, json_file, indent=4)


if __name__ == "__main__":
    # add_poker_game("ledgers/ledger11_7.csv", "data.json", [])
    # unique_nicknames('ledgers')
    # reset_net_games_played('data.json')
    # sort_days_list('data.json')
    # add_all_games('ledgers', 'data.json', ["Ethan", "Theo", "Father Kasarov", "lukas", "tiff", "grant lumkong"])
    # print_winnings_of_game("ledgers/ledger11_6.csv")
    # add_fields("data.json")
    print("\ndone")
