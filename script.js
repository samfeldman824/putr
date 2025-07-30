// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBLetCCR_hcY4_2AcV21w0eYfkqhzH_viQ",
  authDomain: "bmt-db-dc8eb.firebaseapp.com",
  databaseURL: "https://bmt-db-dc8eb-default-rtdb.firebaseio.com",
  projectId: "bmt-db-dc8eb",
  storageBucket: "bmt-db-dc8eb.firebasestorage.app",
  messagingSenderId: "417887464130",
  appId: "1:417887464130:web:82edbc63001c4271a9e95b",
  measurementId: "G-8L0CN18VR5"
};


// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const dbCollectionName = "players-dev"

// Client-side CSV processing class
class ClientPoker {
  constructor() {
    this.db = db;
  }

  // Parse CSV data
  parseCsvData(csvData) {
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must contain header and data rows');
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const playerColumn = headers.find(h =>
      h.toLowerCase().includes('player') || h.toLowerCase().includes('nickname')
    );
    const netColumn = headers.find(h =>
      h.toLowerCase().includes('net') || h.toLowerCase().includes('amount')
    );

    if (!playerColumn || !netColumn) {
      throw new Error('CSV must contain player and net columns');
    }

    const gameData = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const rowData = {};

      headers.forEach((header, index) => {
        if (header === playerColumn) {
          // Remove quotes from player name if present
          let playerName = values[index];
          if (playerName.startsWith('"') && playerName.endsWith('"')) {
            playerName = playerName.slice(1, -1);
          }
          rowData.player_nickname = playerName;
        } else if (header === netColumn) {
          rowData.net = parseFloat(values[index].replace(/[$,\s]/g, ''));
        }
      });

      gameData.push(rowData);
    }

    return gameData;
  }

  // Calculate net winnings
  calculateNetWinnings(gameData) {
    const netWinnings = {};
    gameData.forEach(row => {
      const nickname = row.player_nickname;
      const netAmount = row.net / 100; // Convert cents to dollars
      netWinnings[nickname] = (netWinnings[nickname] || 0) + netAmount;
    });

    // Round to 2 decimal places
    Object.keys(netWinnings).forEach(nickname => {
      netWinnings[nickname] = Math.round(netWinnings[nickname] * 100) / 100;
    });

    return netWinnings;
  }

  // Search for player by nickname
  async searchPlayerByNickname(nickname) {
    try {
      const snapshot = await this.db.collection(dbCollectionName).get();

      for (const doc of snapshot.docs) {
        const playerData = doc.data();
        if (playerData.player_nicknames && playerData.player_nicknames.includes(nickname)) {
          return { ...playerData, player_id: doc.id };
        }
      }
      return null;
    } catch (error) {
      console.error('Error searching for player:', error);
      throw error;
    }
  }

  // Update player statistics
  async updatePlayerStats(playerId, playerData, nickname, playerNet, gameDay) {
    try {
      const playerRef = this.db.collection(dbCollectionName).doc(playerId);

      // Calculate updated stats
      const updatedNet = Math.round((playerData.net + playerNet) * 100) / 100;
      const updatedGamesPlayed = [...playerData.games_played, gameDay];
      const updatedNetDictionary = { ...playerData.net_dictionary, [gameDay]: updatedNet };

      const updates = {
        net: updatedNet,
        games_played: updatedGamesPlayed,
        net_dictionary: updatedNetDictionary,
        biggest_win: Math.max(playerData.biggest_win, playerNet),
        biggest_loss: Math.min(playerData.biggest_loss, playerNet),
        highest_net: Math.max(playerData.highest_net, updatedNet),
        lowest_net: Math.min(playerData.lowest_net, updatedNet),
        average_net: Math.round((updatedNet / updatedGamesPlayed.length) * 100) / 100
      };

      await playerRef.update(updates);
      return true;
    } catch (error) {
      console.error('Error updating player stats:', error);
      throw error;
    }
  }

  // Process CSV game (main function)
  async processCsvGame(csvData, gameDate) {
    try {
      console.log('🎯 ClientPoker: Starting processCsvGame', { gameDate, csvLength: csvData.length });

      // Parse CSV
      const gameData = this.parseCsvData(csvData);
      console.log('📊 ClientPoker: Parsed game data', gameData);

      const netWinnings = this.calculateNetWinnings(gameData);
      console.log('💰 ClientPoker: Calculated net winnings', netWinnings);

      // Validate all players exist
      const unknownPlayers = [];
      const playerDataMap = {};

      for (const nickname of Object.keys(netWinnings)) {
        const player = await this.searchPlayerByNickname(nickname);
        if (!player) {
          unknownPlayers.push(nickname);
        } else {
          playerDataMap[nickname] = player;
        }
      }

      if (unknownPlayers.length > 0) {
        return {
          success: false,
          message: 'Not all players found in database',
          errors: unknownPlayers.map(player => ({
            type: 'unknown_player',
            player,
            message: `Player '${player}' not found in database`
          }))
        };
      }

      // Update all players
      const updatedPlayers = [];
      for (const [nickname, netAmount] of Object.entries(netWinnings)) {
        const player = playerDataMap[nickname];
        await this.updatePlayerStats(
          player.player_id,
          player,
          nickname,
          netAmount,
          gameDate
        );
        updatedPlayers.push(player.player_id);
      }

      return {
        success: true,
        message: `Game processed successfully. Updated ${updatedPlayers.length} players.`,
        playersUpdated: updatedPlayers
      };

    } catch (error) {
      console.error('Error processing CSV game:', error);
      return {
        success: false,
        message: 'Game processing failed',
        errors: [{
          type: 'processing_error',
          message: error.message
        }]
      };
    }
  }
}

