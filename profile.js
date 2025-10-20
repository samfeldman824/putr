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

const RANGE_KEYS = {
  LAST_5: 'last-5',
  LAST_10: 'last-10',
  LAST_30: 'last-30',
  ALL_TIME: 'all-time',
  BEST_5_STREAK: 'best-5-streak'
};

/**
 * Convert ledger-style date key (YY_MM_DD) into a Date object.
 * Returns null if the format is invalid.
 * @param {string} dateStr
 * @returns {Date|null}
 */
function parseGameDate(dateStr) {
  const match = dateStr.match(/(\d{2})_(\d{2})_(\d{2})/);
  if (!match) {
    return null;
  }
  const year = 2000 + parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);
  return new Date(year, month, day);
}

/**
 * Sort net dictionary entries by date ascending.
 * @param {Record<string, number>} netDictionary
 * @returns {Array<{ key: string, date: Date, net: number }>}
 */
function getSortedNetEntries(netDictionary) {
  return Object.entries(netDictionary)
    .map(([key, net]) => ({ key, date: parseGameDate(key), net }))
    .filter((entry) => entry.date instanceof Date && !Number.isNaN(entry.date.getTime()))
    .sort((a, b) => a.date - b.date);
}

/**
 * Determine the best contiguous streak of exactly five games by cumulative net change.
 * Ties break by the most recent streak.
 * @param {Array<{ key: string, date: Date, net: number }>} entries
 * @param {number} size
 * @returns {{ startDate: Date, endDate: Date, startIndex: number }|null}
 */
function findBestStreak(entries, size = 5) {
  if (entries.length < size) {
    return null;
  }

  let bestSum = Number.NEGATIVE_INFINITY;
  let bestStartIndex = null;

  for (let i = 0; i <= entries.length - size; i += 1) {
    const startNet = i === 0 ? 0 : entries[i - 1].net;
    const endNet = entries[i + size - 1].net;
    const streakSum = endNet - startNet;

    if (streakSum > bestSum || (streakSum === bestSum && i > (bestStartIndex === null ? -1 : bestStartIndex))) {
      bestSum = streakSum;
      bestStartIndex = i;
    }
  }

  if (bestStartIndex === null) {
    return null;
  }

  return {
    startDate: entries[bestStartIndex].date,
    endDate: entries[bestStartIndex + size - 1].date,
    startIndex: bestStartIndex
  };
}

/**
 * Compute the date range covering the last N games.
 * @param {Array<{ key: string, date: Date, net: number }>} entries
 * @param {number} count
 * @returns {{ startDate: Date, endDate: Date }|null}
 */
function computeLastNGamesRange(entries, count) {
  if (!Number.isFinite(count) || count <= 0 || entries.length === 0) {
    return null;
  }

  const startIndex = Math.max(entries.length - count, 0);
  const startDate = entries[startIndex].date;
  const endDate = entries[entries.length - 1].date;
  return { startDate, endDate };
}

/**
 * Compute metrics for a given range.
 * @param {Array<{ key: string, date: Date, net: number }>} entries
 * @param {{ startDate: Date, endDate: Date }} range
 * @returns {{ delta: number|null, record: { up: number, down: number }, milestone: string|null }}
 */
