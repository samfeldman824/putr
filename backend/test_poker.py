import pytest
import shutil
import os
import json
from tempfile import TemporaryDirectory

from poker import Poker


@pytest.fixture
def tem_dir_fixture1():
    with TemporaryDirectory() as tempdir:

        # move mock_jsons to tempdir
        original_json_path = "backend/testing/mock_jsons"
        new_json_path = os.path.join(tempdir, os.path.basename(
            original_json_path))
        shutil.copytree(original_json_path, new_json_path)

        # move mock_ledgers to tempdir
        original_ledger_path = "backend/testing/mock_ledgers"
        new_ledger_path = os.path.join(tempdir, os.path.basename(
            original_ledger_path))
        shutil.copytree(original_ledger_path, new_ledger_path)

        # remove ledger01_02.csv
        os.remove(os.path.join(new_ledger_path, "ledger01_02.csv"))

        # Create the Poker instance
        json_path = os.path.join(new_json_path, "mock1_data.json")
        poker = Poker(new_ledger_path, json_path)

        # Yield both the poker instance and the paths
        yield poker, new_ledger_path, json_path


@pytest.fixture
def tem_dir_fixture2():
    with TemporaryDirectory() as tempdir:

        # move mock_jsons to tempdir
        original_json_path = "backend/testing/mock_jsons"
        new_json_path = os.path.join(tempdir, os.path.basename(
            original_json_path))
        shutil.copytree(original_json_path, new_json_path)

        # move mock_ledgers to tempdir
        original_ledger_path = "backend/testing/mock_ledgers"
        new_ledger_path = os.path.join(tempdir, os.path.basename(
            original_ledger_path))
        shutil.copytree(original_ledger_path, new_ledger_path)

        # Create the Poker instance
        json_path = os.path.join(new_json_path, "mock2_data.json")
        poker = Poker(new_ledger_path, json_path)

        # Yield both the poker instance and the paths
        yield poker, new_ledger_path, json_path

@pytest.fixture
def tem_dir_fixture3():
    with TemporaryDirectory() as tempdir:

        # move mock_jsons to tempdir
        original_json_path = "backend/testing/mock_jsons"
        new_json_path = os.path.join(tempdir, os.path.basename(
            original_json_path))
        shutil.copytree(original_json_path, new_json_path)

        # move mock_ledgers to tempdir
        original_ledger_path = "backend/testing/mock_ledgers"
        new_ledger_path = os.path.join(tempdir, os.path.basename(
            original_ledger_path))
        shutil.copytree(original_ledger_path, new_ledger_path)

        # Create the Poker instance
        json_path = os.path.join(new_json_path, "mock3_data.json")
        poker = Poker(new_ledger_path, json_path)

        # Yield both the poker instance and the paths
        yield poker, new_ledger_path, json_path


# Initializes a Poker object with valid ledger_folder_path and json_path.
def test_valid_paths(tem_dir_fixture1):
    poker, ledger_folder_path, json_path = tem_dir_fixture1

    assert isinstance(poker, Poker)
    assert poker.ledger_folder_path == ledger_folder_path
    assert poker.json_path == json_path
    
    
