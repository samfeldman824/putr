/**
 * profile.js
 * ----------
 * Renders player statistics and interactive charts on the profile page.
 * Player data is loaded from `data.json`.
 */
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
// console.log("player id is",playerID)
const createStatCard = (label, value) => `
<div class="stat-card">
  <div class="stat-value">${value}</div>
  <div class="stat-label">${label}</div>
</div>
`;
fetch("data.json")
  .then(response => response.json())
  .then(data => {
    // Find the player by ID
    const player = data[playerName];
    // console.log(player)

    if (player) {
      const statsContainer = document.getElementById("stats-container");
      const nameDiv = document.getElementById("playerInfo")
      nameDiv.innerHTML = `
        <h1>${escapeHTML(playerName)}</h1>
      `  
      statsContainer.innerHTML = `
        ${createStatCard('PUTR', player.putr.toFixed(2))}
        ${createStatCard('Net', player.net.toFixed(2))}
        ${createStatCard('Games Played', player.games_played.length)}
        ${createStatCard('Biggest Win', player.biggest_win.toFixed(2))}
        ${createStatCard('Biggest Loss', player.biggest_loss.toFixed(2))}
        ${createStatCard('Highest Net', player.highest_net.toFixed(2))}
        ${createStatCard('Lowest Net', player.lowest_net.toFixed(2))}
        ${createStatCard('Games Up Most', player.games_up_most)}
        ${createStatCard('Games Down Most', player.games_down_most)}
        ${createStatCard('Games Up', player.games_up)}
        ${createStatCard('Games Down', player.games_down)}
        ${createStatCard('Average Net', player.average_net.toFixed(2))}
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

     // Calculate the maximum absolute value among netValues for symmetric y-axis
     // (moved inside filterAndRenderChart)



      // Data for the line chart
      const data1 = {
        labels: dates,
        datasets: [{
          label: 'Net Winnings Chart',
          data: netValues,
          borderColor: '#888888',
          borderWidth: 2,
          fill: false,
          pointRadius: 2, // Gray dots
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

      // Configuration for the chart
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
              title: {
                display: true,
                text: 'Date',
              },
              beginAtZero: true
            },
            y: {
              // Dynamically set min/max depending on last data point
              ...(netValues.length > 0 && netValues[netValues.length - 1] > 0 ? {
                max: niceMax
              } : netValues.length > 0 && netValues[netValues.length - 1] < 0 ? {
                min: -niceMax
              } : {
                min: -niceMax,
                max: niceMax
              }),
              ticks: {
                stepSize: stepSize
              },
              title: {
                display: true,
                text: 'Net Winnings ($)'
              },
              grid: {
                lineWidth: function(context) {
                  return context.tick.value === 0 ? 3 : 1;
                }
              },
              beginAtZero: true
            },
          }
        }
      };


      // Create the chart
      const ctx = document.getElementById('lineChart').getContext('2d');
      const chartInstance = new Chart(ctx, config);

    }
  })
