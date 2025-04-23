import json
import os
import re
from typing import Dict, List, Tuple, Optional, Set
from collections import defaultdict


import pandas as pd


class Poker:
    """
    A class to manage poker game data, including loading, updating, and printing game results.
    """

    def __init__(self, ledger_folder_path: str, json_path: str) -> None:
        """
        Initialize a Poker object.

        Args:
            ledger_folder_path: The path to the ledger folder.
            json_path: The path to the JSON file.

        Raises:
            TypeError: If ledger_folder_path or json_path is not a string.
            ValueError: If ledger_folder_path or json_path is an empty string.
            FileNotFoundError: If the specified JSON path or ledger folder path does not exist.
        """
        if not isinstance(ledger_folder_path, str):
            raise TypeError("ledger_folder_path must be a string")
        if not isinstance(json_path, str):
            raise TypeError("json_path must be a string")
        if not ledger_folder_path:
            raise ValueError(
                "The ledger folder path cannot be an empty string."
            )
        if not json_path:
            raise ValueError("The JSON path cannot be an empty string.")

        self._validate_paths(ledger_folder_path, json_path)
        self.ledger_folder_path: str = ledger_folder_path
        self.json_path: str = json_path

    @staticmethod
    def _validate_paths(ledger_folder_path: str, json_path: str) -> None:
        """
        Validates the existence of the specified ledger folder and JSON paths.

        Args:
            ledger_folder_path: The path to the ledger folder.
            json_path: The path to the JSON file.

        Raises:
            FileNotFoundError: If the specified JSON or ledger folder path does not exist.
        """
        if not os.path.exists(json_path):
            raise FileNotFoundError(
                f"The specified JSON path does not exist: {json_path}"
            )
        if not os.path.exists(ledger_folder_path):
            raise FileNotFoundError(
                f"The specified ledger folder path does not exist: {ledger_folder_path}"
            )

    def _load_json_data(self) -> Dict:
        """
        Loads JSON data from the specified file path.

        Returns:
            The loaded JSON data.
        """
        with open(self.json_path, "r", encoding="utf-8") as json_file:
            return json.load(json_file)

    def _save_json_data(self, data: Dict) -> None:
        """
        Save the given data as JSON to the specified file path.

        Args:
            data: The data to be saved as JSON.
        """
        with open(self.json_path, "w", encoding="utf-8") as json_file:
            json.dump(data, json_file, indent=4)

    @staticmethod
    def _load_game_data(ledger_csv_path: str) -> Tuple[pd.DataFrame, str]:
        """
        Load game data from a CSV file.

        Args:
            ledger_csv_path: The path to the CSV file.

        Returns:
            A tuple containing the loaded game data (pandas DataFrame) and the extracted day.

        Raises:
            FileNotFoundError: If ledger_csv_path does not exist or is not a CSV file.
            ValueError: If unable to extract the date from the ledger file name.
        """
        if not os.path.exists(ledger_csv_path):
            raise FileNotFoundError(
                f"The specified ledger path does not exist: {ledger_csv_path}"
            )

        if not ledger_csv_path.endswith(".csv"):
            raise ValueError("Error: Game ledger file must be a CSV File")

        match = re.search(r"ledger(.*?)\.csv", ledger_csv_path.split("/")[-1])
        if match is None:
            raise ValueError(
                f"Unable to extract date from ledger file name: {ledger_csv_path}"
            )

        game_data: pd.DataFrame = pd.read_csv(ledger_csv_path)
        day: str = match.group(1)

        return game_data, day

    @staticmethod
    def _calculate_net_winnings(
        game_data: pd.DataFrame, exclude_list: Optional[List[str]] = None
    ) -> Dict[str, float]:
        """
        Calculate the net winnings for each player in the game data.

        Args:
            game_data: The game data containing player information and net winnings.
            exclude_list: A list of player nicknames to exclude. Defaults to None.

        Returns:
            A dictionary containing the net winnings for each player (excluding those in exclude_list).
        """
        if exclude_list is None:
            exclude_list = []

        game_data = game_data[~game_data["player_nickname"].isin(exclude_list)]
        return (
            game_data.groupby("player_nickname")["net"].sum().div(100).to_dict()
        )

    @staticmethod
    def _search_for_nickname(json_data: Dict, nickname: str) -> Optional[Dict]:
        """
        Searches for a player by nickname within the JSON data.

        Args:
            json_data: The JSON data to search within.
            nickname: The nickname to search for.

        Returns:
            The player's data if found, otherwise None.
        """
        for player_id, player_data in json_data.items():
            if nickname in player_data["player_nicknames"]:
                return player_data
        return None
    
    @staticmethod
    def _search_for_nickname_clean(json_data: Dict, nickname: str) -> Optional[Dict]:
        """
        Searches for a player by nickname within the JSON data.

        Args:
            json_data: The JSON data to search within.
            nickname: The nickname to search for.

        Returns:
            The player's name if found, otherwise None.
        """
        for player_id, player_data in json_data.items():
            if nickname in player_data["player_nicknames"]:
                return player_id
        return None

    def _update_players(
        self,
        json_data: Dict,
        net_winnings_by_player: Dict[str, float],
        day: str,
        up_most: List[str],
        down_most: List[str],
    ) -> Tuple[int, List[str]]:
        """
        Updates player information based on net winnings and game day.

        Args:
            json_data: The JSON data containing player information.
            net_winnings_by_player: A dictionary of player nicknames and their net winnings.
            day: The day of the game.
            up_most: A list of players with the highest net winnings.
            down_most: A list of players with the lowest net winnings.

        Returns:
            A tuple containing the number of players updated and a list of updated player nicknames.
        """

        players_updated: int = 0
        players_updated_list: List[str] = []

        for nickname, winnings in net_winnings_by_player.items():
            player = self._search_for_nickname(json_data, nickname)
            if player is not None:
                self._update_individual_stats(
                    player, nickname, winnings, day, up_most, down_most
                )
                players_updated += 1
                players_updated_list.append(nickname)
        return players_updated, players_updated_list

    @staticmethod
    def _update_individual_stats(
        player: Dict,
        nickname: str,
        player_net: float,
        day: str,
        up_most: List[str],
        down_most: List[str],
    ) -> None:
        """
        Updates the statistics for an individual player.

        Args:
            player: The player's data dictionary.
            nickname: The player's nickname.
            player_net: The player's net winnings for the game.
            day: The day of the game.
            up_most: List of players who won the most.
            down_most: List of players who lost the most.
        """

        player["net"] = round(player["net"] + player_net, 2)
        player["games_played"].append(day)
        player["biggest_win"] = max(player["biggest_win"], player_net)
        player["biggest_loss"] = min(player["biggest_loss"], player_net)
        player["highest_net"] = max(player["highest_net"], player["net"])
        player["lowest_net"] = min(player["lowest_net"], player["net"])
        player["net_dictionary"][day[:8]] = player["net"]
        player["average_net"] = (
            round(player["net"] / len(player["games_played"]), 2) if player["games_played"] else 0
        )

        if nickname in up_most:
            player["games_up_most"] += 1
        if nickname in down_most:
            player["games_down_most"] += 1
        if player_net > 0:
            player["games_up"] += 1
        if player_net < 0:
            player["games_down"] += 1

    @staticmethod
    def get_min_and_max_names(amount_dict: Dict[str, float]) -> Tuple[List[str], List[str]]:
        """
        Returns the names with the maximum and minimum amounts from the given amount_dict.

        Args:
            amount_dict: A dictionary containing names as keys and amounts as values.

        Returns:
            A tuple containing two lists: (names with the maximum amount, names with the minimum amount).
        """
        if not amount_dict:
            return [], []
        max_amount = max(amount_dict.values())
        min_amount = min(amount_dict.values())
        max_names = [
            name for name, amount in amount_dict.items() if amount == max_amount
        ]
        min_names = [
            name for name, amount in amount_dict.items() if amount == min_amount
        ]
        return max_names, min_names

    def add_poker_game(self, ledger_csv_path: str, exclude_list: Optional[List[str]] = None) -> None:
        """
        Adds a poker game to the ledger.

        Args:
            ledger_csv_path: The file path of the ledger CSV.
            exclude_list: A list of player nicknames to exclude. Defaults to None.

        Returns:
            None
        """

        json_data = self._load_json_data()

        game_data, day = self._load_game_data(ledger_csv_path)

        net_winnings_by_player = self._calculate_net_winnings(game_data, exclude_list)

        up_most, down_most = self.get_min_and_max_names(net_winnings_by_player)

        players_updated, players_updated_list = self._update_players(
            json_data, net_winnings_by_player, day, up_most, down_most
        )

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

    def add_all_games(self, exclude_list: Optional[List[str]] = None) -> None:
        """
        Add all poker games from the ledger folder to the ledger.

        Args:
            exclude_list: A list of player nicknames to exclude. Defaults to None.

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

        Args:
            ledger_path: The path to the ledger file.

        Returns:
            None
        """
        game_data, _ = self._load_game_data(ledger_path)
        net_winnings_by_player = (
            game_data.groupby("player_nickname")["net"].sum().div(100).to_dict()
        )
        sorted_winnings = dict(
            sorted(
                net_winnings_by_player.items(), key=lambda item: item[1], reverse=True
            )
        )
        for name, net in sorted_winnings.items():
            print(f"{name}: {net}")

    # def print_combined_results(self, ledger_paths: List[str]) -> None:
    #     """
    #     Print the combined results from multiple ledger files by player net.
    #     Args:
    #         ledger_paths: List of ledger CSV file paths.
    #     """

    #     json_data = self._load_json_data() 

    #     all_ledgers = []
    #     days_combined = []
    #     for path in ledger_paths:
    #         game_data, day = self._load_game_data(path)
    #         days_combined.append(day)
    #         net_winnings_by_player = self._calculate_net_winnings(game_data)
    #         # iterate over a snapshot of (nickname, winnings)
    #         for nickname, _ in list(net_winnings_by_player.items()):
    #             player_id = self._search_for_nickname_clean(json_data, nickname)
    #             if player_id:
    #                 # pop the old key and re-insert under the new key
    #                 net_winnings_by_player[player_id] = net_winnings_by_player.pop(nickname)

    #         all_ledgers.append(net_winnings_by_player)
    #     combined = {}
    #     for ledger in all_ledgers:
    #         for player, net in ledger.items():
    #             combined[player] = combined.get(player, 0) + net
    #     sorted_winnings = dict(sorted(combined.items(), key=lambda item: item[1], reverse=True))
    #     print(f"Combined results for {len(ledger_paths)} ledgers:\n")
    #     print("Games included:")
    #     for i in days_combined:
    #         print(i)
    #     print()
    #     for name, net in sorted_winnings.items():
    #             print(f"{name}: {net:.2f}")

    
    def print_combined_results(self, ledger_paths: List[str]) -> None:
        json_data = self._load_json_data()

        all_ledgers = []
        player_days: Dict[str, List[str]] = defaultdict(list)

        # 1) load each ledger, remap nicknames → IDs, and record the day per player
        for path in ledger_paths:
            game_data, day = self._load_game_data(path)
            net_winnings = self._calculate_net_winnings(game_data)

            # remap nicknames to player IDs
            for nickname in list(net_winnings):
                player_id = self._search_for_nickname_clean(json_data, nickname)
                if player_id:
                    net_winnings[player_id] = net_winnings.pop(nickname)

            # record that each player played on this `day`
            for player in net_winnings:
                player_days[player].append(day)

            all_ledgers.append(net_winnings)

        # 2) combine all ledgers
        combined: Dict[str, float] = {}
        for ledger in all_ledgers:
            for player, net in ledger.items():
                combined[player] = combined.get(player, 0) + net

        # 3) sort and print, pulling in the days list for each player
        sorted_winnings = dict(
            sorted(combined.items(), key=lambda kv: kv[1], reverse=True)
        )

        print(f"Combined results for {len(ledger_paths)} ledgers:\n")
        print("Games included:")
        for d in sorted({d for days in player_days.values() for d in days}):
            print(d)
        print()

        for name, net in sorted_winnings.items():
            dates = ", ".join(player_days.get(name, []))
            print(f"{name}: {net:.2f}  ({dates})")

        def print_unique_nicknames(self) -> None:
            """
            Prints the unique nicknames of players found in the CSV files within the ledger folder.

            Returns:
                None
            """
            unique_nicknames: Set[str] = set()

            for file in os.listdir(self.ledger_folder_path):
                if file != ".DS_Store":
                    file_name = f"{self.ledger_folder_path}/{file}"
                    data = pd.read_csv(file_name)
                    unique_nicknames.update(data["player_nickname"].unique())

            print(list(unique_nicknames))

    def reset_net_fields(self) -> None:
        """
        Resets the net-related fields for each player in the JSON data.

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

        Returns:
            None
        """
        json_data = self._load_json_data()

        for player in json_data.values():
            player["games_played"].sort()

        self._save_json_data(json_data)

    def print_all_games(self) -> None:
        """
        Prints the day of each game found in the ledger folder.

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

        Returns:
            None
        """
        json_data = self._load_json_data()

        for player in json_data.keys():
            # edit line below to add desired field
            json_data[player]["mock_field"] = 0

        self._save_json_data(json_data)

    def print_last_games(self, player_name: str, days: int = 5) -> None:
        """
        Prints the last few games for a given player.

        Args:
            player_name: The name of the player.
            days: The number of recent games to print. Defaults to 5.

        Returns:
            None
        """
        json_data = self._load_json_data()
        player_data = json_data[player_name]
        player_net_dict = player_data["net_dictionary"]
        reversed_keys = list(reversed(list(player_net_dict.keys())))
        days = min(days, len(reversed_keys) - 1)
        print(f"Last {days} games for {player_name}:\n")
        for i, day in enumerate(reversed_keys):
            if i in (days, len(reversed_keys) - 1):
                break
            current_day_total = player_net_dict[day]
            prev_day_total = player_net_dict[reversed_keys[i + 1]]
            print(
                day,
                f"{current_day_total:.2f}",
                f"({current_day_total - prev_day_total:.2f})",
            )
        print()
        net_total = (
            player_net_dict[reversed_keys[0]] - player_net_dict[reversed_keys[days]]
        )
        print(f"Net: {net_total:.2f}")
        print(f"Average: {net_total / days:.2f}")
