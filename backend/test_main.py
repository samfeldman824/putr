import runpy
import sys
import pytest
from click.testing import CliRunner

import main


def test_main_does_nothing():
    assert main.main() is None


def test_pg_invokes_print_game_results(monkeypatch):
    called = {}

    class FakePoker:
        def __init__(self, ledger_folder_path, json_path):
            called['init'] = (ledger_folder_path, json_path)
            self.ledger_folder_path = ledger_folder_path
            self.json_path = json_path

        def print_game_results(self, csv_path):
            called['csv'] = csv_path

    monkeypatch.setattr(main, "Poker", FakePoker)
    runner = CliRunner()
    result = runner.invoke(main.cli, ["pg", "01_01"])
    assert result.exit_code == 0
    assert called == {
        'init': ("ledgers", "database.db"),
        'csv': "ledgers/ledger01_01.csv",
    }


def test_cb_invokes_print_combined_results(monkeypatch):
    called = {}

    class FakePoker:
        def __init__(self, ledger_folder_path, json_path):
            called['init'] = (ledger_folder_path, json_path)
            self.ledger_folder_path = ledger_folder_path
            self.json_path = json_path

        def print_combined_results(self, paths):
            called['paths'] = paths

    monkeypatch.setattr(main, "Poker", FakePoker)
    runner = CliRunner()
    result = runner.invoke(main.cli, ["cb", "01_01", "01_02"])
    assert result.exit_code == 0
    assert called['init'] == ("ledgers", "database.db")
    assert called['paths'] == [
        "ledgers/ledger01_01.csv",
        "ledgers/ledger01_02.csv",
    ]


def test_pgs_invokes_print_all_games(monkeypatch):
    called = {}

    class FakePoker:
        def __init__(self, ledger_folder_path, json_path):
            called['init'] = (ledger_folder_path, json_path)
            self.ledger_folder_path = ledger_folder_path
            self.json_path = json_path

        def print_all_games(self):
            called['called'] = True

    monkeypatch.setattr(main, "Poker", FakePoker)
    runner = CliRunner()
    result = runner.invoke(main.cli, ["pgs"])
    assert result.exit_code == 0
    assert called == {'init': ("ledgers", "database.db"), 'called': True}


def test_ag_invokes_add_poker_game(monkeypatch):
    called = {}

    class FakePoker:
        def __init__(self, ledger_folder_path, json_path):
            called['init'] = (ledger_folder_path, json_path)
            self.ledger_folder_path = ledger_folder_path
            self.json_path = json_path

        def add_poker_game(self, path):
            called['path'] = path

    monkeypatch.setattr(main, "Poker", FakePoker)
    runner = CliRunner()
    result = runner.invoke(main.cli, ["ag", "01_03"])
    assert result.exit_code == 0
    assert called == {
        'init': ("ledgers", "database.db"),
        'path': "ledgers/ledger01_03.csv",
    }


def test_plg_invokes_print_last_games(monkeypatch):
    called = {}

    class FakePoker:
        def __init__(self, ledger_folder_path, json_path):
            called['init'] = (ledger_folder_path, json_path)
            self.ledger_folder_path = ledger_folder_path
            self.json_path = json_path

        def print_last_games(self, nickname, n):
            called['args'] = (nickname, n)

    monkeypatch.setattr(main, "Poker", FakePoker)
    runner = CliRunner()
    result = runner.invoke(main.cli, ["plg", "Alice", "-n", "3"])
    assert result.exit_code == 0
    assert called == {
        'init': ("ledgers", "database.db"),
        'args': ("Alice", 3),
    }


def test_module_executes_main_and_cli(monkeypatch):
    monkeypatch.syspath_prepend("backend")
    monkeypatch.setattr(sys, "argv", ["main.py", "--help"])
    with pytest.raises(SystemExit) as exc:
        runpy.run_path("backend/main.py", run_name="__main__")
    assert exc.value.code == 0