function computeRangeMetrics(entries, range) {
  if (!range) {
    return {
      delta: null,
      record: { up: 0, down: 0 },
      milestone: null
    };
  }

  let rangeStartIndex = entries.findIndex((entry) => entry.date >= range.startDate);
  if (rangeStartIndex === -1) {
    rangeStartIndex = 0;
  }
  let rangeEndIndex = entries.findIndex((entry) => entry.date > range.endDate);
  rangeEndIndex = rangeEndIndex === -1 ? entries.length - 1 : rangeEndIndex - 1;

  if (rangeEndIndex < rangeStartIndex) {
    return {
      delta: null,
      record: { up: 0, down: 0 },
      milestone: null
    };
  }

  const startNet = rangeStartIndex === 0 ? 0 : entries[rangeStartIndex - 1].net;
  const endNet = entries[rangeEndIndex].net;
  const delta = endNet - startNet;

  let wins = 0;
  let losses = 0;
  let biggestWin = { amount: Number.NEGATIVE_INFINITY, key: null };
  let biggestLoss = { amount: Number.POSITIVE_INFINITY, key: null };

  for (let i = rangeStartIndex; i <= rangeEndIndex; i += 1) {
    const current = entries[i];
    const previous = i === 0 ? 0 : entries[i - 1].net;
    const change = current.net - previous;
    if (change >= 0) {
      wins += 1;
      if (change > biggestWin.amount) {
        biggestWin = { amount: change, key: current.key };
      }
    } else {
      losses += 1;
      if (change < biggestLoss.amount) {
        biggestLoss = { amount: change, key: current.key };
      }
    }
  }

  let milestone = null;
  if (biggestWin.amount !== Number.NEGATIVE_INFINITY) {
    milestone = `Win ${biggestWin.amount.toFixed(2)} on ${biggestWin.key}`;
  } else if (biggestLoss.amount !== Number.POSITIVE_INFINITY) {
    milestone = `Loss ${Math.abs(biggestLoss.amount).toFixed(2)} on ${biggestLoss.key}`;
  }

  return {
    delta,
    record: { up: wins, down: losses },
    milestone
  };
}

function formatDelta(delta) {
  if (delta === null) {
    return 'Net: —';
  }
  return `Net: ${delta >= 0 ? '+' : ''}${delta.toFixed(2)}`;
}

function getMetricClass(delta) {
  if (delta === null) {
    return 'neutral';
  }
  if (delta > 0) {
    return 'positive';
  }
  if (delta < 0) {
    return 'negative';
  }
  return 'neutral';
}

