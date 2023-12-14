import json
import re
import os

import pandas as pd

# from poker_utils import get_min_and_max_names


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
        if not isinstance(ledger_folder_path, str):
            raise TypeError("ledger_folder_path must be a string")
        if not isinstance(json_path, str):
            raise TypeError("json_path must be a string")
        if ledger_folder_path == '' or json_path == '':
            raise ValueError("""The ledger folder path and JSON path cannot
                             be empty strings.""")
        self._validate_paths(ledger_folder_path, json_path)
        self.ledger_folder_path: str = ledger_folder_path
        self.json_path: str = json_path

    @staticmethod
    def _validate_paths(ledger_folder_path: str, json_path: str) -> None:
        """
        Validates the existence of the specified ledger folder path and JSON
        path.

        Args:
            ledger_folder_path (str): The path to the ledger folder.
            json_path (str): The path to the JSON file.

        Raises:
            FileNotFoundError: If the specified JSON path or ledger folder path
            does not exist.
        """
        if not os.path.exists(json_path):
            raise FileNotFoundError(
                f"The specified JSON path does not exist: {json_path}"
            )
        if not os.path.exists(ledger_folder_path):
            raise FileNotFoundError(
                f"""The specified ledger folder
                path does not exist: {ledger_folder_path}"""
            )

    def _load_json_data(self) -> dict:
        """
        Loads JSON data from the specified file path.

        Returns:
            dict: The loaded JSON data.
        """
        with open(self.json_path, "r", encoding="utf-8") as json_file:
            return json.load(json_file)

    def _save_json_data(self, data: dict) -> None:
        """
        Save the given data as JSON to the specified file path.

        Args:
            data: The data to be saved as JSON.

        Returns:
            None
        """
        with open(self.json_path, "w", encoding="utf-8") as json_file:
            json.dump(data, json_file, indent=4)

    @staticmethod
    def _load_game_data(ledger_csv_path: str) -> tuple[pd.DataFrame, str]:
        """
        Load game data from a CSV file.

        Args:
            ledger_csv_path (str): The path to the CSV file containing the game
            data.

        Returns:
            tuple: A tuple containing the loaded game data (pandas DataFrame)
            and the extracted day (str).

        Raises:
            FileNotFoundError: If the specified ledger path does not exist.
            FileNotFoundError: If the game ledger file is not a CSV file.
            ValueError: If unable to extract the date from the
                ledger file name.
        """
        if not os.path.exists(ledger_csv_path):
            raise FileNotFoundError(
                f"The specified ledger path does not exist: {ledger_csv_path}"
            )

        if not ledger_csv_path.endswith(".csv"):
            raise FileNotFoundError("""Error: Game ledger
                                    file must be a CSV File""")

        match = re.search(r"ledger(.*?)\.csv", ledger_csv_path.split("/")[-1])
        if match is None or match.group(1) is None:
            raise ValueError(
                f"""Unable to extract date from ledger
                    file name: {ledger_csv_path}"""
            )

        game_data: pd.DataFrame = pd.read_csv(ledger_csv_path)
        day: str = match.group(1)

        return game_data, day

    @staticmethod
    def _calculate_net_winnings(
        game_data: pd.DataFrame, exclude_list: list[str] = []
            ) -> dict[str, float]:
        """
        Calculate the net winnings for each player in the game data.

        Parameters:
        game_data (pd.DataFrame): The game data containing player information
            and net winnings.
        exclude_list (list): A list of player nicknames to exclude from the
            calculation. Default is an empty list.

        Returns:
        dict: A dictionary containing the net winnings for each player,
        excluding those in the exclude_list.
        """

        filtered_game_data = game_data[~game_data["player_nickname"].isin(
            exclude_list)]
        net_winnings_by_player: dict[str, float] = (
            filtered_game_data.groupby(
                "player_nickname")["net"].sum() / 100).to_dict()

        return net_winnings_by_player

    @staticmethod
    def _search_for_nickname(json_data: dict, nickname: str) -> dict:
        for player in json_data:
            if nickname in json_data[player]["player_nicknames"]:
                return json_data[player]
        return None

    def _update_players(
        self, json_data: list[dict], net_winnings_by_player: dict[str, float],
            day: str, up_most: list[str], down_most: list[str]
            ) -> tuple[int, list]:
        """
        Updates the players' information based on the provided JSON data and
        net winnings.

        Args:
            json_data (dict): The JSON data containing the player information.
            net_winnings_by_player (dict): A dictionary mapping player names to
                their net winnings.
            day (str): The day for which the update is being performed.
            up_most (list): A list to store the players who have gained the
                most.
            down_most (list): A list to store the players who have lost the
            most.

        Returns:
            tuple: A tuple containing the number of players updated and a list
                of the updated players' names.
        """

        players_updated: int = 0
        players_updated_list: list = []

        for nickname in net_winnings_by_player:
            player = self._search_for_nickname(json_data, nickname)
            if player is not None:
                self._update_individual_stats(
                    player, nickname, net_winnings_by_player,
                    day, up_most, down_most)
                players_updated += 1
                players_updated_list.append(nickname)
        return players_updated, players_updated_list
        

    @staticmethod
    def _update_individual_stats(
        player: dict, name: str, net_winnings_by_player: dict[str, float],
            day: str, up_most: list, down_most: list) -> None:

        player_net = net_winnings_by_player[name]
        player["net"] += player_net
        player["games_played"].append(day)
        player["biggest_win"] = max(player["biggest_win"], player_net)
        player["biggest_loss"] = min(player["biggest_loss"], player_net)
        player["highest_net"] = max(player["highest_net"], player["net"])
        player["lowest_net"] = min(player["lowest_net"], player["net"])
        player["net_dictionary"][day[:5]] = player["net"]
        player["average_net"] = player["net"] / len(player["games_played"])

        if name in up_most:
            player["games_up_most"] += 1
        if name in down_most:
            player["games_down_most"] += 1
        if player_net > 0:
            player["games_up"] += 1
        if player_net < 0:
            player["games_down"] += 1

    @staticmethod
    def get_min_and_max_names(amount_dict: dict) -> tuple[list, list]:
        """
        Returns the names with the maximum and minimum amounts from the given
        amount_dict.

        Args:
            amount_dict (dict): A dictionary containing names as keys and
            amounts as values.

        Returns:
            tuple: A tuple containing two lists - the names with the maximum
            amount and the names with the minimum amount.
        """
        min_names = []
        max_names = []
        min_amount = float('inf')
        max_amount = float('-inf')

        for name, amount in amount_dict.items():
            if amount == max_amount:
                max_names.append(name)
            elif amount > max_amount:
                max_names = [name]
                max_amount = amount

            if amount == min_amount:
                min_names.append(name)
            elif amount < min_amount:
                min_names = [name]
                min_amount = amount

        return max_names, min_names

    def add_poker_game(self, ledger_csv_path: str, exclude_list=[]) -> None:
        """
        Adds a poker game to the ledger.

        Parameters:
        - ledger_csv_path (str): The file path of the ledger CSV.
        - exclude_list (list): A list of player nicknames to exclude from the
        game data.

        Returns:
        None
        """

        json_data = self._load_json_data()

        game_data, day = self._load_game_data(ledger_csv_path)

        net_winnings_by_player = self._calculate_net_winnings(game_data,
                                                              exclude_list)

        up_most, down_most = self.get_min_and_max_names(net_winnings_by_player)

        players_updated, players_updated_list = self._update_players(
            json_data, net_winnings_by_player, day, up_most, down_most)

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
            exclude_list (list, optional): A list of player nicknames to
            exclude from adding. Defaults to an empty list.

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
                net_winnings_by_player.items(),
                key=lambda item: item[1], reverse=True
            )
        )
        for name, net in sorted_winnings.items():
            print(f"{name}: {net}")

    def print_unique_nicknames(self) -> None:
        """
        Prints the unique nicknames of players found in the CSV
        files within the ledger folder.

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

        for player in json_data.keys():
            json_data[player]["net"] = 0
            json_data[player]["games_played"] = []
            json_data[player]["biggest_win"] = 0
            json_data[player]["biggest_loss"] = 0
            json_data[player]["highest_net"] = 0
            json_data[player]["lowest_net"] = 0
            json_data[player]["net_dictionary"] = {"01_01": 0}
            json_data[player]["games_up_most"] = 0
            json_data[player]["games_down_most"] = 0
            json_data[player]["games_up"] = 0
            json_data[player]["games_down"] = 0
            json_data[player]["average_net"] = 0

        self._save_json_data(json_data)

    def sort_days_list(self) -> None:
        """
        Sorts the 'games_played' list for each player in the JSON data.

        This method loads the JSON data, sorts the 'games_played'list for each
        player, and then saves the updated JSON data.

        Parameters:
            None

        Returns:
            None
        """
        json_data = self._load_json_data()

        for player in json_data.keys():
            json_data[player]["games_played"] = sorted(
                json_data[player]["games_played"])

        self._save_json_data(json_data)

    def print_all_games(self) -> None:
        """
        Prints the day of each game found in the ledger folder.

        This method iterates over the files in the ledger folder and prints the
        day of each game by extracting it from the file name. Only files with
        the ".csv" extension are considered.

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

        This method iterates over each player in the JSON data and adds a new
        field called "mock_field" with a default value of 0.

        Args:
            None

        Returns:
            None
        """
        json_data = self._load_json_data()

        for player in json_data.keys():
            # edit line below to add desired field
            json_data[player]["mock_field"] = 0

        self._save_json_data(json_data)
