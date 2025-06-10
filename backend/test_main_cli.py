from click.testing import CliRunner

import main


class DummyPoker:
    def __init__(self, ledger_path, json_path):
        self.ledger_folder_path = ledger_path
        self.json_path = json_path
        self.called = []

    def print_game_results(self, path):
        self.called.append(('pg', path))

    def print_combined_results(self, paths):
        self.called.append(('cb', tuple(paths)))

    def print_all_games(self):
        self.called.append(('pgs',))

    def add_poker_game(self, path):
        self.called.append(('ag', path))

    def print_last_games(self, nickname, n):
        self.called.append(('plg', nickname, n))


def test_cli_commands(monkeypatch):
    runner = CliRunner()
    dp = DummyPoker('L', 'J')
    monkeypatch.setattr(main, 'Poker', lambda *a, **k: dp)

    result = runner.invoke(main.cli, ['pg', '01_01'])
    assert result.exit_code == 0
    assert dp.called[-1] == ('pg', f'{dp.ledger_folder_path}/ledger01_01.csv')

    result = runner.invoke(main.cli, ['cb', '01_01', '01_02'])
    assert result.exit_code == 0
    expected_paths = [
        f'{dp.ledger_folder_path}/ledger01_01.csv',
        f'{dp.ledger_folder_path}/ledger01_02.csv'
    ]
    assert dp.called[-1] == ('cb', tuple(expected_paths))

    result = runner.invoke(main.cli, ['pgs'])
    assert result.exit_code == 0
    assert dp.called[-1] == ('pgs',)

    result = runner.invoke(main.cli, ['ag', '01_01'])
    assert result.exit_code == 0
    assert dp.called[-1] == ('ag', f'{dp.ledger_folder_path}/ledger01_01.csv')

    result = runner.invoke(main.cli, ['plg', 'Alice', '-n', '3'])
    assert result.exit_code == 0
    assert dp.called[-1] == ('plg', 'Alice', 3)


def test_module_main(monkeypatch):
    import types, sys, pathlib
    class DummyCLI:
        def command(self, *a, **k):
            return lambda f: f
        def __call__(self, *a, **k):
            return None

    def group(*a, **k):
        return lambda f: DummyCLI()

    def argument(*a, **k):
        return lambda f: f

    def option(*a, **k):
        return lambda f: f

    dummy_click = types.SimpleNamespace(
        group=group,
        argument=argument,
        option=option,
    )
    monkeypatch.setitem(sys.modules, 'click', dummy_click)
    monkeypatch.setitem(sys.modules, 'poker', types.SimpleNamespace(Poker=object))

    ns = {'__name__': '__main__'}
    path = pathlib.Path(__file__).with_name('main.py')
    code = compile(path.read_text(), str(path), 'exec')
    exec(code, ns)