def test_add_poker_game1(tem_dir_fixture1, capfd):
    poker, ledger_path, json_path = tem_dir_fixture1

    poker.add_poker_game(ledger_path + "/ledger01_01.csv")

    with open(json_path) as json_file:
        json_data = json.load(json_file)
        assert json_data["Alice"]["net"] == 5.5
        assert json_data["Alice"]["biggest_win"] == 5.5
        assert json_data["Alice"]["biggest_loss"] == 0
        assert json_data["Alice"]["highest_net"] == 5.5
        assert json_data["Alice"]["lowest_net"] == 0
        assert json_data["Alice"]["games_up"] == 1
        assert json_data["Alice"]["games_down"] == 0
        assert json_data["Alice"]["games_up_most"] == 1
        assert json_data["Alice"]["games_down_most"] == 0
        assert json_data["Alice"]["net_dictionary"] == {"01_01": 5.5}
        assert json_data["Alice"]["average_net"] == 5.5

        assert json_data["Bob"]["net"] == -4.25
        assert json_data["Bob"]["biggest_win"] == 0
        assert json_data["Bob"]["biggest_loss"] == -4.25
        assert json_data["Bob"]["highest_net"] == 0
        assert json_data["Bob"]["lowest_net"] == -4.25
        assert json_data["Bob"]["games_up"] == 0
        assert json_data["Bob"]["games_down"] == 1
        assert json_data["Bob"]["games_up_most"] == 0
        assert json_data["Bob"]["games_down_most"] == 1
        assert json_data["Bob"]["net_dictionary"] == {"01_01": -4.25}
        assert json_data["Bob"]["average_net"] == -4.25

        assert json_data["Charlie"]["net"] == -1.25
        assert json_data["Charlie"]["biggest_win"] == 0
        assert json_data["Charlie"]["biggest_loss"] == -1.25
        assert json_data["Charlie"]["highest_net"] == 0
        assert json_data["Charlie"]["lowest_net"] == -1.25
        assert json_data["Charlie"]["games_up"] == 0
        assert json_data["Charlie"]["games_down"] == 1
        assert json_data["Charlie"]["games_up_most"] == 0
        assert json_data["Charlie"]["games_down_most"] == 0
        assert json_data["Charlie"]["net_dictionary"] == {"01_01": -1.25}
        assert json_data["Charlie"]["average_net"] == -1.25
        # assert json_data[0]["net"] == 5.5
        # assert json_data[0]["biggest_win"] == 5.5
        # assert json_data[0]["biggest_loss"] == 0
        # assert json_data[0]["highest_net"] == 5.5
        # assert json_data[0]["lowest_net"] == 0
        # assert json_data[0]["games_up"] == 1
        # assert json_data[0]["games_down"] == 0
        # assert json_data[0]["games_up_most"] == 1
        # assert json_data[0]["games_down_most"] == 0
        # assert json_data[0]["net_dictionary"] == {"01_01": 5.5}
        # assert json_data[0]["average_net"] == 5.5

        # assert json_data[1]["net"] == -4.25
        # assert json_data[1]["biggest_win"] == 0
        # assert json_data[1]["biggest_loss"] == -4.25
        # assert json_data[1]["highest_net"] == 0
        # assert json_data[1]["lowest_net"] == -4.25
        # assert json_data[1]["games_up"] == 0
        # assert json_data[1]["games_down"] == 1
        # assert json_data[1]["games_up_most"] == 0
        # assert json_data[1]["games_down_most"] == 1
        # assert json_data[1]["net_dictionary"] == {"01_01": -4.25}
        # assert json_data[1]["average_net"] == -4.25

        # assert json_data[2]["net"] == -1.25
        # assert json_data[2]["biggest_win"] == 0
        # assert json_data[2]["biggest_loss"] == -1.25
        # assert json_data[2]["highest_net"] == 0
        # assert json_data[2]["lowest_net"] == -1.25
        # assert json_data[2]["games_up"] == 0
        # assert json_data[2]["games_down"] == 1
        # assert json_data[2]["games_up_most"] == 0
        # assert json_data[2]["games_down_most"] == 0
        # assert json_data[2]["net_dictionary"] == {"01_01": -1.25}
        # assert json_data[2]["average_net"] == -1.25

    out, _ = capfd.readouterr()
    assert out == (
        "Alice 5.5\nBob -4.25\nCharlie -1.25\nPoker game on 01_01 added\n"
        )


def test_add_poker_game2(tem_dir_fixture2, capfd):
    poker, ledger_path, json_path = tem_dir_fixture2

    poker.add_poker_game(ledger_path + "/ledger01_01.csv")

    with open(json_path) as json_file:
        json_data = json.load(json_file)
        assert json_data["Alice"]["net"] == 5.5
        assert json_data["Alice"]["biggest_win"] == 20
        assert json_data["Alice"]["biggest_loss"] == -10
        assert json_data["Alice"]["highest_net"] == 10
        assert json_data["Alice"]["lowest_net"] == -10
        assert json_data["Alice"]["games_up"] == 2
        assert json_data["Alice"]["games_down"] == 1
        assert json_data["Alice"]["games_up_most"] == 2
        assert json_data["Alice"]["games_down_most"] == 1
        assert json_data["Alice"]["net_dictionary"] == {"01_01": 5.5}
        assert json_data["Alice"]["average_net"] == 5.5

        assert json_data["Bob"]["net"] == -4.25
        assert json_data["Bob"]["biggest_win"] == 20
        assert json_data["Bob"]["biggest_loss"] == -10
        assert json_data["Bob"]["highest_net"] == 10
        assert json_data["Bob"]["lowest_net"] == -10
        assert json_data["Bob"]["games_up"] == 1
        assert json_data["Bob"]["games_down"] == 2
        assert json_data["Bob"]["games_up_most"] == 1
        assert json_data["Bob"]["games_down_most"] == 2
        assert json_data["Bob"]["net_dictionary"] == {"01_01": -4.25}
        assert json_data["Bob"]["average_net"] == -4.25

        assert json_data["Charlie"]["net"] == -1.25
        assert json_data["Charlie"]["biggest_win"] == 20
        assert json_data["Charlie"]["biggest_loss"] == -10
        assert json_data["Charlie"]["highest_net"] == 10
        assert json_data["Charlie"]["lowest_net"] == -10
        assert json_data["Charlie"]["games_up"] == 1
        assert json_data["Charlie"]["games_down"] == 2
        assert json_data["Charlie"]["games_up_most"] == 1
        assert json_data["Charlie"]["games_down_most"] == 1
        assert json_data["Charlie"]["net_dictionary"] == {"01_01": -1.25}
        assert json_data["Charlie"]["average_net"] == -1.25

    out, _ = capfd.readouterr()
    assert (
      out == "Alice 5.5\nBob -4.25\nCharlie -1.25\nPoker game on 01_01 added\n"
    )