// Initialize client poker processor
const clientPoker = new ClientPoker();




let putrAsc = false; // Start false so first sort will be descending (highest to lowest)
let netAsc = true;

// Cache for player data with sessionStorage persistence
let playersCache = null;
let isListenerActive = false;
let realtimeListener = null;

// Load cache from sessionStorage on page load
function loadCacheFromStorage() {
  try {
    const cachedData = sessionStorage.getItem('playersCache');
    const cacheTimestamp = sessionStorage.getItem('cacheTimestamp');
    const listenerActive = sessionStorage.getItem('isListenerActive') === 'true';

    if (cachedData) {
      playersCache = JSON.parse(cachedData);
      console.log("Loaded cached data from sessionStorage");
    }

    // Check if we had an active listener (but we'll need to recreate it)
    if (listenerActive && cacheTimestamp) {
      const timeSinceCache = Date.now() - parseInt(cacheTimestamp);
      if (timeSinceCache < 30000) { // If less than 30 seconds, consider listener still "active"
        isListenerActive = true;
      }
    }
  } catch (error) {
    console.error("Error loading cache from sessionStorage:", error);
  }
}

// Save cache to sessionStorage
function saveCacheToStorage() {
  try {
    if (playersCache) {
      sessionStorage.setItem('playersCache', JSON.stringify(playersCache));
      sessionStorage.setItem('cacheTimestamp', Date.now().toString());
      sessionStorage.setItem('isListenerActive', isListenerActive.toString());
    }
  } catch (error) {
    console.error("Error saving cache to sessionStorage:", error);
  }
}

function populateTable() {
  console.log("populateTable called");

  // Load any existing cache from sessionStorage
  loadCacheFromStorage();

  // If we have cached data, render it immediately
  if (playersCache) {
    console.log("Using cached data from sessionStorage");
    renderTableFromCache();
  }

  // Set up real-time listener if not already active
  if (!isListenerActive) {
    console.log("Setting up real-time listener");
    setupRealtimeListener();
  } else {
    console.log("Real-time listener already active, reconnecting...");
    // Reconnect the listener since page reload breaks the connection
    setupRealtimeListener();
  }
}

function createPlayerRow(key, item) {
  let encodedName = encodeURIComponent(key);
  const row = document.createElement("tr");
  row.innerHTML = `
    <td class="flag-container">
      <img src="${item.flag}" class="player-flag"/>
    </td>
    <td class="player-name">
      <a href="profile.html?playerName=${encodedName}">${key}</a>
    </td>
    <td class="player-putr">${Number.isFinite(item.putr) ? item.putr.toFixed(2) : 'UR'}</td>
    <td class="player-net">${item.net.toFixed(2)}</td>
  `;
  return row;
}

function renderTable(source = "unknown") {
  const tableBody = document.getElementById("table-body");
  tableBody.innerHTML = ""; // Clear existing rows

  // Sort the data before rendering to avoid flash
  const sortedEntries = Object.entries(playersCache).sort(([keyA, itemA], [keyB, itemB]) => {
    const aVal = Number.isFinite(itemA.putr) ? itemA.putr : -Infinity;
    const bVal = Number.isFinite(itemB.putr) ? itemB.putr : -Infinity;
    return bVal - aVal; // Descending order (highest to lowest)
  });

  let playerCount = 0;
  sortedEntries.forEach(([key, item]) => {
    const row = createPlayerRow(key, item);
    tableBody.appendChild(row);
    playerCount++;
  });

  console.log(`Rendered ${playerCount} rows from ${source}`);

  // Update the arrow to show current sort state (descending by PUTR)
  document.getElementById('putr-arrow').textContent = '▲';
  document.getElementById('net-arrow').textContent = '';
}

