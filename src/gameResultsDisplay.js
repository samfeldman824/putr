/**
 * Game Results Display Module
 * Handles displaying game results after successful CSV upload
 * Shows player names and net amounts in a modal dialog
 */

class GameResultsDisplay {
    constructor() {
        this.currentModal = null;
        this.isDisplaying = false;
        this.escapeHandler = null; // Reference to escape key event handler for proper cleanup

        debugManager.log('gameResults', 'GameResultsDisplay initialized');
    }

    /**
     * Display game results in a modal dialog
     * @param {Object} gameData - Game data containing players and their net amounts
     * @param {string} gameDate - Date of the game (YYYY-MM-DD format)
     * @returns {Promise<void>}
     */
    async showGameResults(gameData, gameDate) {
        try {
            debugManager.log('gameResults', `Displaying results for game: ${gameDate}`);

            // Add explicit cleanup call before creating new modal when isDisplaying is true
            if (this.isDisplaying) {
                console.warn('⚠️ Results already being displayed, dismissing current modal');
                // Ensure previous escape handlers are cleaned up before setting up new ones
                this.dismissResults();
                
                // Wait for cleanup to complete before proceeding
                await new Promise(resolve => setTimeout(resolve, 0));
            }

            // Format and sort player results
            const formattedResults = this.formatPlayerResults(gameData);
            const sortedResults = this.sortPlayersByNet(formattedResults);

            // Create modal content
            const modalContent = this.createModalContent(sortedResults, gameDate);

            // Create and show modal
            this.currentModal = this.createResultsModal(modalContent);
            this.isDisplaying = true;

            // Add event listeners for modal interaction
            this.setupModalEventListeners();

            debugManager.log('gameResults', `Game results displayed for ${sortedResults.length} players`);

        } catch (error) {
            console.error('❌ Failed to display game results:', error);
            throw new Error(`Failed to display game results: ${error.message}`);
        }
    }

    /**
     * Format player results for display
     * @param {Object} gameData - Raw game data from CSV processing
     * @returns {Array<Object>} Formatted player results
     */
    formatPlayerResults(gameData) {
        if (!gameData || !gameData.players) {
            throw new Error('Invalid game data provided');
        }

        if (!Array.isArray(gameData.players) || gameData.players.length === 0) {
            throw new Error('Game data must contain at least one player');
        }

        // Combine entries with the same nickname
        const playerMap = new Map();

        gameData.players.forEach(player => {
            const nickname = player.player_nickname || 'Unknown Player';
            const netAmount = player.net || 0;

            if (playerMap.has(nickname)) {
                // Add to existing player's net amount
                const existingPlayer = playerMap.get(nickname);
                existingPlayer.rawNet += netAmount;
                existingPlayer.netAmount = existingPlayer.rawNet / 100;
                existingPlayer.formattedNet = this.formatCurrency(existingPlayer.netAmount);
            } else {
                // Create new player entry
                playerMap.set(nickname, {
                    nickname: nickname,
                    netAmount: netAmount / 100, // Convert from cents to dollars
                    formattedNet: this.formatCurrency(netAmount / 100),
                    rawNet: netAmount // Keep original for sorting accuracy
                });
            }
        });

        // Convert map to array
        return Array.from(playerMap.values());
    }

    /**
     * Sort players by net amount in descending order (highest to lowest)
     * @param {Array<Object>} players - Array of player objects with net amounts
     * @returns {Array<Object>} Sorted array of players
     */
    sortPlayersByNet(players) {
        return players.sort((a, b) => {
            // Sort by raw net amount for accuracy, then by nickname for ties
            if (b.rawNet !== a.rawNet) {
                return b.rawNet - a.rawNet;
            }
            return a.nickname.localeCompare(b.nickname);
        });
    }

    /**
     * Format a number as currency
     * @param {number} amount - Amount in dollars
     * @returns {string} Formatted currency string
     */
    formatCurrency(amount) {
        const absAmount = Math.abs(amount);
        const formatted = absAmount.toFixed(2);

        if (amount >= 0) {
            return `$${formatted}`;
        } else {
            return `-$${formatted}`;
        }
    }

    /**
     * Create the HTML content for the modal
     * @param {Array<Object>} sortedResults - Sorted player results
     * @param {string} gameDate - Game date
     * @returns {string} HTML content for the modal
     */
    createModalContent(sortedResults, gameDate) {
        const totalPlayers = sortedResults.length;
        const biggestWinner = sortedResults[0];
        const biggestLoser = sortedResults[sortedResults.length - 1];

        // Format date for display
        const displayDate = this.formatDateForDisplay(gameDate);

        let playersHtml = '';
        sortedResults.forEach((player, index) => {
            const rankClass = index === 0 ? 'winner' :
                index === sortedResults.length - 1 ? 'loser' :
                    'neutral';

            const rankIcon = index === 0 ? '🏆' :
                index === sortedResults.length - 1 ? '💸' :
                    '🎯';

            playersHtml += `
                <div class="result-row ${rankClass}">
                    <div class="result-bar ${player.netAmount >= 0 ? 'positive-bar' : 'negative-bar'}"></div>
                    <span class="rank-icon">${rankIcon}</span>
                    <span class="player-name">${this.escapeHtml(player.nickname)}</span>
                    <span class="net-amount ${player.netAmount >= 0 ? 'positive' : 'negative'}">
                        ${player.formattedNet}
                    </span>
                </div>
            `;
        });

        return `
            <div class="game-results-header">
                <h2>Game Results</h2>
                <div class="game-info">
                    <span class="game-date">${displayDate}</span>
                    <span class="player-count">${totalPlayers} players</span>
                </div>
            </div>
            
            <div class="game-summary">
                <div class="summary-item winner-summary">
                    <span class="summary-label">Biggest Winner:</span>
                    <span class="summary-value">
                        ${this.escapeHtml(biggestWinner.nickname)} 
                        (${biggestWinner.formattedNet})
                    </span>
                </div>
                <div class="summary-item loser-summary">
                    <span class="summary-label">Biggest Loser:</span>
                    <span class="summary-value">
                        ${this.escapeHtml(biggestLoser.nickname)} 
                        (${biggestLoser.formattedNet})
                    </span>
                </div>
            </div>

            <div class="results-container">
                <div class="results-header">
                    <span class="header-bar"></span>
                    <span class="header-rank">Rank</span>
                    <span class="header-player">Player</span>
                    <span class="header-net">Net Amount</span>
                </div>
                <div class="results-list">
                    ${playersHtml}
                </div>
            </div>

            <div class="modal-actions">
                <button class="close-results-btn" id="close-results-btn">Close</button>
            </div>
        `;
    }

