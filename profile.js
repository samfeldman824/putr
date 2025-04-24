const urlParams = new URLSearchParams(window.location.search);
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
        <h1>${playerName}</h1>
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

      const netDictionary = player.net_dictionary;
      const dates = Object.keys(netDictionary);
      const netValues = Object.values(netDictionary);


      // Data for the line chart
      const data1 = {
        labels: dates,
        datasets: [{
          label: 'Net Winnings Chart',
          data: netValues,
          borderColor: 'blue',
          borderWidth: 2,
          fill: false
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
                wheel: { enabled: true },
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
                text: 'Date'
              },
              beginAtZero: true
            },

            y: {
              title: {
                display: true,
                text: 'Net Winnings ($)'
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
