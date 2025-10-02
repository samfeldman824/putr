from flask import Flask, request, jsonify
from flask_cors import CORS
from poker import Poker
import os
from werkzeug.utils import secure_filename
import tempfile

app = Flask(__name__)
CORS(app)

LEDGER_FOLDER = "ledgers"
JSON_PATH = "data.json"

@app.route('/api/upload-csv', methods=['POST'])
def upload_csv():
    """
    Endpoint to upload and process a CSV game file.
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not file.filename.endswith('.csv'):
        return jsonify({'error': 'File must be a CSV'}), 400
    
    try:
        # Create a temporary directory and save with the original filename
        temp_dir = tempfile.mkdtemp()
        filename = secure_filename(file.filename)
        temp_path = os.path.join(temp_dir, filename)
        file.save(temp_path)
        
        # Process the game
        poker = Poker(LEDGER_FOLDER, JSON_PATH)
        poker.add_poker_game(temp_path)
        
        # Clean up the temporary file and directory
        os.unlink(temp_path)
        os.rmdir(temp_dir)
        
        return jsonify({
            'success': True,
            'message': 'Game added successfully'
        }), 200
        
    except FileNotFoundError as e:
        if os.path.exists(temp_path):
            os.unlink(temp_path)
            if os.path.exists(temp_dir):
                os.rmdir(temp_dir)
        return jsonify({'error': f'File error: {str(e)}'}), 400
    except ValueError as e:
        if os.path.exists(temp_path):
            os.unlink(temp_path)
            if os.path.exists(temp_dir):
                os.rmdir(temp_dir)
        return jsonify({'error': f'Invalid CSV format: {str(e)}'}), 400
    except Exception as e:
        if os.path.exists(temp_path):
            os.unlink(temp_path)
            if os.path.exists(temp_dir):
                os.rmdir(temp_dir)
        return jsonify({'error': f'Error processing game: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