function setupRealtimeListener() {
  // Clean up any existing listener
  if (realtimeListener) {
    realtimeListener();
    realtimeListener = null;
  }

  isListenerActive = true;
  saveCacheToStorage(); // Save the listener state

  realtimeListener = db.collection(dbCollectionName).onSnapshot((querySnapshot) => {
    console.log("Database updated - refreshing data");
    playersCache = {};

    querySnapshot.forEach((doc) => {
      const item = doc.data();
      const key = doc.id;
      playersCache[key] = item;
    });

    // Save updated cache to sessionStorage
    saveCacheToStorage();
    renderTable("real-time update");
  }, (error) => {
    console.error("Error with real-time listener:", error);
    isListenerActive = false;
    saveCacheToStorage(); // Save the updated state
  });
}

function renderTableFromCache() {
  renderTable("cache");
}

function sortTableByPutr() {
  const tbody = document.querySelector('#leaderboard-table tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  putrAsc = !putrAsc;
  netAsc = true;

  rows.sort((a, b) => {
    const aVal = parseFloat(a.querySelector('.player-putr').textContent);
    const bVal = parseFloat(b.querySelector('.player-putr').textContent);
    return putrAsc ? aVal - bVal : bVal - aVal;
  });

  // re‑populate
  tbody.innerHTML = '';
  rows.forEach(r => tbody.appendChild(r));

  // **only** show the PUTR arrow, clear the NET arrow
  document.getElementById('putr-arrow').textContent = putrAsc ? '▼' : '▲';
  document.getElementById('net-arrow').textContent = '';
}

function sortTableByNet() {
  const tbody = document.querySelector('#leaderboard-table tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  netAsc = !netAsc;
  putrAsc = true;

  rows.sort((a, b) => {
    const aVal = parseFloat(a.querySelector('.player-net').textContent);
    const bVal = parseFloat(b.querySelector('.player-net').textContent);
    return netAsc ? aVal - bVal : bVal - aVal;
  });

  // re‑populate
  tbody.innerHTML = '';
  rows.forEach(r => tbody.appendChild(r));

  // **only** show the NET arrow, clear the PUTR arrow
  document.getElementById('net-arrow').textContent = netAsc ? '▼' : '▲';
  document.getElementById('putr-arrow').textContent = '';
}

// CSV Upload functionality
function initializeCSVUpload() {
  const fileInput = document.getElementById('csv-file-input');
  const fileLabel = document.getElementById('file-label-text');
  const uploadButton = document.getElementById('upload-button');
  const uploadForm = document.getElementById('csv-upload-form');

  // File selection handler
  fileInput.addEventListener('change', function (event) {
    const file = event.target.files[0];
    const label = document.querySelector('.file-input-label');

    if (file) {
      // Basic file validation
      if (!validateCSVFile(file)) {
        return;
      }

      // Update UI to show file selected
      fileLabel.textContent = `Selected: ${file.name}`;
      label.classList.add('file-selected');
      uploadButton.disabled = false;
    } else {
      // Reset UI
      fileLabel.textContent = 'Choose CSV File';
      label.classList.remove('file-selected');
      uploadButton.disabled = true;
    }
  });

  // Form submission handler
  uploadForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const file = fileInput.files[0];
    if (file) {
      uploadCSVFile(file);
    }
  });

  // Help button handler
  const helpButton = document.getElementById('help-button');
  helpButton.addEventListener('click', function () {
    showUserGuidance();
  });
}

