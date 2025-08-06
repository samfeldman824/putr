/**
 * Player Statistics Calculator Module
 * Handles net winnings calculation, player identification, and statistics updates
 */

class PlayerStatsCalculator {
    constructor() {
        // Initialize any required properties
    }

    /**
     * Calculate net winnings for all players by dividing by 100
     * @param {Array<Object>} gameData - Array of player game data from CSV
     * @returns {Array<Object>} - Array of players with calculated net winnings
     */
    calculateNetWinnings(gameData) {
        if (!gameData || !Array.isArray(gameData)) {
            throw new Error('Game data must be a valid array');
        }

        if (gameData.length === 0) {
            throw new Error('Game data cannot be empty');
        }

        return gameData.map(player => {
            if (typeof player.net !== 'number') {
                throw new Error(`Invalid net value for player ${player.player_nickname}: ${player.net}`);
            }

            return {
                ...player,
                netWinnings: player.net / 100 // Convert cents to dollars
            };
        });
    }

    /**
     * Find players with minimum and maximum net winnings
     * @param {Array<Object>} playersWithWinnings - Array of players with calculated net winnings
     * @returns {Object} - Object containing minPlayer and maxPlayer
     */
    findMinMaxPlayers(playersWithWinnings) {
        if (!playersWithWinnings || !Array.isArray(playersWithWinnings)) {
            throw new Error('Players with winnings must be a valid array');
        }

        if (playersWithWinnings.length === 0) {
            throw new Error('Players array cannot be empty');
        }

        let minPlayer = playersWithWinnings[0];
        let maxPlayer = playersWithWinnings[0];

        playersWithWinnings.forEach(player => {
            if (player.netWinnings < minPlayer.netWinnings) {
                minPlayer = player;
            }
            if (player.netWinnings > maxPlayer.netWinnings) {
                maxPlayer = player;
            }
        });

        return {
            minPlayer,
            maxPlayer
        };
    }

    /**
     * Match a player nickname to existing player data using player_nicknames arrays
     * @param {string} nickname - The nickname to match
     * @param {Object} playersData - Object containing all player data from Firebase
     * @returns {string|null} - The matched player key or null if no match found
     */
    matchPlayerByNickname(nickname, playersData) {
        if (!nickname || typeof nickname !== 'string') {
            throw new Error('Nickname must be a valid string');
        }

        if (!playersData || typeof playersData !== 'object') {
            throw new Error('Players data must be a valid object');
        }

        const trimmedNickname = nickname.trim();
        debugManager.log('playerMatching', `Trying to match nickname: "${trimmedNickname}"`);

        // First, try exact match with player keys
        if (playersData[trimmedNickname]) {
            debugManager.log('playerMatching', `Found exact match as player key: "${trimmedNickname}"`);
            return trimmedNickname;
        }

        // Then, search through player_nicknames arrays
        for (const [playerKey, playerData] of Object.entries(playersData)) {
            if (playerData.player_nicknames && Array.isArray(playerData.player_nicknames)) {
                debugManager.log('playerMatching', `Checking player "${playerKey}" with nicknames:`, playerData.player_nicknames);
                
                // Check if nickname exists in the player_nicknames array
                const matchFound = playerData.player_nicknames.some(nick => 
                    nick && typeof nick === 'string' && nick.trim().toLowerCase() === trimmedNickname.toLowerCase()
                );

                if (matchFound) {
                    debugManager.log('playerMatching', `Found match for "${trimmedNickname}" in player "${playerKey}"`);
                    return playerKey;
                }
            } else {
                console.log(`⚠️ Player "${playerKey}" has no player_nicknames array`);
            }
        }

        // No match found - log available players for debugging
        const availablePlayerKeys = Object.keys(playersData);
        const availableNicknames = [];
        
        for (const [playerKey, playerData] of Object.entries(playersData)) {
            if (playerData.player_nicknames && Array.isArray(playerData.player_nicknames)) {
                availableNicknames.push(...playerData.player_nicknames);
            }
        }
        
        debugManager.log('playerMatching', `No match found for "${trimmedNickname}"`);
        debugManager.log('playerMatching', `Available player keys:`, availablePlayerKeys);
        debugManager.log('playerMatching', `Available nicknames:`, availableNicknames);
        
        return null;
    }

