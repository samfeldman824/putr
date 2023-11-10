import pandas as pd
import json
import sys
import re
import os

def main():
    # add_poker_game("ledgers/ledger11_09.csv", "data.json", [])
    # unique_nicknames('ledgers')
    # reset_net_games_played('data.json')
    # sort_days_list('data.json')
    # add_all_games('ledgers', 'data.json', ["Ethan", "Theo", "Father Kasarov", "lukas", "tiff", "grant lumkong"])
    # print_winnings_of_game("ledgers/ledger11_07(1).csv")
    # add_fields("data.json")
    poker = Poker("ledgers", "data.json")
    poker.reset_net_fields()
    print("\ndone")

class Poker:
    def __init__(self, ledger_folder_path: str, json_path: str) -> None:
        if not os.path.exists(json_path):
            raise FileNotFoundError(f"The specified JSON path does not exist: {json_path}")
        self.json_path = json_path
        self.ledger_folder_path = ledger_folder_path

    def add_poker_game(self, ledger_csv_path: str, exclude_list=[]):
        if not ledger_csv_path.endswith(".csv"):
            print("Error: Game data file must be a CSV File")
            sys.exit(1)
        day = re.search(r"ledger(.*?)\.csv", ledger_csv_path.split("/")[-1]).group(1)
        try:
            game_data = pd.read_csv(ledger_csv_path)
        except FileNotFoundError as e:
            print("File not found", e)
            sys.exit(1)
        
        with open(self.json_path, "r") as dest_file:
            json_data = json.load(dest_file)

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
                    player["net_dictionary"][day[:5]] = player["net"]
                    players_updated += 1
                    players_updated_list.append(name)
                

        if players_updated == len(net_winnings_by_player):
            for name, net in net_winnings_by_player.items():
                print(name, net)
            with open(self.json_path, "w") as json_file:
                json.dump(json_data, json_file, indent=4)
            sort_days_list(self.json_path)
        else:
            for name in net_winnings_by_player.keys():
                if name not in players_updated_list:
                    print(f"{name}")
            print("Not all players known")

    def add_all_games(self, exclude_list=[]):
        for file in sorted(os.listdir(self.ledger_folder_pathfolder_path)):
            if file.endswith(".csv"):
                filepath = f"{self.ledger_folder_path}/{file}"
                add_poker_game(filepath, exclude_list)

    def print_game_results(self, ledger_path: str):
        if not ledger_path.endswith(".csv"):
            print("Error: Game ledger file must be a CSV File")
            sys.exit(1)        
        try:
            game_data = pd.read_csv(ledger_path)

        except FileNotFoundError as e:
            print("File not found", e)
            sys.exit(1)
        
        net_winnings_by_player = (game_data.groupby("player_nickname")["net"].sum() / 100).to_dict()
        sorted_winnings = dict(
        sorted(net_winnings_by_player.items(), key=lambda item: item[1], reverse=True)
        )
        for name, net in sorted_winnings.items():
            print(f"{name}: {net}")

    def print_unique_nicknames(self):
        unique_nicknames = set()

        for file in os.listdir(self.ledger_folder_path):
            if file != ".DS_Store":
                file_name = f"{self.ledger_folder_path}/{file}"
                data = pd.read_csv(file_name)
                unique_nicknames.update(data["player_nickname"].unique())

        print(list(unique_nicknames))

    def reset_net_fields(self):
        with open(self.json_path, "r") as dest_file:
            json_data = json.load(dest_file)
        
        for player in json_data:
            player["net"] = 0
            player["games_played"] = []
            player["biggest_win"] = 0
            player["biggest_loss"] = 0
            player["highest_net"] = 0
            player["lowest_net"] = 0
            player["net_dictionary"] = {}

        with open(self.json_path, "w") as json_file:
            json.dump(json_data, json_file, indent=4)

    def sort_days_list(self):
        with open(self.json_path, "r") as dest_file:
            json_data = json.load(dest_file)    

        for player in json_data:
            player["games_played"] = sorted(player["games_played"]) 

        with open(self.json_path, "w") as json_file:
            json.dump(json_data, json_file, indent=4)



if __name__ == "__main__":
    main()
    
