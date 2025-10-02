import pytest
import json
import os
import tempfile
from io import BytesIO
from app import app


@pytest.fixture
def client():
    """Create a test client for the Flask app."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


@pytest.fixture
def temp_ledger_and_json(tmp_path):
    """Create temporary ledger folder and JSON file for testing."""
    ledger_folder = tmp_path / "ledgers"
    ledger_folder.mkdir()
    
    json_file = tmp_path / "data.json"
    json_data = {
        "Alice": {
            "net": 0,
            "games_played": [],
            "biggest_win": 0,
            "biggest_loss": 0,
            "highest_net": 0,
            "lowest_net": 0,
            "net_dictionary": {},
            "average_net": 0,
            "games_up_most": 0,
            "games_down_most": 0,
            "games_up": 0,
            "games_down": 0
        },
        "Bob": {
            "net": 0,
            "games_played": [],
            "biggest_win": 0,
            "biggest_loss": 0,
            "highest_net": 0,
            "lowest_net": 0,
            "net_dictionary": {},
            "average_net": 0,
            "games_up_most": 0,
            "games_down_most": 0,
            "games_up": 0,
            "games_down": 0
        }
    }
    json_file.write_text(json.dumps(json_data, indent=4))
    
    return str(ledger_folder), str(json_file)


def test_upload_csv_no_file(client):
    """Test upload endpoint with no file provided."""
    response = client.post('/api/upload-csv')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
    assert 'No file provided' in data['error']


def test_upload_csv_empty_filename(client):
    """Test upload endpoint with empty filename."""
    data = {'file': (BytesIO(b''), '')}
    response = client.post('/api/upload-csv', data=data, content_type='multipart/form-data')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data


def test_upload_csv_wrong_extension(client):
    """Test upload endpoint with non-CSV file."""
    data = {'file': (BytesIO(b'some data'), 'test.txt')}
    response = client.post('/api/upload-csv', data=data, content_type='multipart/form-data')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
    assert 'CSV' in data['error']


def test_upload_csv_success(client, temp_ledger_and_json, monkeypatch):
    """Test successful CSV upload and processing."""
    ledger_folder, json_file = temp_ledger_and_json
    
    # Patch the app's LEDGER_FOLDER and JSON_PATH
    import backend.app as app_module
    monkeypatch.setattr(app_module, 'LEDGER_FOLDER', ledger_folder)
    monkeypatch.setattr(app_module, 'JSON_PATH', json_file)
    
    # Create a valid CSV content
    csv_content = b"""player_nickname,player_id,session_start_at,session_end_at,buy_in,buy_out,stack,net
Alice,123,2024-01-01T10:00:00Z,,1000,,1050,50
Bob,456,2024-01-01T10:00:00Z,,1000,,950,-50
"""
    
    data = {'file': (BytesIO(csv_content), 'ledger24_01_01.csv')}
    response = client.post('/api/upload-csv', data=data, content_type='multipart/form-data')
    
    response_data = json.loads(response.data)
    print(f"Response status: {response.status_code}")
    print(f"Response data: {response_data}")
    
    assert response.status_code == 200
    assert response_data['success'] is True
    assert 'successfully' in response_data['message']
