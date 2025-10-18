// Firebase configuration - switches between prod and emulator
let firebaseConfig;

if (location.hostname === 'localhost' || location.hostname === 'host.docker.internal') {
  // Local development with emulator
  firebaseConfig = {
    projectId: 'putr-dev'
  };
  console.log('🏠 Using Firebase emulator configuration');
} else {
  // Production configuration
  firebaseConfig = {
    apiKey: "AIzaSyBLetCCR_hcY4_2AcV21w0eYfkqhzH_viQ",
    authDomain: "bmt-db-dc8eb.firebaseapp.com",
    databaseURL: "https://bmt-db-dc8eb-default-rtdb.firebaseio.com",
    projectId: "bmt-db-dc8eb",
    storageBucket: "bmt-db-dc8eb.firebasestorage.app",
    messagingSenderId: "417887464130",
    appId: "1:417887464130:web:82edbc63001c4271a9e95b",
    measurementId: "G-8L0CN18VR5"
  };
  console.log('🌐 Using production Firebase configuration');
}

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Connect to emulator when running locally, only once and before any Firestore operations
let emulatorConfigured = false;
if ((location.hostname === 'localhost' || location.hostname === 'host.docker.internal') && !emulatorConfigured) {
  console.log('🔧 Connecting to Firebase emulator...');
  console.log('Current hostname:', location.hostname);
  console.log('Current project:', firebaseConfig.projectId);
  try {
    // Use host.docker.internal for emulator connection when accessed from Docker
    const emulatorHost = location.hostname === 'host.docker.internal' ? 'host.docker.internal' : 'localhost';
    db.useEmulator(emulatorHost, 8080);
    emulatorConfigured = true;
    console.log(`✅ Connected to Firestore emulator on ${emulatorHost}:8080`);
    console.log('Emulator settings:', db._delegate._settings);
  } catch (error) {
    if (error.message && error.message.includes('useEmulator() has already been called')) {
      console.warn('⚠️ Emulator already configured:', error);
    } else {
      console.warn('⚠️ Could not connect to emulator:', error);
    }
  }
}

const urlParams = new URLSearchParams(window.location.search);

function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const playerName = decodeURIComponent(urlParams.get('playerName'));

const createStatCard = (label, value) => `
<div class="stat-card">
  <div class="stat-value">${value}</div>
  <div class="stat-label">${label}</div>
</div>
`;

/**
 * Parses a date string in format YY_MM_DD and returns a Date object.
 * @param {string} dateStr - Date string in format "YY_MM_DD"
 * @returns {Date|null} Date object or null if invalid
 */
function parseLedgerDate(dateStr) {
  const match = dateStr.match(/(\d{2})_(\d{2})_(\d{2})/);
  if (match) {
    const year = 2000 + parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    return new Date(year, month, day);
  }
  return null;
}

/**
 * Converts net_dictionary to sorted array of {dateStr, date, net} objects.
 * @param {Object} netDictionary - Object mapping date strings to net values
 * @returns {Array} Sorted array of game objects
 */
function parseGamesFromNetDictionary(netDictionary) {
  const games = [];
  for (const dateStr of Object.keys(netDictionary)) {
    const date = parseLedgerDate(dateStr);
    if (date) {
      games.push({
        dateStr: dateStr,
        date: date,
        net: netDictionary[dateStr]
      });
    }
  }
  // Sort by date ascending
  games.sort((a, b) => a.date - b.date);
  return games;
}

/**
 * Gets the last N games from a sorted games array.
 * @param {Array} games - Sorted array of game objects
 * @param {number} n - Number of games to retrieve
 * @returns {Array} Last N games, or empty array if fewer than N games exist
 */
function getLastNGames(games, n) {
  if (games.length < n) {
    return [];
  }
  return games.slice(-n);
}

/**
 * Finds the best N-game streak (highest net change over consecutive N games).
 * Since net_dictionary stores cumulative totals, we calculate the net change
 * for each window as the difference between end and start cumulative values.
 * @param {Array} games - Sorted array of game objects
 * @param {number} n - Streak length
 * @returns {Array|null} Best streak of N games or null if insufficient data
 */
function findBestNGameStreak(games, n) {
  if (games.length < n) {
    return null;
  }
  
  let bestNetChange = -Infinity;
  let bestStartIdx = 0;
  
  // Calculate net change for each possible window of N games
  for (let i = 0; i <= games.length - n; i++) {
    const window = games.slice(i, i + n);
    
    // Net change for this window is end cumulative - start cumulative
    const endNet = window[window.length - 1].net;
    const startNet = (i > 0) ? games[i - 1].net : 0;
    const netChange = endNet - startNet;
    
    if (netChange > bestNetChange) {
      bestNetChange = netChange;
      bestStartIdx = i;
    }
  }
  
  return games.slice(bestStartIdx, bestStartIdx + n);
}

