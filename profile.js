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

      // const player = data[playerName];
      const netDictionary = player.net_dictionary;
      // Chart filtering logic
      if (typeof window.chartInstance === 'undefined') window.chartInstance = null;
      function filterAndRenderChart(startDate, endDate) {
        const filteredDates = [];
        const filteredNetValues = [];
        for (const dateStr of Object.keys(netDictionary)) {
          const match = dateStr.match(/(\d{2})_(\d{2})_(\d{2})/);
          if (match) {
            const year = 2000 + parseInt(match[1], 10);
            const month = parseInt(match[2], 10) - 1;
            const day = parseInt(match[3], 10);
            const gameDate = new Date(year, month, day);
            if (gameDate >= startDate && gameDate <= endDate) {
              filteredDates.push(dateStr);
              filteredNetValues.push(netDictionary[dateStr]);
            }
          }
        }
        const dates = filteredDates;
        const netValues = filteredNetValues;

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

      // Set up date pickers and initial range (all dates)
      const allGameDates = Object.keys(netDictionary)
        .map(dateStr => {
          const match = dateStr.match(/(\d{2})_(\d{2})_(\d{2})/);
          if (match) {
            const year = 2000 + parseInt(match[1], 10);
            const month = parseInt(match[2], 10) - 1;
            const day = parseInt(match[3], 10);
            return new Date(year, month, day);
          }
          return null;
        })
        .filter(Boolean)
        .sort((a, b) => a - b);
      const minDate = allGameDates.length > 0 ? allGameDates[0] : new Date();
      const maxDate = allGameDates.length > 0 ? allGameDates[allGameDates.length - 1] : new Date();
      const startInput = document.getElementById('start-date');
      const endInput = document.getElementById('end-date');
      const rangeBtns = document.querySelectorAll('.range-btn');
      const customInputs = document.getElementById('custom-date-inputs');
      function formatDateForInput(date) {
        return date.toISOString().split('T')[0];
      }
      startInput.value = formatDateForInput(minDate);
      endInput.value = formatDateForInput(maxDate);

      // Helper to highlight selected button
      function highlightBtn(btn) {
        rangeBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      }

      // Range button logic
      rangeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          highlightBtn(btn);
          const range = btn.getAttribute('data-range');
          if (range === 'custom') {
            customInputs.style.display = '';
          } else {
            customInputs.style.display = 'none';
            let start, end;
            end = maxDate;
            if (range === 'all') {
              start = minDate;
            } else {
              start = new Date(maxDate.getTime() - (parseInt(range) * 24 * 60 * 60 * 1000));
              if (start < minDate) start = minDate;
            }
            startInput.value = formatDateForInput(start);
            endInput.value = formatDateForInput(end);
            filterAndRenderChart(start, end);
          }
        });
      });

      // Initial render: All
      highlightBtn(document.querySelector('.range-btn[data-range="all"]'));
      customInputs.style.display = 'none';
      filterAndRenderChart(minDate, maxDate);

      // Apply button for custom
      document.getElementById('apply-date-filter').addEventListener('click', () => {
        const start = new Date(startInput.value);
        const end = new Date(endInput.value);
        filterAndRenderChart(start, end);
      });

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