function validateCSVFile(file) {
  const resultContainer = document.getElementById('upload-result');

  // Check file type - more comprehensive validation
  const fileName = file.name.toLowerCase();
  const validExtensions = ['.csv'];
  const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

  if (!hasValidExtension) {
    showError(
      'Invalid file type. Please select a CSV file (.csv extension required).',
      'file_type',
      [
        'Make sure your file has a .csv extension',
        'If you have an Excel file, save it as CSV format using "Save As" → "CSV (Comma delimited)"',
        'Rename your file to end with .csv if it\'s already in CSV format',
        'Avoid using .txt or other text file extensions'
      ]
    );
    return false;
  }

  // Check MIME type for additional security
  const validMimeTypes = ['text/csv', 'application/csv', 'text/plain'];
  if (file.type && !validMimeTypes.includes(file.type)) {
    showError(
      'Invalid file format detected. Please ensure you\'re uploading a proper CSV file.',
      'mime_type',
      [
        'Save your file as CSV format from your spreadsheet application',
        'Avoid copying and pasting data into text files',
        'Use "Save As" → "CSV (Comma delimited)" in Excel or Google Sheets'
      ]
    );
    return false;
  }

  // Check file size (limit to 10MB as per design document)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    showError(
      `File size too large (${fileSizeMB}MB). Please select a CSV file smaller than 10MB.`,
      'file_size',
      [
        'Try removing unnecessary columns from your CSV (keep only player names and net winnings)',
        'Split large files into smaller game sessions',
        'Check if your file contains excessive whitespace or formatting',
        'Remove any embedded images or special formatting'
      ]
    );
    return false;
  }

  // Check minimum file size (at least 10 bytes for basic CSV structure)
  const minSize = 10; // 10 bytes minimum
  if (file.size < minSize) {
    showError(
      'The selected file appears to be empty or too small to contain valid CSV data.',
      'empty_file',
      [
        'Make sure your CSV file contains game data with headers',
        'Check that the file was saved properly',
        'Verify the file isn\'t corrupted or truncated',
        'Ensure you have at least one header row and one data row'
      ]
    );
    return false;
  }

  // Check if file is exactly empty
  if (file.size === 0) {
    showError(
      'The selected file is completely empty. Please select a valid CSV file.',
      'empty_file',
      [
        'Make sure your CSV file contains game data',
        'Check that the file was saved properly',
        'Verify the file isn\'t corrupted',
        'Ensure you\'re not uploading a blank file'
      ]
    );
    return false;
  }

  // Hide any previous error messages
  resultContainer.style.display = 'none';
  return true;
}

function showError(message, errorType = 'general', suggestions = []) {
  // Use enhanced error handling for better user experience
  showEnhancedError(message, errorType, suggestions);
}

async function uploadCSVFile(file) {
  // Show confirmation dialog before upload
  if (!await showConfirmationDialog(file)) {
    return;
  }

  const uploadButton = document.getElementById('upload-button');
  const progressContainer = document.getElementById('upload-progress');
  const progressFill = document.querySelector('.progress-fill');
  const progressText = document.querySelector('.progress-text');
  const resultContainer = document.getElementById('upload-result');

  try {
    // Show progress and disable upload button
    uploadButton.disabled = true;
    progressContainer.style.display = 'flex';
    resultContainer.style.display = 'none';
    progressText.textContent = 'Reading file...';
    progressFill.style.width = '10%';

    // Read file content with timeout
    const csvData = await readFileWithTimeout(file, 30000); // 30 second timeout
    progressText.textContent = 'Validating CSV format...';
    progressFill.style.width = '20%';

    // Enhanced CSV format validation
    const formatValidation = validateCSVFormat(csvData);
    if (!formatValidation.valid) {
      // Show enhanced error with suggestions
      showEnhancedError(
        formatValidation.message,
        'csv_format',
        formatValidation.suggestions || []
      );
      return;
    }

    // Client-side player validation if we have cached player data
    progressText.textContent = 'Validating player names...';
    progressFill.style.width = '35%';

    const playerValidation = await validatePlayersInCSV(csvData);
    if (!playerValidation.valid) {
      showEnhancedError(
        playerValidation.message,
        'player_validation',
        playerValidation.suggestions || []
      );
      return;
    }

    progressText.textContent = 'Uploading to server...';
    progressFill.style.width = '50%';

    // Generate game date (format: YY_MM_DD)
    const gameDate = generateGameDate();

    // Prepare request data
    const requestData = {
      csvData: csvData,
      gameDate: gameDate
    };

    progressText.textContent = 'Processing game data...';
    progressFill.style.width = '70%';

    // Process CSV using client-side processing instead of Cloud Function
    console.log('🔍 DEBUG: Starting CSV processing', { csvData: csvData.substring(0, 100) + '...', gameDate });
    debugger; // Breakpoint 1: Before processing
    const result = await clientPoker.processCsvGame(csvData, gameDate);
    console.log('🔍 DEBUG: Processing result', result);
    debugger; // Breakpoint 2: After processing

    progressText.textContent = 'Finalizing...';
    progressFill.style.width = '90%';

    progressFill.style.width = '100%';

    // Hide progress
    setTimeout(() => {
      progressContainer.style.display = 'none';

      if (result.success) {
        showSuccess(result);
      } else {
        showUploadError(result);
      }

      // Re-enable upload button
      uploadButton.disabled = false;
    }, 500);

  } catch (error) {
    console.error('Upload error:', error);
    progressContainer.style.display = 'none';
    uploadButton.disabled = false;

    // Enhanced error handling with specific error types
    handleUploadError(error);
  }
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = (error) => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// Enhanced file reading with timeout
function readFileWithTimeout(file, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    // Set up timeout
    const timeout = setTimeout(() => {
      reader.abort();
      reject(new Error('File reading timed out. The file may be too large or corrupted.'));
    }, timeoutMs);

    reader.onload = (event) => {
      clearTimeout(timeout);
      resolve(event.target.result);
    };

    reader.onerror = (error) => {
      clearTimeout(timeout);
      reject(new Error('Failed to read file. The file may be corrupted or inaccessible.'));
    };

    reader.onabort = () => {
      clearTimeout(timeout);
      reject(new Error('File reading was aborted.'));
    };

    try {
      reader.readAsText(file);
    } catch (error) {
      clearTimeout(timeout);
      reject(new Error('Failed to start reading file.'));
    }
  });
}

