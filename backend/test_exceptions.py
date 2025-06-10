import pytest

from poker import Poker


def test_init_validations(tmp_path):
    with pytest.raises(TypeError):
        Poker(123, 'x')
    with pytest.raises(TypeError):
        Poker('x', 123)
    with pytest.raises(ValueError):
        Poker('', 'x')
    with pytest.raises(ValueError):
        Poker('x', '')


def test_validate_paths_errors(tmp_path):
    # Missing json path
    with pytest.raises(FileNotFoundError):
        Poker._validate_paths(str(tmp_path), str(tmp_path / 'missing.json'))
    tmp_json = tmp_path / 'data.json'
    tmp_json.write_text('{}')
    with pytest.raises(FileNotFoundError):
        Poker._validate_paths(str(tmp_path / 'missing'), str(tmp_json))


def test_load_game_data_errors(tmp_path):
    csv = tmp_path / 'ledger01_01.txt'
    csv.write_text('a,b')
    with pytest.raises(ValueError):
        Poker._load_game_data(str(csv))

    csv_wrong = tmp_path / 'badname.csv'
    csv_wrong.write_text('a,b')
    with pytest.raises(ValueError):
        Poker._load_game_data(str(csv_wrong))