def test_add_all_games(tem_dir_fixture1, capfd):
    poker, _, _ = tem_dir_fixture1

    poker.add_all_games(["Joe"])

    out, _ = capfd.readouterr()
    assert (
      out == "Alice 5.5\nBob -4.25\nCharlie -1.25\nPoker game on 01_01 added\n"
        )


def test_print_game_results(tem_dir_fixture1, capfd):

    poker, ledger_path, _ = tem_dir_fixture1

    poker.print_game_results(ledger_path + "/ledger01_01.csv")

    out, _ = capfd.readouterr()
    assert out == "Alice: 5.5\nCharlie: -1.25\nBob: -4.25\n"


def test_unique_nicknames(tem_dir_fixture1, capfd):

    poker, _, _ = tem_dir_fixture1

    poker.print_unique_nicknames()

    out, _ = capfd.readouterr()
    assert "Alice" in out
    assert "Bob" in out
    assert "Charlie" in out


def test_print_all_games(tem_dir_fixture1, capfd):

    poker, _, _ = tem_dir_fixture1

    poker.print_all_games()

    out, _ = capfd.readouterr()
    assert "01_01" in out


def test_reset_net_fields(tem_dir_fixture1, capfd):

    poker, _, json_path = tem_dir_fixture1

    poker.reset_net_fields()

    with open(json_path) as json_file:
        json_data = json.load(json_file)
        for player_data in json_data.keys():
            assert json_data[player_data]["net"] == 0
            assert json_data[player_data]["biggest_win"] == 0
            assert json_data[player_data]["biggest_loss"] == 0
            assert json_data[player_data]["highest_net"] == 0
            assert json_data[player_data]["lowest_net"] == 0
            assert json_data[player_data]["games_up"] == 0
            assert json_data[player_data]["games_down"] == 0
            assert json_data[player_data]["games_up_most"] == 0
            assert json_data[player_data]["games_down_most"] == 0
            assert json_data[player_data]["net_dictionary"] == {"01_01": 0}
            assert json_data[player_data]["average_net"] == 0


def test_add_field(tem_dir_fixture1, capfd):

    poker, _, json_path = tem_dir_fixture1

    poker.add_field()

    with open(json_path) as json_file:
        json_data = json.load(json_file)
        for player_data in json_data.keys():
            assert json_data[player_data]["mock_field"] == 0


def test_add_game_print_unknown_names(tem_dir_fixture2, capfd):

    poker, ledger_path, _ = tem_dir_fixture2

    poker.add_poker_game(ledger_path + "/ledger01_02.csv")

    out, _ = capfd.readouterr()
    assert out == "Joe\nNot all players known\n"


def test_sort_days_list(tem_dir_fixture1):
    poker, _, json_path = tem_dir_fixture1

    poker.sort_days_list()

    with open(json_path) as json_file:
        json_data = json.load(json_file)
        for player_data in json_data.keys():
            assert json_data[player_data]["games_played"] == sorted(
                json_data[player_data]["games_played"])


