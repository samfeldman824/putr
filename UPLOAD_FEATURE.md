# CSV Upload Feature Documentation

## Overview
This feature allows users to upload CSV game files directly from the browser, eliminating the need to use command-line tools.

## Architecture

### Backend (Flask API)
- **Endpoint**: `POST /api/upload-csv`
- **Location**: `backend/app.py`
- **Functionality**: Receives CSV files, validates them, and processes them using the existing `Poker` class

### Frontend (HTML/JavaScript)
- **Upload Button**: Green "Upload Game CSV" button on the main page
- **File Input**: Hidden file input that accepts `.csv` files only
- **Status Display**: Shows upload progress and success/error messages

## CSV File Format
The CSV files must follow this format and naming convention:
- **Filename**: `ledger[YY_MM_DD].csv` (e.g., `ledger25_06_01.csv`)
- **Columns**: `player_nickname,player_id,session_start_at,session_end_at,buy_in,buy_out,stack,net`

Example:
```csv
player_nickname,player_id,session_start_at,session_end_at,buy_in,buy_out,stack,net
"Alice",123,2025-06-01T10:00:00Z,,1000,,1200,200
"Bob",456,2025-06-01T10:00:00Z,,1000,,800,-200
```

## Usage Instructions

### 1. Start the Flask Server
```bash
cd backend
python app.py
```
The server will start on `http://localhost:5000`

### 2. Open the Web Interface
- Open `index.html` in a web browser
- Or use a simple HTTP server:
  ```bash
  python -m http.server 8000
  ```
  Then navigate to `http://localhost:8000/index.html`

### 3. Upload a CSV File
1. Click the green "Upload Game CSV" button
2. Select a CSV file with the correct format
3. Wait for the confirmation message
4. The table will automatically refresh with updated data from Firebase

## Error Handling
The system provides clear error messages for:
- No file selected
- Invalid file format (non-CSV)
- Invalid CSV structure
- Unknown players
- Server connection issues

## Testing
Comprehensive test suite in `backend/test_app.py`:
```bash
pytest backend/test_app.py -v
```

Tests cover:
- Missing file uploads
- Empty filenames
- Wrong file extensions
- Successful uploads with valid data

## Security Considerations
- File names are sanitized using `secure_filename()`
- Only CSV files are accepted
- Files are temporarily stored and immediately deleted after processing
- CORS is enabled for local development (should be configured appropriately for production)
