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

// Use collection name from config
const collectionName = COLLECTIONS.PLAYERS || 'players';

let parsedGameData = null;

document.addEventListener('DOMContentLoaded', function() {
    const csvFileInput = document.getElementById('csvFile');
    const submitBtn = document.getElementById('submitBtn');
    const previewSection = document.getElementById('previewSection');

    csvFileInput.addEventListener('change', handleFileUpload);
});

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
        showStatus('Please select a CSV file.', true);
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const csvText = e.target.result;
            parsedGameData = parseCSV(csvText);

            if (parsedGameData && parsedGameData.length > 0) {
                displayPreview(parsedGameData);
                document.getElementById('submitBtn').disabled = false;

                // Auto-fill date if not set
                if (parsedGameData.length > 0 && parsedGameData[0].session_start_at) {
                    const gameDate = new Date(parsedGameData[0].session_start_at).toISOString().split('T')[0];
                    if (!document.getElementById('gameDate').value) {
                        document.getElementById('gameDate').value = gameDate;
                    }
                }
            } else {
                showStatus('No valid game data found in CSV file.', true);
            }
        } catch (error) {
            showStatus(`Error parsing CSV: ${error.message}`, true);
            console.error('CSV parsing error:', error);
        }
    };

    reader.readAsText(file);
}

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
        throw new Error('CSV file must contain header and at least one data row');
    }

    // Parse header
    const header = lines[0].split(',').map(col => col.replace(/"/g, '').trim());
    console.log('CSV Headers:', header);

    // Expected headers
    const expectedHeaders = ['player_nickname', 'player_id', 'session_start_at', 'session_end_at', 'buy_in', 'buy_out', 'stack', 'net'];

    // Validate headers
    for (const expectedHeader of expectedHeaders) {
        if (!header.includes(expectedHeader)) {
            throw new Error(`Missing required column: ${expectedHeader}`);
        }
    }

    // Parse data rows
    const gameData = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines

        // Parse CSV row (handle quoted fields)
        const values = parseCSVRow(line);

        if (values.length !== header.length) {
            console.warn(`Row ${i + 1} has ${values.length} columns, expected ${header.length}. Skipping.`);
            continue;
        }

        const rowData = {};
        header.forEach((col, index) => {
            rowData[col] = values[index];
        });

        // Convert numeric fields
        try {
            rowData.buy_in = parseFloat(rowData.buy_in) || 0;
            rowData.buy_out = parseFloat(rowData.buy_out) || 0;
            rowData.stack = parseFloat(rowData.stack) || 0;
            rowData.net = parseFloat(rowData.net) || 0;
        } catch (error) {
            console.warn(`Error parsing numeric values in row ${i + 1}:`, error);
            continue;
        }

        // Validate required fields
        if (!rowData.player_nickname || isNaN(rowData.buy_in)) {
            console.warn(`Invalid data in row ${i + 1}. Skipping.`);
            continue;
        }

        gameData.push(rowData);
    }

    return gameData;
}

function parseCSVRow(row) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
        const char = row[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    values.push(current.trim());
    return values;
}

function displayPreview(gameData) {
    const previewSection = document.getElementById('previewSection');
    const csvPreview = document.getElementById('csvPreview');

    if (gameData.length === 0) {
        csvPreview.innerHTML = '<p>No valid game data found.</p>';
        previewSection.style.display = 'block';
        return;
    }

    // Group data by player (sum up multiple sessions for same player)
    const playerSummary = {};
    gameData.forEach(row => {
        const playerName = row.player_nickname;
        if (!playerSummary[playerName]) {
            playerSummary[playerName] = {
                player_nickname: playerName,
                total_buy_in: 0,
                total_net: 0,
                sessions: 0
            };
        }

        playerSummary[playerName].total_buy_in += row.buy_in;
        playerSummary[playerName].total_net += row.net;
        playerSummary[playerName].sessions += 1;
    });

    let previewHTML = `
        <h4>Game Summary (${Object.keys(playerSummary).length} players, ${gameData.length} sessions)</h4>
        <table class="preview-table">
            <thead>
                <tr>
                    <th>Player</th>
                    <th>Sessions</th>
                    <th>Total Buy-in</th>
                    <th>Total Net</th>
                </tr>
            </thead>
            <tbody>
    `;

    Object.values(playerSummary).forEach(player => {
        previewHTML += `
            <tr>
                <td>${escapeHTML(player.player_nickname)}</td>
                <td>${player.sessions}</td>
                <td>$${player.total_buy_in.toFixed(2)}</td>
                <td style="color: ${player.total_net >= 0 ? 'green' : 'red'}">$${player.total_net.toFixed(2)}</td>
            </tr>
        `;
    });

    previewHTML += `
            </tbody>
        </table>
        <p style="margin-top: 10px; font-size: 12px; color: #666;">
            Total Buy-ins: $${Object.values(playerSummary).reduce((sum, p) => sum + p.total_buy_in, 0).toFixed(2)} |
            Total Net: $${Object.values(playerSummary).reduce((sum, p) => sum + p.total_net, 0).toFixed(2)}
        </p>
    `;

    csvPreview.innerHTML = previewHTML;
    previewSection.style.display = 'block';
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function showStatus(message, isError = false) {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.textContent = message;
    statusDiv.className = `status-message ${isError ? 'status-error' : 'status-success'}`;
    statusDiv.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 5000);
}