/**
 * Calculates the net change for an array of games.
 * Since net_dictionary stores cumulative totals, we calculate the difference
 * between the last game's cumulative net and the game before the first game.
 * @param {Array} games - Array of game objects (must be sorted chronologically)
 * @param {Array} allGames - Full array of all games for finding previous game
 * @returns {number} Net change over the game window
 */
function calculateNetChange(games, allGames) {
  if (games.length === 0) {
    return 0;
  }
  
  // Get the cumulative net at the end of this window
  const endNet = games[games.length - 1].net;
  
  // Find the game immediately before this window in allGames
  const firstGameDate = games[0].date;
  let startNet = 0;
  
  // Find the previous game's cumulative net
  for (let i = allGames.length - 1; i >= 0; i--) {
    if (allGames[i].date < firstGameDate) {
      startNet = allGames[i].net;
      break;
    }
  }
  
  // Net change is the difference
  return endNet - startNet;
}

/**
 * Updates a badge pill with net value and color coding.
 * @param {string} badgeId - ID of badge element
 * @param {number|null} netValue - Net value to display, or null to show N/A
 */
function updateBadge(badgeId, netValue) {
  const badge = document.getElementById(badgeId);
  if (netValue === null) {
    badge.textContent = 'N/A';
    badge.className = 'badge-pill badge-disabled';
  } else {
    const formattedValue = netValue >= 0 ? `+$${netValue.toFixed(2)}` : `-$${Math.abs(netValue).toFixed(2)}`;
    badge.textContent = formattedValue;
    badge.className = netValue >= 0 ? 'badge-pill badge-positive' : 'badge-pill badge-negative';
  }
}

/**
 * Enables or disables a preset button.
 * @param {HTMLElement} button - Button element
 * @param {boolean} enabled - Whether button should be enabled
 */
function setButtonEnabled(button, enabled) {
  if (enabled) {
    button.disabled = false;
    button.classList.remove('btn-disabled');
  } else {
    button.disabled = true;
    button.classList.add('btn-disabled');
  }
}