// Validate players in CSV against cached player data
async function validatePlayersInCSV(csvData) {
  try {
    // If we don't have cached player data, skip validation (server will handle it)
    if (!playersCache || Object.keys(playersCache).length === 0) {
      return {
        valid: true,
        message: 'Player validation skipped - will be validated on server.',
        skipped: true
      };
    }

    const lines = csvData.trim().split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) {
      return { valid: true, message: 'No data to validate.' };
    }

    const headerLine = lines[0].trim();
    const headers = headerLine.split(',').map(h => h.trim().toLowerCase());

    // Find player column
    const playerColumnIndex = headers.findIndex(h =>
      h.includes('player') || h.includes('name') || h.includes('nick')
    );

    if (playerColumnIndex === -1) {
      return { valid: true, message: 'No player column found for validation.' };
    }

    // Get all player nicknames from cache (case-insensitive)
    const allPlayerNicknames = [];
    Object.values(playersCache).forEach(player => {
      if (player.player_nicknames && Array.isArray(player.player_nicknames)) {
        player.player_nicknames.forEach(nickname => {
          allPlayerNicknames.push(nickname.toLowerCase());
        });
      }
    });

    const unknownPlayers = [];
    const csvPlayerNames = [];

    // Check each data row
    const dataLines = lines.slice(1);
    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i].trim();
      if (!line) continue;

      const columns = line.split(',');
      if (columns.length > playerColumnIndex) {
        // Remove quotes from player name if present
        let playerName = columns[playerColumnIndex].trim();
        if (playerName.startsWith('"') && playerName.endsWith('"')) {
          playerName = playerName.slice(1, -1);
        }
        const playerNameLower = playerName.toLowerCase();

        csvPlayerNames.push(playerName);

        // Check if player nickname exists in any player's nickname array
        if (!allPlayerNicknames.includes(playerNameLower)) {
          unknownPlayers.push(playerName);
        }
      }
    }

    // If there are unknown players, return validation error
    if (unknownPlayers.length > 0) {
      return {
        valid: false,
        message: `Found ${unknownPlayers.length} unknown player(s): ${unknownPlayers.slice(0, 5).join(', ')}${unknownPlayers.length > 5 ? '...' : ''}`,
        suggestions: [
          'Make sure all player nicknames exist in the database',
          'Check for typos in player names',
          'Verify player names match exactly (case-insensitive)',
          'Add missing players to the database before uploading',
          `Unknown players: ${unknownPlayers.join(', ')}`
        ],
        unknownPlayers: unknownPlayers
      };
    }

    return {
      valid: true,
      message: `All ${csvPlayerNames.length} players validated successfully.`,
      validatedPlayers: csvPlayerNames
    };

  } catch (error) {
    console.error('Player validation error:', error);
    return {
      valid: true,
      message: 'Player validation failed - will be validated on server.',
      skipped: true
    };
  }
}