async function updatePlayerStats(playerName, gameData) {
    const playerRef = db.collection(collectionName).doc(playerName);

    try {
        const doc = await playerRef.get();
        let playerData;

        if (doc.exists) {
            playerData = doc.data();
        } else {
            // Create new player with default values
            playerData = {
                net: 0,
                putr: null,
                games_played: [],
                net_dictionary: {},
                biggest_win: 0,
                biggest_loss: 0,
                highest_net: 0,
                lowest_net: 0,
                games_up: 0,
                games_down: 0,
                games_up_most: 0,
                games_down_most: 0,
                average_net: 0,
                flag: "https://flagcdn.com/w320/us.png" // Default flag
            };
        }

        // Sum up all the net from this game's sessions for this player
        const totalNetFromGame = gameData.reduce((sum, session) => sum + session.net, 0);
        const totalBuyInFromGame = gameData.reduce((sum, session) => sum + session.buy_in, 0);

        // Update cumulative net
        playerData.net = (playerData.net || 0) + totalNetFromGame;

        // Use provided date or extract from first session
        const gameDate = document.getElementById('gameDate').value ||
                        (gameData[0].session_start_at ? new Date(gameData[0].session_start_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
        const gameLocation = document.getElementById('gameLocation').value || 'Unknown';

        // Update net_dictionary with the game date
        if (!playerData.net_dictionary) playerData.net_dictionary = {};
        playerData.net_dictionary[gameDate] = playerData.net;

        // Update games_played array with consolidated game entry
        if (!playerData.games_played) playerData.games_played = [];
        playerData.games_played.push({
            date: gameDate,
            location: gameLocation,
            buy_in: totalBuyInFromGame,
            cash_out: totalBuyInFromGame + totalNetFromGame,
            net: totalNetFromGame,
            sessions: gameData.length // Track number of sessions in this game
        });

        // Update biggest win/loss
        if (totalNetFromGame > (playerData.biggest_win || 0)) {
            playerData.biggest_win = totalNetFromGame;
        }
        if (totalNetFromGame < (playerData.biggest_loss || 0)) {
            playerData.biggest_loss = totalNetFromGame;
        }

        // Update highest/lowest net
        if (playerData.net > (playerData.highest_net || 0)) {
            playerData.highest_net = playerData.net;
        }
        if (playerData.net < (playerData.lowest_net || 0)) {
            playerData.lowest_net = playerData.net;
        }

        // Update games up/down counts
        if (totalNetFromGame > 0) {
            playerData.games_up = (playerData.games_up || 0) + 1;
        } else if (totalNetFromGame < 0) {
            playerData.games_down = (playerData.games_down || 0) + 1;
        }

        // Calculate streak tracking (simplified)
        playerData.games_up_most = Math.max(playerData.games_up_most || 0, playerData.games_up || 0);
        playerData.games_down_most = Math.max(playerData.games_down_most || 0, playerData.games_down || 0);

        // Calculate average net
        if (playerData.games_played.length > 0) {
            playerData.average_net = playerData.net / playerData.games_played.length;
        }

        // Calculate PUTR (simplified calculation)
        if (playerData.games_played.length >= 5) {
            const recentGames = playerData.games_played.slice(-10); // Last 10 games
            const avgNet = recentGames.reduce((sum, game) => sum + game.net, 0) / recentGames.length;
            playerData.putr = Math.max(0, avgNet * 100); // Simple PUTR calculation
        }

        // Save updated player data
        await playerRef.set(playerData);
        console.log(`Updated player: ${playerName}`);

    } catch (error) {
        console.error(`Error updating player ${playerName}:`, error);
        throw error;
    }
}

document.getElementById('gameForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    if (!parsedGameData || parsedGameData.length === 0) {
        showStatus('Please upload a valid CSV file first.', true);
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing Game Data...';

        // Group sessions by player
        const playerSessions = {};
        parsedGameData.forEach(session => {
            const playerName = session.player_nickname;
            if (!playerSessions[playerName]) {
                playerSessions[playerName] = [];
            }
            playerSessions[playerName].push(session);
        });

        // Update each player's data
        const updatePromises = Object.entries(playerSessions).map(([playerName, sessions]) =>
            updatePlayerStats(playerName, sessions)
        );

        await Promise.all(updatePromises);

        const playerCount = Object.keys(playerSessions).length;
        const sessionCount = parsedGameData.length;

        showStatus(`Game data uploaded successfully! Updated ${playerCount} players from ${sessionCount} sessions.`);

        // Reset form
        document.getElementById('gameForm').reset();
        document.getElementById('previewSection').style.display = 'none';
        parsedGameData = null;

    } catch (error) {
        console.error('Error uploading game data:', error);
        showStatus(`Error: ${error.message}`, true);
    } finally {
        submitBtn.disabled = true; // Keep disabled until new file is selected
        submitBtn.textContent = originalText;
    }
});