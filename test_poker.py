import pytest
import shutil
import os
import json
from poker import Poker
from tempfile import TemporaryDirectory

@pytest.fixture
def temp_dir_fixture():
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
        

def test_add_poker_game(temp_dir_fixture, capfd):
    poker, ledger_path, json_path = temp_dir_fixture

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

    out, err = capfd.readouterr()
    assert out == "Alice 5.5\nBob -4.25\nCharlie -1.25\nPoker game on 01_01 added\n"

def test_add_all_games(temp_dir_fixture, capfd):
    poker, _, _ = temp_dir_fixture

    poker.add_all_games()

    out, err = capfd.readouterr()
    assert out == "Alice 5.5\nBob -4.25\nCharlie -1.25\nPoker game on 01_01 added\n"
    

def test_print_game_results(temp_dir_fixture, capfd):

    poker, ledger_path, _ = temp_dir_fixture

    poker.print_game_results(ledger_path + "/ledger01_01.csv")

    out, err = capfd.readouterr()
    assert out == "Alice: 5.5\nCharlie: -1.25\nBob: -4.25\n"
    
def test_unique_nicknames(temp_dir_fixture, capfd):

    poker, _, _ = temp_dir_fixture

    poker.print_unique_nicknames()

    out, err = capfd.readouterr()
    assert "Alice" in out
    assert "Bob" in out
    assert "Charlie" in out

def test_print_all_games(temp_dir_fixture, capfd):

    poker, _, _ = temp_dir_fixture

    poker.print_all_games()

    out, err = capfd.readouterr()
    assert "01_01" in out

def test_reset_net_fields(temp_dir_fixture, capfd):

    poker, _, json_path = temp_dir_fixture

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

def test_add_field(temp_dir_fixture, capfd):

    poker, _, json_path = temp_dir_fixture

    poker.add_field()

    with open(json_path) as json_file:
        json_data = json.load(json_file)
        for player_data in json_data:
            assert player_data["mock_field"] == 0