def test_get_min_and_max_names():
    # Test case 1: Empty dictionary
    amount_dict = {}
    assert Poker.get_min_and_max_names(amount_dict) == ([], [])

    # Test case 2: Dictionary with one name and amount
    amount_dict = {'John': 100}
    assert Poker.get_min_and_max_names(amount_dict) == (['John'], ['John'])

    # Test case 3: Dictionary with multiple names and amounts
    amount_dict = {'John': 100, 'Alice': 200, 'Bob': 150, 'Eve': 200}
    assert Poker.get_min_and_max_names(amount_dict) == (
        ['Alice', 'Eve'], ['John'])

    # Test case 4: Dictionary with negative amounts
    amount_dict = {'John': -100, 'Alice': -200, 'Bob': -150, 'Eve': -200}
    assert Poker.get_min_and_max_names(amount_dict) == (
        ['John'], ['Alice', 'Eve'])

    # Test case 5: Dictionary with equal amounts
    amount_dict = {'John': 100, 'Alice': 100, 'Bob': 100, 'Eve': 100}
    assert Poker.get_min_and_max_names(amount_dict) == (
        ['John', 'Alice', 'Bob', 'Eve'], ['John', 'Alice', 'Bob', 'Eve'])


def test_search_for_nickname():
    # Test case 1: Nickname exists in the player's nicknames
    json_data = {
        "player1": {
            "player_nicknames": ["John", "Johnny"]
        },
        "player2": {
            "player_nicknames": ["Alice", "Ali"]
        }
    }
    nickname = "Johnny"
    assert Poker._search_for_nickname(json_data, nickname) == (
        json_data["player1"])

    # Test case 2: Nickname does not exist in any player's nicknames
    json_data = {
        "player1": {
            "player_nicknames": ["John", "Johnny"]
        },
        "player2": {
            "player_nicknames": ["Alice", "Ali"]
        }
    }
    nickname = "Bob"
    assert Poker._search_for_nickname(json_data, nickname) is None

    # Test case 3: Nickname exists in multiple player's nicknames
    json_data = {
        "player1": {
            "player_nicknames": ["John", "Johnny"]
        },
        "player2": {
            "player_nicknames": ["Alice", "Ali"]
        },
        "player3": {
            "player_nicknames": ["Johnny", "Jon"]
        }
    }
    nickname = "Johnny"
    assert Poker._search_for_nickname(json_data, nickname) == (
        json_data["player1"])

def test_print_last_games(tem_dir_fixture3, capfd):

    poker, _, _ = tem_dir_fixture3
    poker.print_last_games("Charlie", 2)
    #
    out, _ = capfd.readouterr()
    assert out == ('Last 2 games for Charlie:\n\n23_10_20 -10.00'
                   ' (-12.00)\n23_10_19 2.00 (-8.00)\n\n'
                   'Net: -20.00\nAverage: -10.00\n')

def test_combine_and_print_results(tem_dir_fixture3, capfd):
    poker, ledger_path, _ = tem_dir_fixture3

    poker.print_combined_results([ledger_path + "/ledger01_01.csv",
                                  ledger_path + "/ledger01_02.csv"])

    out, _ = capfd.readouterr()

    assert "Combined results for 2 ledgers:" in out
    assert "Alice: 11.00  (01_01, 01_02)" in out
    assert "Bob: -8.50  (01_01, 01_02)" in out
    assert "Charlie: -2.50  (01_01, 01_02)" in out
    assert "Joe: 5.50  (01_02)" in out


# testing exceptions


def test_json_file_not_found():
    with pytest.raises(FileNotFoundError):
        Poker("testing/mock_ledgers", "fake_path.json")


def test_ledger_folder_not_found():
    with pytest.raises(FileNotFoundError):
        Poker("fake_path", "testing/mock_jsons/mock1_data.json")


def test_ledger_file_not_csv(tem_dir_fixture1):
    poker, _, _ = tem_dir_fixture1
    with pytest.raises(FileNotFoundError):
        poker.add_poker_game("testing/mock_ledgers/ledger01_01.txt")


def test_ledger_file_not_csv_print(tem_dir_fixture1):
    poker, _, _ = tem_dir_fixture1
    with pytest.raises(FileNotFoundError):
        poker.print_game_results("testing/mock_ledgers/ledger01_01.txt")


def test_ledger_file_not_exist_print(tem_dir_fixture1):
    poker, _, _ = tem_dir_fixture1
    with pytest.raises(FileNotFoundError):
        poker.print_game_results("fake_ledger01_03.csv")



# def test_ledger_file_not_found(tem_dir_fixture1):
#     poker, _, _ = tem_dir_fixture1
#     with pytest.raises(ValueError):
#         poker._load_game_data("fake_ledger.csv")
