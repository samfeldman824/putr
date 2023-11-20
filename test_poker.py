import pytest
import shutil
import os
import json
from poker import Poker
from tempfile import TemporaryDirectory

@pytest.fixture
def tem_dir_fixture1():
    with TemporaryDirectory() as tempdir:

        # move mock_jsons to tempdir
        original_json_path = "testing/mock_jsons"
        new_json_path = os.path.join(tempdir, os.path.basename(original_json_path))
        shutil.copytree(original_json_path, new_json_path)

        # move mock_ledgers to tempdir
        original_ledger_path = "testing/mock_ledgers"
        new_ledger_path = os.path.join(tempdir, os.path.basename(original_ledger_path))
        shutil.copytree(original_ledger_path, new_ledger_path)

       # Create the Poker instance
        json_path = os.path.join(new_json_path, "mock1_data.json")
        poker = Poker(new_ledger_path, json_path)

        # Yield both the poker instance and the paths
        yield poker, new_ledger_path, json_path

@pytest.fixture
def tem_dir_fixture2():
    with TemporaryDirectory() as tempdir:

        # move mock_jsons to tempdir
        original_json_path = "testing/mock_jsons"
        new_json_path = os.path.join(tempdir, os.path.basename(original_json_path))
        shutil.copytree(original_json_path, new_json_path)

        # move mock_ledgers to tempdir
        original_ledger_path = "testing/mock_ledgers"
        new_ledger_path = os.path.join(tempdir, os.path.basename(original_ledger_path))
        shutil.copytree(original_ledger_path, new_ledger_path)

        # Create the Poker instance
        json_path = os.path.join(new_json_path, "mock2_data.json")
        poker = Poker(new_ledger_path, json_path)

        # Yield both the poker instance and the paths
        yield poker, new_ledger_path, json_path


def test_add_poker_game1(tem_dir_fixture1, capfd):
    poker, ledger_path, json_path = tem_dir_fixture1

    poker.add_poker_game(ledger_path + "/ledger01_01.csv")

    with open(json_path) as json_file:
        json_data = json.load(json_file)
        assert json_data[0]["net"] == 5.5
        assert json_data[0]["biggest_win"] == 5.5
        assert json_data[0]["biggest_loss"] == 0
        assert json_data[0]["highest_net"] == 5.5
        assert json_data[0]["lowest_net"] == 0
        assert json_data[0]["games_up"] == 1
        assert json_data[0]["games_down"] == 0
        assert json_data[0]["games_up_most"] == 1
        assert json_data[0]["games_down_most"] == 0
        assert json_data[0]["net_dictionary"] == {"01_01": 5.5}

        assert json_data[1]["net"] == -4.25
        assert json_data[1]["biggest_win"] == 0
        assert json_data[1]["biggest_loss"] == -4.25
        assert json_data[1]["highest_net"] == 0
        assert json_data[1]["lowest_net"] == -4.25
        assert json_data[1]["games_up"] == 0
        assert json_data[1]["games_down"] == 1
        assert json_data[1]["games_up_most"] == 0
        assert json_data[1]["games_down_most"] == 1 
        assert json_data[1]["net_dictionary"] == {"01_01": -4.25}

        assert json_data[2]["net"] == -1.25
        assert json_data[2]["biggest_win"] == 0
        assert json_data[2]["biggest_loss"] == -1.25
        assert json_data[2]["highest_net"] == 0
        assert json_data[2]["lowest_net"] == -1.25
        assert json_data[2]["games_up"] == 0
        assert json_data[2]["games_down"] == 1
        assert json_data[2]["games_up_most"] == 0
        assert json_data[2]["games_down_most"] == 0
        assert json_data[2]["net_dictionary"] == {"01_01": -1.25}

    out, _ = capfd.readouterr()
    assert out == "Alice 5.5\nBob -4.25\nCharlie -1.25\nPoker game on 01_01 added\n"


