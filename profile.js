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
                const profileDiv = document.getElementById("playerProfile");
                profileDiv.innerHTML = `
                        <h2>${player.name}</h2>
                        <p>PUTR: ${player.putr.toFixed(2)}</p>
                        <p>Net: ${player.net.toFixed(2)}</p>
                        <p>Games Played: ${player.games_played.length}</p>
                        
                    `;
            }

            })