// Fetch with retry logic and timeout
async function fetchWithRetry(url, options, maxRetries = 3, timeoutMs = 5000) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;

    } catch (error) {
      lastError = error;
      console.warn(`Fetch attempt ${attempt} failed:`, error.message);

      // Don't retry on certain errors
      if (error.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs}ms`);
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
}

// Enhanced error handling for upload errors
function handleUploadError(error) {
  let errorMessage = 'Upload failed';
  let errorType = 'general';
  let suggestions = [];

  // Categorize different types of errors
  if (error.message.includes('timeout') || error.message.includes('timed out')) {
    errorType = 'timeout';
    errorMessage = 'Upload timed out';
    suggestions = [
      'Check your internet connection',
      'Try uploading a smaller CSV file',
      'Retry the upload - server may be busy',
      'Contact support if the problem persists'
    ];
  } else if (error.message.includes('Network') || error.message.includes('fetch')) {
    errorType = 'network';
    errorMessage = 'Network connection error';
    suggestions = [
      'Check your internet connection',
      'Try refreshing the page and uploading again',
      'Ensure you\'re not behind a restrictive firewall',
      'Contact your network administrator if needed'
    ];
  } else if (error.message.includes('Server error')) {
    errorType = 'server';
    errorMessage = 'Server error occurred';
    suggestions = [
      'The server may be temporarily unavailable',
      'Try uploading again in a few minutes',
      'Check if your CSV format is correct',
      'Contact support if the error persists'
    ];
  } else if (error.message.includes('Failed to read file')) {
    errorType = 'file_read';
    errorMessage = 'Could not read the selected file';
    suggestions = [
      'Make sure the file isn\'t corrupted',
      'Try saving the CSV file again',
      'Check that the file isn\'t open in another application',
      'Ensure you have permission to read the file'
    ];
  } else {
    errorMessage = error.message || 'An unexpected error occurred';
    suggestions = [
      'Try refreshing the page and uploading again',
      'Check your CSV file format',
      'Ensure your internet connection is stable',
      'Contact support if the problem continues'
    ];
  }

  showEnhancedError(errorMessage, errorType, suggestions);
}

function validateCSVFormat(csvData) {
  try {
    // Comprehensive CSV validation
    const lines = csvData.trim().split('\n').filter(line => line.trim() !== '');

    // Must have at least 2 lines (header + data)
    if (lines.length < 2) {
      return {
        valid: false,
        message: 'CSV file must contain at least a header row and one data row.',
        suggestions: [
          'Make sure your CSV has a header row (e.g., "player_nickname,net")',
          'Include at least one row of game data',
          'Check that your file isn\'t mostly empty lines'
        ]
      };
    }

    // Validate header row
    const headerLine = lines[0].trim();
    if (!headerLine) {
      return {
        valid: false,
        message: 'CSV file header row is empty.',
        suggestions: [
          'Add a header row with column names',
          'Example: "player_nickname,net"',
          'Make sure the first line isn\'t blank'
        ]
      };
    }

    // Parse header columns
    const headers = headerLine.split(',').map(h => h.trim().toLowerCase());

    // Check for minimum required columns
    const hasPlayerColumn = headers.some(h =>
      h.includes('player') || h.includes('name') || h.includes('nick')
    );

    const hasAmountColumn = headers.some(h =>
      h.includes('net') || h.includes('win') || h.includes('amount') || h.includes('earning')
    );

    if (!hasPlayerColumn) {
      return {
        valid: false,
        message: 'CSV file must contain a column for player names.',
        suggestions: [
          'Add a column header like "player_nickname", "name", or "nick"',
          'Make sure the player name column is clearly labeled',
          'Example header: "player_nickname,net"'
        ]
      };
    }

    if (!hasAmountColumn) {
      return {
        valid: false,
        message: 'CSV file must contain a column for winnings/amounts.',
        suggestions: [
          'Add a column header like "net", "winnings", "amount", or "earnings"',
          'Make sure the amount column is clearly labeled',
          'Example header: "player_nickname,net"'
        ]
      };
    }

    // Validate data rows
    const dataLines = lines.slice(1);
    const expectedColumnCount = headers.length;

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i].trim();
      if (!line) continue; // Skip empty lines

      const columns = line.split(',');

      // Check column count consistency
      if (columns.length !== expectedColumnCount) {
        return {
          valid: false,
          message: `Row ${i + 2} has ${columns.length} columns, but header has ${expectedColumnCount} columns.`,
          suggestions: [
            'Make sure all rows have the same number of columns as the header',
            'Check for missing commas or extra commas in your data',
            'Ensure no cells contain unescaped commas',
            'Use quotes around text that contains commas'
          ]
        };
      }

      // Validate that we have non-empty values in key columns
      const playerColumnIndex = headers.findIndex(h =>
        h.includes('player') || h.includes('name') || h.includes('nick')
      );
      const amountColumnIndex = headers.findIndex(h =>
        h.includes('net') || h.includes('win') || h.includes('amount') || h.includes('earning')
      );

      if (playerColumnIndex >= 0 && !columns[playerColumnIndex].trim()) {
        return {
          valid: false,
          message: `Row ${i + 2} has an empty player name.`,
          suggestions: [
            'Make sure all rows have player names filled in',
            'Remove rows with empty player names',
            'Check for extra blank rows in your CSV'
          ]
        };
      }

      if (amountColumnIndex >= 0) {
        const amountValue = columns[amountColumnIndex].trim();
        if (!amountValue) {
          return {
            valid: false,
            message: `Row ${i + 2} has an empty amount value.`,
            suggestions: [
              'Make sure all rows have amount values filled in',
              'Use 0 for players with no winnings/losses',
              'Check for missing data in your CSV'
            ]
          };
        }

        // Validate that amount is a valid number
        const numericValue = parseFloat(amountValue);
        if (isNaN(numericValue)) {
          return {
            valid: false,
            message: `Row ${i + 2} has an invalid amount value: "${amountValue}". Must be a number.`,
            suggestions: [
              'Make sure all amount values are valid numbers',
              'Use decimal format (e.g., 150.50, -75.25)',
              'Remove any currency symbols or extra text',
              'Use negative numbers for losses (e.g., -50.00)'
            ]
          };
        }
      }
    }

    // Check for reasonable data size
    if (dataLines.length > 100) {
      return {
        valid: false,
        message: `CSV contains ${dataLines.length} data rows. Maximum recommended is 100 players per game.`,
        suggestions: [
          'Consider splitting large games into multiple sessions',
          'Verify this is a single game session, not multiple games',
          'Remove any duplicate or test data'
        ]
      };
    }

    // Check for duplicate player names
    const playerNames = [];
    const playerColumnIndex = headers.findIndex(h =>
      h.includes('player') || h.includes('name') || h.includes('nick')
    );

    if (playerColumnIndex >= 0) {
      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i].trim();
        if (!line) continue;

        const columns = line.split(',');
        const playerName = columns[playerColumnIndex].trim().toLowerCase();

        if (playerNames.includes(playerName)) {
          return {
            valid: false,
            message: `Duplicate player name found: "${columns[playerColumnIndex].trim()}"`,
            suggestions: [
              'Remove duplicate entries for the same player',
              'If a player has multiple entries, combine their winnings',
              'Check for slight variations in player names (spaces, capitalization)'
            ]
          };
        }
        playerNames.push(playerName);
      }
    }

    return {
      valid: true,
      message: 'CSV format is valid.',
      playerCount: dataLines.length,
      headers: headers
    };

  } catch (error) {
    return {
      valid: false,
      message: 'Failed to parse CSV file. The file may be corrupted or in an invalid format.',
      suggestions: [
        'Make sure the file is saved as a proper CSV format',
        'Try re-saving the file from your spreadsheet application',
        'Check for special characters or encoding issues',
        'Ensure the file isn\'t corrupted'
      ]
    };
  }
}

function generateGameDate() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}_${month}_${day}`;
}

