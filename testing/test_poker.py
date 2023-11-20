import pytest
import os
from poker import Poker

@pytest.fixture
def poker_instance(tmpdir):
    json_path = tmpdir.join("mock1_data.json")
    ledger_folder_path = tmpdir.mkdir("mock1_ledger_folder")
    return Poker(json_path, ledger_folder_path)