// Fetch player data from Firestore
db.collection("players").doc(playerName).get()
  .then((doc) => {
    if (doc.exists) {
      const player = doc.data();
      console.log("Player data:", player);

      const statsContainer = document.getElementById("stats-container");
      const nameDiv = document.getElementById("playerInfo")
      nameDiv.innerHTML = `
        <h1>${escapeHTML(playerName)}</h1>
      `
      statsContainer.innerHTML = `
        ${createStatCard('PUTR', Number.isFinite(player.putr) ? player.putr.toFixed(2) : 'UR')}
        ${createStatCard('Net', player.net.toFixed(2))}
        ${createStatCard('Games Played', player.games_played ? player.games_played.length : 0)}
        ${createStatCard('Biggest Win', player.biggest_win ? player.biggest_win.toFixed(2) : '0.00')}
        ${createStatCard('Biggest Loss', player.biggest_loss ? player.biggest_loss.toFixed(2) : '0.00')}
        ${createStatCard('Highest Net', player.highest_net ? player.highest_net.toFixed(2) : '0.00')}
        ${createStatCard('Lowest Net', player.lowest_net ? player.lowest_net.toFixed(2) : '0.00')}
        ${createStatCard('Games Up Most', player.games_up_most || 0)}
        ${createStatCard('Games Down Most', player.games_down_most || 0)}
        ${createStatCard('Games Up', player.games_up || 0)}
        ${createStatCard('Games Down', player.games_down || 0)}
        ${createStatCard('Average Net', player.average_net ? player.average_net.toFixed(2) : '0.00')}
      `;

      const netDictionary = player.net_dictionary;
      const allGames = parseGamesFromNetDictionary(netDictionary);
      
      // Store chart instance globally
      if (typeof window.chartInstance === 'undefined') window.chartInstance = null;
      
      /**
       * Filters and renders the chart for a given subset of games.
       * @param {Array} gamesToDisplay - Array of game objects to display
       */
      function filterAndRenderChart(gamesToDisplay) {
        const dates = gamesToDisplay.map(g => g.dateStr);
        const netValues = gamesToDisplay.map(g => g.net);

        // Calculate the maximum absolute value among netValues for symmetric y-axis
        const maxAbs = netValues.length > 0 ? Math.max(...netValues.map(value => Math.abs(value))) : 1;
        const extraHeadroomFactor = 1.2;
        const adjustedMax = maxAbs * extraHeadroomFactor;
        const niceMax = Math.ceil(adjustedMax / 100) * 100;
        const stepSize = niceMax / 4;

        const data1 = {
          labels: dates,
          datasets: [{
            label: 'Net Winnings Chart',
            data: netValues,
            borderColor: '#888888',
            borderWidth: 2,
            fill: false,
            pointRadius: 2,
            pointBackgroundColor: '#888888',
            pointBorderColor: '#888888',
            pointHoverBackgroundColor: '#888888',
            pointHoverBorderColor: '#888888',
            segment: {
              borderColor: ctx => {
                const { p0, p1 } = ctx;
                if (!p0 || !p1) return 'blue';
                return p1.parsed.y > p0.parsed.y ? '#00FF00' : (p1.parsed.y < p0.parsed.y ? '#FF0000' : 'gray');
              }
            }
          }]
        };

        const config = {
          type: 'line',
          data: data1,
          options: {
            plugins: {
              zoom: {
                pan: { enabled: true, mode: 'x' },
                zoom: {
                  wheel: { enabled: true, speed: 0.0001 },
                  drag: { enabled: true },
                  pinch: { enabled: true },
                  mode: 'x'
                }
              }
            },
            scales: {
              x: {
                title: { display: true, text: 'Date' },
                beginAtZero: true
              },
              y: {
                ...(netValues.length > 0 && netValues[netValues.length - 1] > 0 ? {
                  max: niceMax
                } : netValues.length > 0 && netValues[netValues.length - 1] < 0 ? {
                  min: -niceMax
                } : {
                  min: -niceMax,
                  max: niceMax
                }),
                ticks: { stepSize: stepSize },
                title: { display: true, text: 'Net Winnings ($)' },
                grid: {}
              }
            }
          }
        };

        // Remove old chart if present
        if (window.chartInstance) {
          window.chartInstance.destroy();
        }
        const ctx = document.getElementById('lineChart').getContext('2d');
        window.chartInstance = new Chart(ctx, config);
      }

      // Calculate presets and update badges
      const last5Games = getLastNGames(allGames, 5);
      const last10Games = getLastNGames(allGames, 10);
      const last30Games = getLastNGames(allGames, 30);
      const best5Streak = findBestNGameStreak(allGames, 5);
      
      // Update all badges
      updateBadge('badge-last5', last5Games.length > 0 ? calculateNetChange(last5Games, allGames) : null);
      updateBadge('badge-last10', last10Games.length > 0 ? calculateNetChange(last10Games, allGames) : null);
      updateBadge('badge-last30', last30Games.length > 0 ? calculateNetChange(last30Games, allGames) : null);
      updateBadge('badge-alltime', allGames.length > 0 ? calculateNetChange(allGames, allGames) : null);
      updateBadge('badge-best5', best5Streak ? calculateNetChange(best5Streak, allGames) : null);

      // Set up button states and event handlers
      const rangeBtns = document.querySelectorAll('.range-btn');
      
      /**
       * Highlights the selected button and removes highlight from others.
       * @param {HTMLElement} selectedBtn - Button to highlight
       */
      function highlightBtn(selectedBtn) {
        rangeBtns.forEach(btn => btn.classList.remove('selected'));
        selectedBtn.classList.add('selected');
      }

      // Configure each preset button
      rangeBtns.forEach(btn => {
        const preset = btn.getAttribute('data-preset');
        let enabled = true;
        let gamesToShow = null;

        switch(preset) {
          case 'last5':
            enabled = last5Games.length > 0;
            gamesToShow = last5Games;
            break;
          case 'last10':
            enabled = last10Games.length > 0;
            gamesToShow = last10Games;
            break;
          case 'last30':
            enabled = last30Games.length > 0;
            gamesToShow = last30Games;
            break;
          case 'alltime':
            enabled = allGames.length > 0;
            gamesToShow = allGames;
            break;
          case 'best5':
            enabled = best5Streak !== null;
            gamesToShow = best5Streak;
            break;
        }

        setButtonEnabled(btn, enabled);

        if (enabled) {
          btn.addEventListener('click', () => {
            highlightBtn(btn);
            filterAndRenderChart(gamesToShow);
          });
        }
      });

      // Initial render: All Time (if available)
      const allTimeBtn = document.querySelector('.range-btn[data-preset="alltime"]');
      if (allTimeBtn && !allTimeBtn.disabled) {
        highlightBtn(allTimeBtn);
        filterAndRenderChart(allGames);
      }

    } else {
      // Player not found
      console.log("No player found with name:", playerName);
      document.getElementById("playerInfo").innerHTML = `
        <h1>Player "${escapeHTML(playerName)}" not found</h1>
      `;
      document.getElementById("stats-container").innerHTML = `
        <p>The requested player could not be found in the database.</p>
      `;
    }
  })
  .catch((error) => {
    console.error("Error fetching player data from Firestore:", error);
    document.getElementById("playerInfo").innerHTML = `
      <h1>Error loading player data</h1>
    `;
    document.getElementById("stats-container").innerHTML = `
      <p>There was an error loading the player data. Please try again later.</p>
    `;
  });