function showSuccess(result) {
  const resultContainer = document.getElementById('upload-result');
  const playersCount = result.playersUpdated ? result.playersUpdated.length : 0;
  const gameDate = result.gameDate || 'Unknown';

  resultContainer.innerHTML = `
    <div class="result-success">
      <strong>Success!</strong> ${result.message}
      <div class="success-details">
        <p><strong>Game Date:</strong> ${gameDate}</p>
        <p><strong>Players Updated:</strong> ${playersCount}</p>
        ${result.playersUpdated && result.playersUpdated.length > 0 ?
      `<p><strong>Updated Players:</strong> ${result.playersUpdated.join(', ')}</p>` :
      ''
    }
      </div>
    </div>
  `;
  resultContainer.style.display = 'block';

  // Reset form
  resetUploadForm();
}

function showUploadError(result) {
  const resultContainer = document.getElementById('upload-result');
  let errorHtml = `
    <div class="result-error">
      <strong>Upload Failed:</strong> ${result.message}
  `;

  if (result.errors && result.errors.length > 0) {
    errorHtml += `
      <div class="error-details">
        <strong>Details:</strong>
        <ul>
    `;

    result.errors.forEach(error => {
      errorHtml += `<li>${error.message}${error.player ? ` (Player: ${error.player})` : ''}</li>`;
    });

    errorHtml += `
        </ul>
      </div>
    `;
  }

  errorHtml += `</div>`;

  resultContainer.innerHTML = errorHtml;
  resultContainer.style.display = 'block';

  // Reset form
  resetUploadForm();
}

