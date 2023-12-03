import pandas as pd
import json
import re
import os
from poker_utils import get_min_and_max_names


class Poker:
    def __init__(self, ledger_folder_path: str, json_path: str) -> None:
        """
        Initialize a Poker object.

        Args:
            ledger_folder_path (str): The path to the ledger folder.
            json_path (str): The path to the JSON file.

        Returns:
            None
        """
        self._validate_paths(ledger_folder_path, json_path)
        self.ledger_folder_path: str = ledger_folder_path
        self.json_path: str = json_path

    def _validate_paths(self, ledger_folder_path: str, json_path: str) -> None:
        """
        Validates the existence of the specified ledger folder path and JSON path.

        Args:
            ledger_folder_path (str): The path to the ledger folder.
            json_path (str): The path to the JSON file.

        Raises:
            FileNotFoundError: If the specified JSON path or ledger folder path does not exist.
        """
        if not os.path.exists(json_path):
            raise FileNotFoundError(
                f"The specified JSON path does not exist: {json_path}"
            )
        if not os.path.exists(ledger_folder_path):
            raise FileNotFoundError(
                f"The specified ledger folder path does not exist: {ledger_folder_path}"
            )

    def _load_json_data(self):
        """
        Loads JSON data from the specified file path.

        Returns:
            dict: The loaded JSON data.
        """
        with open(self.json_path, "r", encoding="utf-8") as json_file:
            return json.load(json_file)

    def _save_json_data(self, data):
        """
        Save the given data as JSON to the specified file path.

        Args:
            data: The data to be saved as JSON.

        Returns:
            None
        """
        with open(self.json_path, "w", encoding="utf-8") as json_file:
            json.dump(data, json_file, indent=4)

    def _load_game_data(self, ledger_csv_path: str):
        """
        Load game data from a CSV file.

        Args:
            ledger_csv_path (str): The path to the CSV file containing the game data.

        Returns:
            tuple: A tuple containing the loaded game data (pandas DataFrame) and the extracted day (str).

        Raises:
            FileNotFoundError: If the specified ledger path does not exist.
            FileNotFoundError: If the game ledger file is not a CSV file.
            ValueError: If unable to extract the date from the ledger file name.
        """
        if not os.path.exists(ledger_csv_path):
            raise FileNotFoundError(
                f"The specified ledger path does not exist: {ledger_csv_path}"
            )

        if not ledger_csv_path.endswith(".csv"):
            raise FileNotFoundError("Error: Game ledger file must be a CSV File")

        match = re.search(r"ledger(.*?)\.csv", ledger_csv_path.split("/")[-1])
        if match is None or match.group(1) is None:
            raise ValueError(
                f"Unable to extract date from ledger file name: {ledger_csv_path}"
            )

        game_data = pd.read_csv(ledger_csv_path)
        day = match.group(1)

        return game_data, day

    def add_poker_game(self, ledger_csv_path: str, exclude_list=[]) -> None:
        """
        Adds a poker game to the ledger.

        Parameters:
        - ledger_csv_path (str): The file path of the ledger CSV.
        - exclude_list (list): A list of player nicknames to exclude from the game data.

        Returns:
        None
        """

        json_data = self._load_json_data()

        game_data, day = self._load_game_data(ledger_csv_path)

        net_winnings_by_player = (
            game_data.groupby("player_nickname")["net"].sum() / 100
        ).to_dict()

        net_winnings_by_player = {
            key: value
            for key, value in net_winnings_by_player.items()
            if key not in exclude_list
        }

        up_most, down_most = get_min_and_max_names(net_winnings_by_player)

        players_updated = 0
        players_updated_list = []

        for player in json_data:
            for name in player["player_nicknames"]:
                if name in net_winnings_by_player:
                    # print(name, net_winnings_by_player[name])
                    player["net"] += net_winnings_by_player[name]
                    player["games_played"].append(day)
                    player["biggest_win"] = max(
                        player["biggest_win"], net_winnings_by_player[name]
                    )
                    player["biggest_loss"] = min(
                        player["biggest_loss"], net_winnings_by_player[name]
                    )
                    player["highest_net"] = max(player["highest_net"], player["net"])
                    player["lowest_net"] = min(player["lowest_net"], player["net"])
                    player["net_dictionary"][day[:5]] = player["net"]
                    if name in up_most:
                        player["games_up_most"] += 1
                    if name in down_most:
                        player["games_down_most"] += 1
                    if net_winnings_by_player[name] > 0:
                        player["games_up"] += 1
                    if net_winnings_by_player[name] < 0:
                        player["games_down"] += 1

                    players_updated += 1
                    players_updated_list.append(name)

        if players_updated == len(net_winnings_by_player):
            for name, net in net_winnings_by_player.items():
                print(name, net)
            self._save_json_data(json_data)
            print(f"Poker game on {day} added")
        else:
            for name in net_winnings_by_player.keys():
                if name not in players_updated_list:
                    print(f"{name}")
            print("Not all players known")

    def add_all_games(self, exclude_list=[]) -> None:
        """
        Add all poker games from the ledger folder to the ledger.

        Args:
            exclude_list (list, optional): A list of player nicknames to exclude from adding. Defaults to an empty list.

        Returns:
            None
        """
        for file in sorted(os.listdir(self.ledger_folder_path)):
            if file.endswith(".csv"):
                filepath: str = f"{self.ledger_folder_path}/{file}"
                self.add_poker_game(filepath, exclude_list)

    def print_game_results(self, ledger_path: str) -> None:
        """
        Prints the game results by player, showing their net winnings.

        Parameters:
        ledger_path (str): The path to the ledger file.

        Returns:
        None
        """

        game_data, _ = self._load_game_data(ledger_path)

        net_winnings_by_player = (
            game_data.groupby("player_nickname")["net"].sum() / 100
        ).to_dict()
        sorted_winnings = dict(
            sorted(
                net_winnings_by_player.items(), key=lambda item: item[1], reverse=True
            )
        )
        for name, net in sorted_winnings.items():
            print(f"{name}: {net}")

    def print_unique_nicknames(self) -> None:
        """
        Prints the unique nicknames of players found in the CSV files within the ledger folder.

        Returns:
            None
        """
        unique_nicknames = set()

        for file in os.listdir(self.ledger_folder_path):
            if file != ".DS_Store":
                file_name = f"{self.ledger_folder_path}/{file}"
                data = pd.read_csv(file_name)
                unique_nicknames.update(data["player_nickname"].unique())

        print(list(unique_nicknames))

    def reset_net_fields(self) -> None:
        """
        Resets the net-related fields for each player in the JSON data.

        This method sets the following fields to their initial values:
        - net: 0
        - games_played: []
        - biggest_win: 0
        - biggest_loss: 0
        - highest_net: 0
        - lowest_net: 0
        - net_dictionary: {"01_01": 0}
        - games_up_most: 0
        - games_down_most: 0
        - games_up: 0
        - games_down: 0

        Returns:
        None
        """
        json_data = self._load_json_data()

        for player in json_data:
            player["net"] = 0
            player["games_played"] = []
            player["biggest_win"] = 0
            player["biggest_loss"] = 0
            player["highest_net"] = 0
            player["lowest_net"] = 0
            player["net_dictionary"] = {"01_01": 0}
            player["games_up_most"] = 0
            player["games_down_most"] = 0
            player["games_up"] = 0
            player["games_down"] = 0

        self._save_json_data(json_data)

    def sort_days_list(self) -> None:
        """
        Sorts the 'games_played' list for each player in the JSON data.

        This method loads the JSON data, sorts the 'games_played' list for each player,
        and then saves the updated JSON data.

        Parameters:
            None

        Returns:
            None
        """
        json_data = self._load_json_data()

        for player in json_data:
            player["games_played"] = sorted(player["games_played"])

        self._save_json_data(json_data)

    def print_all_games(self) -> None:
        """
        Prints the day of each game found in the ledger folder.

        This method iterates over the files in the ledger folder and prints the day of each game
        by extracting it from the file name. Only files with the ".csv" extension are considered.

        Args:
            self (object): The instance of the class.

        Returns:
            None
        """
        for file in sorted(os.listdir(self.ledger_folder_path)):
            if file.endswith(".csv"):
                day = re.search(r"ledger(.*?)\.csv", file).group(1)
                print(day)

    def add_field(self) -> None:
        """
        Adds a new field to each player in the JSON data.

        This method iterates over each player in the JSON data and adds a new field called "mock_field" with a default value of 0.

        Args:
            None

        Returns:
            None
        """
        json_data = self._load_json_data()

        for player in json_data:
            # edit line below to add desired field
            player["mock_field"] = 0

        self._save_json_data(json_data)