    /**
     * Update player statistics with new game data
     * @param {Object} player - Existing player data from Firebase
     * @param {string} nickname - The nickname used in the game (for reference only)
     * @param {number} netWinning - Net winnings for this game (in dollars)
     * @param {string} gameDate - Date of the game (YYYY-MM-DD format)
     * @param {boolean} upMost - Whether this player had the highest winnings
     * @param {boolean} downMost - Whether this player had the lowest winnings
     * @returns {Object} - Updated player statistics
     */
    updatePlayerStats(player, nickname, netWinning, gameDate, upMost, downMost) {
        if (!player || typeof player !== 'object') {
            throw new Error('Player data must be a valid object');
        }

        if (typeof netWinning !== 'number') {
            throw new Error('Net winning must be a valid number');
        }

        if (!gameDate || typeof gameDate !== 'string') {
            throw new Error('Game date must be a valid string');
        }

        // Create a deep copy of the player to avoid mutations
        const updatedPlayer = JSON.parse(JSON.stringify(player));

        // Initialize fields if they don't exist
        if (!updatedPlayer.net) updatedPlayer.net = 0;
        if (!updatedPlayer.games_played) updatedPlayer.games_played = [];
        if (!updatedPlayer.biggest_win) updatedPlayer.biggest_win = 0;
        if (!updatedPlayer.biggest_loss) updatedPlayer.biggest_loss = 0;
        if (!updatedPlayer.highest_net) updatedPlayer.highest_net = 0;
        if (!updatedPlayer.lowest_net) updatedPlayer.lowest_net = 0;
        if (!updatedPlayer.net_dictionary) updatedPlayer.net_dictionary = {};
        if (!updatedPlayer.games_up_most) updatedPlayer.games_up_most = 0;
        if (!updatedPlayer.games_down_most) updatedPlayer.games_down_most = 0;
        if (!updatedPlayer.games_up) updatedPlayer.games_up = 0;
        if (!updatedPlayer.games_down) updatedPlayer.games_down = 0;
        if (!updatedPlayer.average_net) updatedPlayer.average_net = 0;

        // Update net total (rounded to 2 decimal places)
        updatedPlayer.net = Math.round((updatedPlayer.net + netWinning) * 100) / 100;

        // Add game to games_played array if not already present
        if (!updatedPlayer.games_played.includes(gameDate)) {
            updatedPlayer.games_played.push(gameDate);
        }

        // Update biggest win/loss
        if (netWinning > updatedPlayer.biggest_win) {
            updatedPlayer.biggest_win = netWinning;
        }
        if (netWinning < updatedPlayer.biggest_loss) {
            updatedPlayer.biggest_loss = netWinning;
        }

        // Update highest/lowest net (running totals)
        if (updatedPlayer.net > updatedPlayer.highest_net) {
            updatedPlayer.highest_net = updatedPlayer.net;
        }
        if (updatedPlayer.net < updatedPlayer.lowest_net) {
            updatedPlayer.lowest_net = updatedPlayer.net;
        }

        // Update net_dictionary with game date (YY_MM_DD format) and running total
        const dateKey = gameDate.replace(/-/g, '_').substring(2, 10); // Convert YYYY-MM-DD to YY_MM_DD format
        updatedPlayer.net_dictionary[dateKey] = updatedPlayer.net;

        // Update up/down most counters
        if (upMost) {
            updatedPlayer.games_up_most += 1;
        }
        if (downMost) {
            updatedPlayer.games_down_most += 1;
        }

        // Update up/down counters based on positive/negative winnings
        if (netWinning > 0) {
            updatedPlayer.games_up += 1;
        } else if (netWinning < 0) {
            updatedPlayer.games_down += 1;
        }

        // Calculate average net (rounded to 2 decimal places)
        const totalGames = updatedPlayer.games_played.length;
        if (totalGames > 0) {
            updatedPlayer.average_net = Math.round((updatedPlayer.net / totalGames) * 100) / 100;
        }

        return updatedPlayer;
    }

    /**
     * Process complete game data and return updates for all matched players
     * @param {Array<Object>} gameData - Raw game data from CSV
     * @param {Object} playersData - Existing players data from Firebase
     * @param {string} gameDate - Date of the game
     * @returns {Object} - Object containing updates and unmatched players
     */
    processGameData(gameData, playersData, gameDate) {
        try {
            // Calculate net winnings
            const playersWithWinnings = this.calculateNetWinnings(gameData);

            // Find min/max players
            const { minPlayer, maxPlayer } = this.findMinMaxPlayers(playersWithWinnings);

            const playerUpdates = {};
            const unmatchedPlayers = [];

            // Process each player
            playersWithWinnings.forEach(gamePlayer => {
                const matchedPlayerKey = this.matchPlayerByNickname(gamePlayer.player_nickname, playersData);

                if (matchedPlayerKey) {
                    const existingPlayer = playersData[matchedPlayerKey];
                    const isUpMost = gamePlayer.player_nickname === maxPlayer.player_nickname;
                    const isDownMost = gamePlayer.player_nickname === minPlayer.player_nickname;

                    const updatedPlayer = this.updatePlayerStats(
                        existingPlayer,
                        gamePlayer.player_nickname,
                        gamePlayer.netWinnings,
                        gameDate,
                        isUpMost,
                        isDownMost
                    );

                    playerUpdates[matchedPlayerKey] = updatedPlayer;
                } else {
                    unmatchedPlayers.push(gamePlayer.player_nickname);
                }
            });

            return {
                playerUpdates,
                unmatchedPlayers,
                processedCount: playersWithWinnings.length,
                matchedCount: Object.keys(playerUpdates).length
            };

        } catch (error) {
            throw new Error(`Game processing error: ${error.message}`);
        }
    }
}

// Export for use in other modules
window.PlayerStatsCalculator = PlayerStatsCalculator;