const urlParams = new URLSearchParams(window.location.search);
        const playerID = urlParams.get('playerID');
        console.log("player id is",playerID)

        fetch("data.json")
            .then(response => response.json())
            .then(data => {

            // Find the player by ID
            const player = data.find(player => player.id === parseInt(playerID));
            console.log(player)

            if (player) {
                const profileStats = document.getElementById("playerStats");
                const nameDiv = document.getElementById("playerInfo")
                nameDiv.innerHTML = `
              <h1>${player.name}</h1>
              `  
                profileStats.innerHTML = `
                        <p>PUTR: ${player.putr.toFixed(2)}</p>
                        <p>Net: ${player.net.toFixed(2)}</p>
                        <p>Games Played: ${player.games_played.length}</p>
                        <p>Biggest Win: ${player.biggest_win.toFixed(2)}</p>
                        <p>Biggest Loss: ${player.biggest_loss.toFixed(2)}</p>
                        
                    `;
            }

            })