    /**
     * Create and display the results modal
     * @param {string} content - HTML content for the modal
     * @returns {HTMLElement} The created modal element
     */
    createResultsModal(content) {
        // Remove any existing modal
        this.dismissResults();

        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'results-modal-overlay';
        overlay.id = 'results-modal-overlay';

        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'results-modal';
        modal.id = 'results-modal';
        modal.innerHTML = content;

        // Add modal to overlay
        overlay.appendChild(modal);

        // Add to document
        document.body.appendChild(overlay);

        // Trigger animation
        requestAnimationFrame(() => {
            overlay.classList.add('show');
        });

        return overlay;
    }

    /**
     * Set up event listeners for modal interaction
     */
    setupModalEventListeners() {
        if (!this.currentModal) return;

        // Close button
        const closeBtn = this.currentModal.querySelector('#close-results-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.dismissResults());
        }

        // Click outside modal to close
        this.currentModal.addEventListener('click', (event) => {
            if (event.target === this.currentModal) {
                this.dismissResults();
            }
        });

        // Create escape handler function and store it in this.escapeHandler
        this.escapeHandler = (event) => {
            if (event.key === 'Escape' && this.isDisplaying) {
                this.dismissResults();
            }
        };
        
        // Add the stored handler to document keydown event listener
        document.addEventListener('keydown', this.escapeHandler);
    }

    /**
     * Dismiss the results modal
     */
    dismissResults() {
        // Clean up escape handler at the beginning
        if (this.escapeHandler) {
            try {
                document.removeEventListener('keydown', this.escapeHandler);
            } catch (error) {
                console.warn('Could not remove escape handler:', error);
            }
            this.escapeHandler = null;
        }

        if (!this.currentModal || !this.isDisplaying) {
            return;
        }

        try {
            // Add closing animation
            this.currentModal.classList.add('closing');

            // Remove after animation
            setTimeout(() => {
                if (this.currentModal && this.currentModal.parentNode) {
                    this.currentModal.parentNode.removeChild(this.currentModal);
                }
                this.currentModal = null;
                this.isDisplaying = false;
            }, 300); // Match CSS animation duration

            debugManager.log('gameResults', 'Game results modal dismissed');

        } catch (error) {
            console.error('❌ Error dismissing results modal:', error);
            // Force cleanup
            this.currentModal = null;
            this.isDisplaying = false;
        }
    }

    /**
     * Format date for display
     * @param {string} gameDate - Date in YYYY-MM-DD format
     * @returns {string} Formatted date string
     */
    formatDateForDisplay(gameDate) {
        try {
            const date = new Date(gameDate + 'T00:00:00');
            if (isNaN(date.getTime())) {
                return gameDate; // Return original if invalid
            }
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            console.warn('⚠️ Could not format date:', gameDate);
            return gameDate;
        }
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        if (!text) return '';

        // Use DOM method if available, otherwise fallback to manual escaping
        try {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        } catch (error) {
            // Fallback manual escaping for environments without proper DOM
            return String(text)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;');
        }
    }

    /**
     * Check if results are currently being displayed
     * @returns {boolean} True if results modal is active
     */
    isResultsDisplayed() {
        return this.isDisplaying;
    }

    /**
     * Get information about the current results display
     * @returns {Object|null} Display information or null if not displaying
     */
    getDisplayInfo() {
        if (!this.isDisplaying || !this.currentModal) {
            return null;
        }

        return {
            isDisplaying: this.isDisplaying,
            modalExists: !!this.currentModal,
            modalId: this.currentModal.id
        };
    }

    /**
     * Test the display functionality with sample data
     * @returns {Promise<boolean>} True if test passes
     */
    async testDisplay() {
        try {
            const testData = {
                players: [
                    { player_nickname: 'Alice', net: 2550 },
                    { player_nickname: 'Bob', net: -1275 },
                    { player_nickname: 'Charlie', net: 750 }
                ]
            };

            await this.showGameResults(testData, '2023-10-15');

            // Auto-dismiss after 2 seconds for testing
            setTimeout(() => this.dismissResults(), 2000);

            return true;
        } catch (error) {
            console.error('❌ Display test failed:', error);
            return false;
        }
    }
}

// Export for use in other modules
window.GameResultsDisplay = GameResultsDisplay;