def test_add_poker_game2(tem_dir_fixture2, capfd):
    poker, ledger_path, json_path = tem_dir_fixture2

    poker.add_poker_game(ledger_path + "/ledger01_01.csv")

    with open(json_path) as json_file:
        json_data = json.load(json_file)
        assert json_data[0]["net"] == 5.5
        assert json_data[0]["biggest_win"] == 20
        assert json_data[0]["biggest_loss"] == -10
        assert json_data[0]["highest_net"] == 10
        assert json_data[0]["lowest_net"] == -10
        assert json_data[0]["games_up"] == 2
        assert json_data[0]["games_down"] == 1
        assert json_data[0]["games_up_most"] == 2
        assert json_data[0]["games_down_most"] == 1
        assert json_data[0]["net_dictionary"] == {"01_01": 5.5}

        assert json_data[1]["net"] == -4.25 
        assert json_data[1]["biggest_win"] == 20
        assert json_data[1]["biggest_loss"] == -10
        assert json_data[1]["highest_net"] == 10
        assert json_data[1]["lowest_net"] == -10
        assert json_data[1]["games_up"] == 1
        assert json_data[1]["games_down"] == 2
        assert json_data[1]["games_up_most"] == 1
        assert json_data[1]["games_down_most"] == 2
        assert json_data[1]["net_dictionary"] == {"01_01": -4.25}

        assert json_data[2]["net"] == -1.25
        assert json_data[2]["biggest_win"] == 20
        assert json_data[2]["biggest_loss"] == -10
        assert json_data[2]["highest_net"] == 10
        assert json_data[2]["lowest_net"] == -10
        assert json_data[2]["games_up"] == 1
        assert json_data[2]["games_down"] == 2
        assert json_data[2]["games_up_most"] == 1
        assert json_data[2]["games_down_most"] == 1
        assert json_data[2]["net_dictionary"] == {"01_01": -1.25}

    out, _ = capfd.readouterr()
    assert out == "Alice 5.5\nBob -4.25\nCharlie -1.25\nPoker game on 01_01 added\n"


def test_add_all_games(tem_dir_fixture1, capfd):
    poker, _, _ = tem_dir_fixture1

    poker.add_all_games()

    out, _ = capfd.readouterr()
    assert out == "Alice 5.5\nBob -4.25\nCharlie -1.25\nPoker game on 01_01 added\n"
    

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
        for player_data in json_data:
            assert player_data["net"] == 0
            assert player_data["biggest_win"] == 0
            assert player_data["biggest_loss"] == 0
            assert player_data["highest_net"] == 0
            assert player_data["lowest_net"] == 0
            assert player_data["games_up"] == 0
            assert player_data["games_down"] == 0
            assert player_data["games_up_most"] == 0
            assert player_data["games_down_most"] == 0
            assert player_data["net_dictionary"] == {}

def test_add_field(tem_dir_fixture1, capfd):

    poker, _, json_path = tem_dir_fixture1

    poker.add_field()

    with open(json_path) as json_file:
        json_data = json.load(json_file)
        for player_data in json_data:
            assert player_data["mock_field"] == 0


# testing exceptions

def test_json_file_not_found():
    with pytest.raises(FileNotFoundError):
        poker = Poker("testing/mock_ledgers", "fake_path.json")

def test_ledger_folder_not_found():
    with pytest.raises(FileNotFoundError):
        poker = Poker("fake_path", "testing/mock_jsons/mock1_data.json")

def test_ledger_file_not_csv(tem_dir_fixture1):
    poker, _, _ = tem_dir_fixture1
    with pytest.raises(FileNotFoundError):
        poker.add_poker_game("testing/mock_ledgers/ledger01_01.txt")

def test_ledger_file_not_found(tem_dir_fixture1):
    poker, _, _ = tem_dir_fixture1
    with pytest.raises(ValueError):
        poker.add_poker_game("fake_ledger.csv")
    