// Fetch player data from Firestore
db.collection("players").doc(playerName).get()
  .then((doc) => {
    if (doc.exists) {
      const player = doc.data();
      console.log("Player data:", player);

      const statsContainer = document.getElementById("stats-container");
      const nameDiv = document.getElementById("playerInfo");
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
      const sortedEntries = getSortedNetEntries(netDictionary);
      const rangeBtnNodes = Array.from(document.querySelectorAll('.range-btn'));
      function updateMetric(displayRange, key) {
        const optionNode = document.querySelector(`.range-option[data-range-key="${key}"]`);
        if (!optionNode) {
          return;
        }
        const metricNode = optionNode.querySelector('.range-metric');
        if (!metricNode) {
          return;
        }
        metricNode.classList.remove('positive', 'negative', 'neutral');
        if (!displayRange) {
          metricNode.textContent = '';
          metricNode.classList.add('neutral');
          return;
        }
        const metrics = computeRangeMetrics(sortedEntries, displayRange);
        metricNode.textContent = formatDelta(metrics.delta);
        metricNode.classList.add(getMetricClass(metrics.delta));
      }

      // Chart filtering logic
      if (typeof window.chartInstance === 'undefined') window.chartInstance = null;
      function filterAndRenderChart(startDate, endDate) {
        const filteredDates = [];
        const filteredNetValues = [];
        sortedEntries.forEach((entry) => {
          if (entry.date >= startDate && entry.date <= endDate) {
            filteredDates.push(entry.key);
            filteredNetValues.push(entry.net);
          }
        });
        const dates = filteredDates;
        const netValues = filteredNetValues;

        // Calculate the maximum absolute value among netValues for symmetric y-axis
        const maxAbs = netValues.length > 0 ? Math.max(...netValues.map(value => Math.abs(value))) : 1;
        const extraHeadroomFactor = 1.2;
        const adjustedMax = maxAbs * extraHeadroomFactor;
        const niceMax = Math.ceil(adjustedMax / 100) * 100;
        const stepSize = niceMax / 4;

        // WCAG AA compliant color palette for accessibility
        const accessibleColors = {
          positive: '#2E7D32',  // Dark green - WCAG AA compliant
          negative: '#C62828',  // Dark red - WCAG AA compliant
          neutral: '#5C6BC0',   // Blue - WCAG AA compliant
          line: '#616161'       // Dark gray - WCAG AA compliant
        };

        const data1 = {
          labels: dates,
          datasets: [{
            label: 'Cumulative Net Winnings ($)',
            data: netValues,
            borderColor: accessibleColors.line,
            borderWidth: 2.5,
            fill: false,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: accessibleColors.line,
            pointBorderColor: accessibleColors.line,
            pointHoverBackgroundColor: accessibleColors.neutral,
            pointHoverBorderColor: accessibleColors.neutral,
            pointBorderWidth: 2,
            segment: {
              borderColor: ctx => {
                const { p0, p1 } = ctx;
                if (!p0 || !p1) return accessibleColors.neutral;
                return p1.parsed.y > p0.parsed.y ? accessibleColors.positive : 
                       (p1.parsed.y < p0.parsed.y ? accessibleColors.negative : accessibleColors.neutral);
              },
              borderWidth: 2.5
            }
          }]
        };

        // Determine theme for chart colors
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const gridColor = isDark ? '#444' : '#ddd';
        const textColor = isDark ? '#e0e0e0' : '#333';

        const config = {
          type: 'line',
          data: data1,
          options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: window.innerWidth < 768 ? 1.2 : window.innerWidth < 1024 ? 1.8 : 2.5,
            plugins: {
              zoom: {
                pan: { enabled: true, mode: 'x' },
                zoom: {
                  wheel: { enabled: true, speed: 0.0001 },
                  drag: { enabled: true },
                  pinch: { enabled: true },
                  mode: 'x'
                }
              },
              legend: {
                display: true,
                position: 'top',
                labels: {
                  color: textColor,
                  font: {
                    size: window.innerWidth < 768 ? 11 : 13,
                    weight: '500'
                  },
                  padding: window.innerWidth < 768 ? 10 : 15,
                  usePointStyle: true,
                  pointStyle: 'line'
                }
              },
              tooltip: {
                enabled: true,
                mode: 'index',
                intersect: false,
                backgroundColor: isDark ? 'rgba(42, 42, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                titleColor: isDark ? '#e0e0e0' : '#333',
                bodyColor: isDark ? '#e0e0e0' : '#333',
                borderColor: isDark ? '#666' : '#ddd',
                borderWidth: 1,
                padding: 12,
                displayColors: true,
                callbacks: {
                  title: function(tooltipItems) {
                    return 'Game: ' + tooltipItems[0].label;
                  },
                  label: function(context) {
                    const value = context.parsed.y;
                    const index = context.dataIndex;
                    const prevValue = index > 0 ? netValues[index - 1] : 0;
                    const change = value - prevValue;
                    const changeStr = change >= 0 ? `+$${change.toFixed(2)}` : `-$${Math.abs(change).toFixed(2)}`;
                    
                    return [
                      `Net Total: $${value.toFixed(2)}`,
                      `Game Change: ${changeStr}`
                    ];
                  },
                  footer: function(tooltipItems) {
                    const index = tooltipItems[0].dataIndex;
                    const totalGames = netValues.length;
                    return `Game ${index + 1} of ${totalGames}`;
                  }
                }
              }
            },
            interaction: {
              mode: 'nearest',
              axis: 'x',
              intersect: false
            },
            scales: {
              x: {
                title: { 
                  display: true, 
                  text: 'Game Date (YY_MM_DD)',
                  color: textColor,
                  font: {
                    size: window.innerWidth < 768 ? 11 : 13,
                    weight: '500'
                  }
                },
                ticks: {
                  color: textColor,
                  font: {
                    size: window.innerWidth < 768 ? 9 : 11
                  },
                  maxRotation: window.innerWidth < 768 ? 45 : 45,
                  minRotation: window.innerWidth < 768 ? 45 : 0,
                  autoSkip: true,
                  maxTicksLimit: window.innerWidth < 768 ? 6 : window.innerWidth < 1024 ? 10 : 15
                },
                grid: {
                  color: gridColor,
                  display: true
                },
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
                ticks: { 
                  stepSize: stepSize,
                  color: textColor,
                  font: {
                    size: window.innerWidth < 768 ? 10 : 12
                  },
                  callback: function(value) {
                    return '$' + value.toFixed(0);
                  }
                },
                title: { 
                  display: true, 
                  text: 'Cumulative Net Winnings ($)',
                  color: textColor,
                  font: {
                    size: window.innerWidth < 768 ? 11 : 13,
                    weight: '500'
                  }
                },
                grid: {
                  color: gridColor,
                  display: true,
                  drawTicks: true
                }
              }
            }
          }
        };

        // Remove old chart if present
        if (window.playerChart) {
          window.playerChart.destroy();
        }
        const ctx = document.getElementById('lineChart').getContext('2d');
        window.playerChart = new Chart(ctx, config);
      }

      // Set up date pickers and initial range (all dates)
      const allGameDates = sortedEntries.map((entry) => entry.date);
      const minDate = allGameDates.length > 0 ? allGameDates[0] : new Date();
      const maxDate = allGameDates.length > 0 ? allGameDates[allGameDates.length - 1] : new Date();
      const rangeBtns = document.querySelectorAll('.range-btn');

      // Helper to highlight selected button
      function highlightBtn(btn) {
        rangeBtns.forEach((b) => b.classList.remove('selected'));
        if (btn) {
          btn.classList.add('selected');
        }
      }

      function getRangeForKey(rangeKey) {
        switch (rangeKey) {
          case RANGE_KEYS.LAST_5:
            return computeLastNGamesRange(sortedEntries, 5);
          case RANGE_KEYS.LAST_10:
            return computeLastNGamesRange(sortedEntries, 10);
          case RANGE_KEYS.LAST_30:
            return computeLastNGamesRange(sortedEntries, 30);
          case RANGE_KEYS.ALL_TIME:
            return { startDate: minDate, endDate: maxDate };
          case RANGE_KEYS.BEST_5_STREAK:
            return findBestStreak(sortedEntries, 5);
          default:
            return null;
        }
      }

      rangeBtnNodes.forEach((button) => {
        const rangeKey = button.getAttribute('data-range-key');
        const range = getRangeForKey(rangeKey);
        if (!range) {
          button.disabled = true;
          button.classList.add('disabled');
          updateMetric(null, rangeKey);
          return;
        }
        updateMetric(range, rangeKey);

        button.addEventListener('click', () => {
          const computedRange = getRangeForKey(rangeKey);
          if (!computedRange) {
            return;
          }
          highlightBtn(button);
          filterAndRenderChart(computedRange.startDate, computedRange.endDate);
          updateMetric(computedRange, rangeKey);
        });
      });

      // Initial render: All time if available
      const defaultBtn = document.querySelector(`.range-btn[data-range-key="${RANGE_KEYS.ALL_TIME}"]`);
      const defaultRange = getRangeForKey(RANGE_KEYS.ALL_TIME);
      if (defaultRange) {
        highlightBtn(defaultBtn);
        filterAndRenderChart(defaultRange.startDate, defaultRange.endDate);
        updateMetric(defaultRange, RANGE_KEYS.ALL_TIME);
      }

      // Handle window resize for responsive chart updates
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          if (window.playerChart) {
            // Get current selected range
            const selectedBtn = document.querySelector('.range-btn.selected');
            if (selectedBtn) {
              const rangeKey = selectedBtn.getAttribute('data-range-key');
              const currentRange = getRangeForKey(rangeKey);
              if (currentRange) {
                filterAndRenderChart(currentRange.startDate, currentRange.endDate);
              }
            }
          }
        }, 250);
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
