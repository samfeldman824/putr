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


        # Print the contents of the temp directory for verification
        # print(f"Contents of the temporary directory {tempdir}:")
        # for root, dirs, files in os.walk(tempdir):
        #     for name in files:
        #         print(os.path.join(root, name))
        #     for name in dirs:
        #         print(os.path.join(root, name))

        # poker = Poker(new_ledger_path, new_json_path + "/mock1_data.json")

        yield tempdir
        # with open(new_path + "/mock1_data.json") as json_file:
        #     json_data = json.load(json_file)
        #     print(json_data)
        # poker = Poker()
        # yield poker

def test_add_poker_game(temp_dir_fixture, capfd):
    ledger_path = os.path.join(temp_dir_fixture, "mock_ledgers")
    json_path = os.path.join(temp_dir_fixture, "mock_jsons/mock1_data.json")
    poker = Poker(ledger_path, json_path)

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

        assert json_data[2]["net"] == -1.25
        assert json_data[2]["biggest_win"] == 0
        assert json_data[2]["biggest_loss"] == -1.25
        assert json_data[2]["highest_net"] == 0
        assert json_data[2]["lowest_net"] == -1.25
        assert json_data[2]["games_up"] == 0
        assert json_data[2]["games_down"] == 1
        assert json_data[2]["games_up_most"] == 0
        assert json_data[2]["games_down_most"] == 0

    out, err = capfd.readouterr()
    assert out == "Alice 5.5\nBob -4.25\nCharlie -1.25\nPoker game on 01_01 added\n"

    

    