function resetUploadForm() {
  const fileInput = document.getElementById('csv-file-input');
  const fileLabel = document.getElementById('file-label-text');
  const uploadButton = document.getElementById('upload-button');
  const label = document.querySelector('.file-input-label');

  fileInput.value = '';
  fileLabel.textContent = 'Choose CSV File';
  label.classList.remove('file-selected');
  uploadButton.disabled = true;
}

async function showConfirmationDialog(file) {
  return new Promise((resolve) => {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    // Create modal content
    const modal = document.createElement('div');
    modal.className = 'modal-content';

    const gameDate = generateGameDate();
    const fileSizeKB = (file.size / 1024).toFixed(1);

    modal.innerHTML = `
      <div class="modal-header">
        <h3>Confirm CSV Upload</h3>
      </div>
      <div class="modal-body">
        <p><strong>File:</strong> ${file.name}</p>
        <p><strong>Size:</strong> ${fileSizeKB} KB</p>
        <p><strong>Game Date:</strong> ${gameDate}</p>
        <div class="warning-message">
          <p><strong>⚠️ Important:</strong></p>
          <ul>
            <li>This will update player statistics in the database</li>
            <li>Make sure all player nicknames in the CSV exist in the system</li>
            <li>The CSV should have proper headers (player names and net winnings)</li>
            <li>This action cannot be easily undone</li>
          </ul>
        </div>
        <p>Are you sure you want to proceed with uploading this game data?</p>
      </div>
      <div class="modal-footer">
        <button class="modal-btn modal-btn-cancel" id="cancel-upload">Cancel</button>
        <button class="modal-btn modal-btn-confirm" id="confirm-upload">Upload Game</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Add event listeners
    const cancelBtn = modal.querySelector('#cancel-upload');
    const confirmBtn = modal.querySelector('#confirm-upload');

    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
      resolve(false);
    });

    confirmBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
      resolve(true);
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
        resolve(false);
      }
    });

    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        document.body.removeChild(overlay);
        document.removeEventListener('keydown', handleEscape);
        resolve(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
  });
}

function showUserGuidance() {
  const resultContainer = document.getElementById('upload-result');
  resultContainer.innerHTML = `
    <div class="guidance-container">
      <h4>📋 CSV Upload Guidelines</h4>
      <div class="guidance-content">
        <p><strong>Required CSV Format:</strong></p>
        <ul>
          <li>First row must contain headers</li>
          <li>Must include a column for player names/nicknames</li>
          <li>Must include a column for net winnings/amounts</li>
          <li>Example: <code>player_nickname,net</code></li>
        </ul>
        
        <p><strong>Important Notes:</strong></p>
        <ul>
          <li>All player nicknames must already exist in the database</li>
          <li>Net winnings can be positive or negative numbers</li>
          <li>File size limit: 10MB</li>
          <li>Only CSV files are accepted</li>
        </ul>
        
        <p><strong>What happens after upload:</strong></p>
        <ul>
          <li>Player statistics will be updated immediately</li>
          <li>The leaderboard will refresh automatically</li>
          <li>Game data will be saved with today's date</li>
        </ul>
      </div>
      <button class="guidance-close-btn" onclick="hideUserGuidance()">Got it!</button>
    </div>
  `;
  resultContainer.style.display = 'block';
}

function hideUserGuidance() {
  const resultContainer = document.getElementById('upload-result');
  resultContainer.style.display = 'none';
}

// Enhanced error handling with specific guidance
function showEnhancedError(message, errorType = 'general', suggestions = []) {
  const resultContainer = document.getElementById('upload-result');

  let guidanceHtml = '';
  if (suggestions.length > 0) {
    guidanceHtml = `
      <div class="error-guidance">
        <p><strong>💡 Suggestions:</strong></p>
        <ul>
          ${suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  resultContainer.innerHTML = `
    <div class="result-error">
      <strong>Error:</strong> ${message}
      ${guidanceHtml}
      <div class="error-actions">
        <button class="error-action-btn" onclick="showUserGuidance()">View Upload Guidelines</button>
        <button class="error-action-btn" onclick="hideUserGuidance()">Try Again</button>
      </div>
    </div>
  `;
  resultContainer.style.display = 'block';

  // Reset file input
  resetUploadForm();
}

// Call the sorting function when the page loads to initially sort the table by PUTR
window.addEventListener("load", () => {
  populateTable();
  initializeCSVUpload();
});

