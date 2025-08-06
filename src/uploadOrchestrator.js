/**
 * Upload Orchestrator Module
 * Main coordinator for the CSV upload workflow
 * Integrates all components and handles the complete end-to-end process
 */

class UploadOrchestrator {
    constructor() {
        this.csvProcessor = null;
        this.playerStatsCalculator = null;
        this.databaseManager = null;
        this.undoManager = null;
        this.uploadInterface = null;
        this.gameResultsDisplay = null;
        
        this.isInitialized = false;
        this.uploadedGames = new Set(); // Track uploaded games to prevent duplicates
        
        // Initialize error handler
        this.errorHandler = new ErrorHandler();
        
        console.log('🎯 UploadOrchestrator created with enhanced error handling');
    }

    /**
     * Initialize the orchestrator with all required components
     * @param {Object} components - Object containing all component instances
     */
    initialize(components = {}) {
        try {
            // Initialize components
            this.csvProcessor = components.csvProcessor || new CSVProcessor();
            this.playerStatsCalculator = components.playerStatsCalculator || new PlayerStatsCalculator();
            this.databaseManager = components.databaseManager || new DatabaseManager();
            this.undoManager = components.undoManager || new UndoManager();
            this.uploadInterface = components.uploadInterface || new UploadInterface();
            this.gameResultsDisplay = components.gameResultsDisplay || new GameResultsDisplay();

            // Validate all components are available
            this.validateComponents();

            // Initialize upload interface
            this.uploadInterface.initialize();
            
            // Set up file selection callback
            this.uploadInterface.setFileSelectedCallback((file) => {
                this.handleFileUpload(file);
            });

            // Load previously uploaded games from storage
            this.loadUploadedGamesHistory();

            this.isInitialized = true;
            console.log('✅ UploadOrchestrator initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize UploadOrchestrator:', error);
            throw new Error(`Initialization failed: ${error.message}`);
        }
    }

    /**
     * Validate that all required components are available
     */
    validateComponents() {
        const requiredComponents = [
            { name: 'csvProcessor', instance: this.csvProcessor },
            { name: 'playerStatsCalculator', instance: this.playerStatsCalculator },
            { name: 'databaseManager', instance: this.databaseManager },
            { name: 'undoManager', instance: this.undoManager },
            { name: 'uploadInterface', instance: this.uploadInterface },
            { name: 'gameResultsDisplay', instance: this.gameResultsDisplay }
        ];

        for (const component of requiredComponents) {
            if (!component.instance) {
                throw new Error(`${component.name} is required but not provided`);
            }
        }

        // Validate Firebase setup
        this.databaseManager.validateFirebaseSetup();
    }

    /**
     * Main file upload handler - orchestrates the complete workflow
     * @param {File} file - The CSV file to process
     */
    async handleFileUpload(file) {
        if (!this.isInitialized) {
            throw new Error('UploadOrchestrator not initialized');
        }

        let gameDate = null;
        let playerUpdates = {};
        let affectedPlayerKeys = [];

        try {
            console.log(`🚀 Starting upload process for: ${file.name}`);
            
            // Step 1: Parse and validate CSV file
            this.uploadInterface.showProcessingStep(1, 6, 'Parsing CSV file...');
            const csvData = await this.csvProcessor.parseCSVFile(file);
            gameDate = csvData.gameDate;

            console.log(`📅 Game date: ${gameDate}, Players: ${csvData.playerCount}`);

            // Step 2: Fetch existing player data
            this.uploadInterface.showProcessingStep(2, 5, 'Fetching player data...');
            const existingPlayers = await this.databaseManager.fetchAllPlayers();

            // Step 3: Process game data and calculate statistics
            this.uploadInterface.showProcessingStep(3, 5, 'Calculating statistics...');
            const gameResults = this.playerStatsCalculator.processGameData(
                csvData.players,
                existingPlayers,
                gameDate
            );

            // Check for unmatched players
            if (gameResults.unmatchedPlayers.length > 0) {
                throw new Error(
                    `Unable to match the following players: ${gameResults.unmatchedPlayers.join(', ')}. ` +
                    `Please ensure these players exist in the database or check their nicknames.`
                );
            }

            playerUpdates = gameResults.playerUpdates;
            affectedPlayerKeys = Object.keys(playerUpdates);

            debugManager.log('upload', `Processed ${gameResults.processedCount} players, ${gameResults.matchedCount} matched`);

            // Step 4: Create backup before updating
            this.uploadInterface.showProcessingStep(4, 5, 'Creating backup...');
            const backupData = await this.databaseManager.createBackup(affectedPlayerKeys);
            const backupId = this.undoManager.storeUndoData(backupData, gameDate, affectedPlayerKeys.length);

            // Step 5: Update player statistics in database
            this.uploadInterface.showProcessingStep(5, 5, 'Updating player statistics...');
            await this.databaseManager.updatePlayersInTransaction(playerUpdates);

            // Mark game as uploaded
            this.markGameAsUploaded(gameDate, file.name);

            // Show game results before success message
            try {
                debugManager.log('upload', 'Displaying game results...');
                await this.gameResultsDisplay.showGameResults(csvData, gameDate);
            } catch (error) {
                console.warn('⚠️ Could not display game results:', error.message);
                // Don't fail the upload if results display fails
            }

            // Show success with undo option
            const undoCallback = () => this.handleUndo();
            this.uploadInterface.showDetailedSuccess(gameDate, affectedPlayerKeys.length, undoCallback);

            // Refresh leaderboard if function exists
            await this.refreshLeaderboard();

            console.log(`✅ Upload completed successfully: ${gameDate} (${affectedPlayerKeys.length} players)`);

        } catch (error) {
            console.error('❌ Upload failed:', error);
            
            // Analyze and categorize the error if it's not already structured
            const structuredError = error.type && error.subtype ? error : 
                this.errorHandler.analyzeError(error, {
                    fileName: file.name,
                    fileSize: file.size,
                    gameDate,
                    operation: 'handleFileUpload',
                    affectedPlayers: affectedPlayerKeys.length
                });

            // Log the structured error
            this.errorHandler.logError(structuredError, {
                uploadAttempt: true,
                partialSuccess: affectedPlayerKeys.length > 0
            });

            // Show structured error with enhanced messaging
            this.uploadInterface.showStructuredError(structuredError);

            // If we had partial success, we might need cleanup
            if (affectedPlayerKeys.length > 0 && playerUpdates && Object.keys(playerUpdates).length > 0) {
                console.warn('⚠️ Upload failed after partial processing - manual cleanup may be required');
                
                // Add additional context to the error display
                const cleanupWarning = this.errorHandler.createError(
                    this.errorHandler.errorTypes.SYSTEM,
                    'initialization_failed',
                    'Upload failed after partial processing. Some data may need manual verification.',
                    { affectedPlayers: affectedPlayerKeys.length }
                );
                cleanupWarning.severity = this.errorHandler.severityLevels.HIGH;
                
                // Log the cleanup warning
                this.errorHandler.logError(cleanupWarning, { partialProcessing: true });
            }
        }
    }

    /**
     * Check if a game has already been uploaded to prevent duplicates
     * @param {string} gameDate - Date of the game (YYYY-MM-DD)
     * @param {string} filename - Name of the CSV file
     */
    async checkForDuplicateGame(gameDate, filename) {
        const gameKey = `${gameDate}_${filename}`;
        
        // Check local session duplicates
        if (this.uploadedGames.has(gameKey)) {
            throw this.errorHandler.createError(
                this.errorHandler.errorTypes.DUPLICATE,
                'duplicate_file',
                `This exact file has been uploaded in this session`,
                { gameDate, filename, gameKey }
            );
        }

        // Additional check: look for players who already have this game date in their games_played
        try {
            const existingPlayers = await this.databaseManager.fetchAllPlayers();
            const playersWithThisGame = [];

            for (const [playerKey, playerData] of Object.entries(existingPlayers)) {
                if (playerData.games_played && Array.isArray(playerData.games_played)) {
                    if (playerData.games_played.includes(gameDate)) {
                        playersWithThisGame.push(playerKey);
                    }
                }
            }

            if (playersWithThisGame.length > 0) {
                const playerList = playersWithThisGame.slice(0, 5).join(', ');
                const moreText = playersWithThisGame.length > 5 ? ` and ${playersWithThisGame.length - 5} others` : '';
                
                throw this.errorHandler.createError(
                    this.errorHandler.errorTypes.DUPLICATE,
                    'duplicate_game',
                    `Game for ${gameDate} appears to already exist in the database`,
                    { 
                        gameDate, 
                        filename,
                        playersWithGame: playersWithThisGame,
                        playerList: playerList + moreText,
                        totalPlayersAffected: playersWithThisGame.length
                    }
                );
            }

        } catch (error) {
            // If it's already a structured error, re-throw it
            if (error.type && error.subtype) {
                throw error;
            }
            
            // For database errors during duplicate check, create appropriate error
            if (error.message.includes('Firebase') || error.message.includes('database')) {
                const dbError = this.errorHandler.createError(
                    this.errorHandler.errorTypes.DATABASE,
                    'connection_failed',
                    'Could not verify if game is duplicate due to database connection issues',
                    { gameDate, filename, originalError: error.message }
                );
                dbError.severity = this.errorHandler.severityLevels.MEDIUM; // Don't fail upload for this
                this.errorHandler.logError(dbError, { operation: 'duplicateCheck' });
                
                // Log warning but don't fail the upload
                console.warn('⚠️ Could not perform duplicate check:', error.message);
                return;
            }
            
            // For other errors, log but don't fail the upload
            console.warn('⚠️ Could not perform duplicate check:', error.message);
        }
    }

    /**
     * Mark a game as uploaded in local storage
     * @param {string} gameDate - Date of the game
     * @param {string} filename - Name of the file
     */
    markGameAsUploaded(gameDate, filename) {
        const gameKey = `${gameDate}_${filename}`;
        this.uploadedGames.add(gameKey);
        
        // Store in localStorage for persistence
        try {
            const uploadedGamesArray = Array.from(this.uploadedGames);
            localStorage.setItem('uploaded_games', JSON.stringify(uploadedGamesArray));
        } catch (error) {
            console.warn('⚠️ Could not save uploaded games to localStorage:', error);
        }
    }

    /**
     * Load previously uploaded games from localStorage
     */
    loadUploadedGamesHistory() {
        try {
            const stored = localStorage.getItem('uploaded_games');
            if (stored) {
                const uploadedGamesArray = JSON.parse(stored);
                this.uploadedGames = new Set(uploadedGamesArray);
                console.log(`📚 Loaded ${this.uploadedGames.size} previously uploaded games`);
            }
        } catch (error) {
            console.warn('⚠️ Could not load uploaded games history:', error);
            this.uploadedGames = new Set();
        }
    }

    /**
     * Clear uploaded games history (useful for testing or reset)
     */
    clearUploadedGamesHistory() {
        this.uploadedGames.clear();
        try {
            localStorage.removeItem('uploaded_games');
            console.log('🗑️ Cleared uploaded games history');
        } catch (error) {
            console.warn('⚠️ Could not clear uploaded games history:', error);
        }
    }

    /**
     * Handle undo operation
     */
    async handleUndo() {
        try {
            console.log('🔄 Starting undo operation...');
            
            this.uploadInterface.showUndoProcessing();

            const result = await this.undoManager.performUndoWithConfirmation(
                this.databaseManager,
                {
                    useCustomDialog: true,
                    progressCallback: (message, percentage) => {
                        this.uploadInterface.updateProgress(percentage, message);
                    }
                }
            );

            if (result.success) {
                this.uploadInterface.showUndoSuccess(result.message);
                
                // Remove the game from uploaded games history
                if (result.gameDate) {
                    this.removeGameFromHistory(result.gameDate);
                }
                
                // Refresh leaderboard
                await this.refreshLeaderboard();
                
                console.log('✅ Undo completed successfully');
            } else if (result.cancelled) {
                // User cancelled - restore interface
                this.uploadInterface.resetInterface();
                console.log('ℹ️ Undo cancelled by user');
            } else {
                this.uploadInterface.showUndoError(result.message);
                console.error('❌ Undo failed:', result.error);
            }

        } catch (error) {
            console.error('❌ Undo operation failed:', error);
            this.uploadInterface.showUndoError(`Undo failed: ${error.message}`);
        }
    }

    /**
     * Remove a game from the uploaded games history
     * @param {string} gameDate - Date of the game to remove
     */
    removeGameFromHistory(gameDate) {
        // Remove all entries for this game date
        const toRemove = [];
        for (const gameKey of this.uploadedGames) {
            if (gameKey.startsWith(gameDate)) {
                toRemove.push(gameKey);
            }
        }

        toRemove.forEach(key => this.uploadedGames.delete(key));

        // Update localStorage
        try {
            const uploadedGamesArray = Array.from(this.uploadedGames);
            localStorage.setItem('uploaded_games', JSON.stringify(uploadedGamesArray));
            console.log(`🗑️ Removed ${toRemove.length} game entries for ${gameDate}`);
        } catch (error) {
            console.warn('⚠️ Could not update uploaded games history:', error);
        }
    }

    /**
     * Generate helpful error suggestions based on error message
     * @param {string} errorMessage - The error message
     * @param {string} filename - The filename that caused the error
     * @returns {Array<string>} Array of suggestion strings
     */
    generateErrorSuggestions(errorMessage, filename) {
        const suggestions = [];

        if (errorMessage.includes('filename')) {
            suggestions.push('Ensure filename follows the pattern: ledgerYY_MM_DD.csv (e.g., ledger23_10_15.csv)');
        }

        if (errorMessage.includes('columns')) {
            suggestions.push('Verify your CSV has all required columns: player_nickname, player_id, session_start_at, session_end_at, buy_in, buy_out, stack, net');
        }

        if (errorMessage.includes('match') || errorMessage.includes('nickname')) {
            suggestions.push('Check that all player nicknames in the CSV exist in the database or in player_nicknames arrays');
            suggestions.push('Verify spelling and capitalization of player nicknames');
        }

        if (errorMessage.includes('duplicate') || errorMessage.includes('already')) {
            suggestions.push('Check if this game has been uploaded before');
            suggestions.push('If you need to re-upload, refresh the page first to clear the duplicate check');
        }

        if (errorMessage.includes('Firebase') || errorMessage.includes('database')) {
            suggestions.push('Check your internet connection');
            suggestions.push('Verify you have permission to update the database');
            suggestions.push('Try refreshing the page and uploading again');
        }

        if (errorMessage.includes('numeric') || errorMessage.includes('number')) {
            suggestions.push('Ensure all numeric columns (buy_in, buy_out, stack, net) contain valid numbers');
        }

        if (suggestions.length === 0) {
            suggestions.push('Try refreshing the page and uploading again');
            suggestions.push('Check the browser console for more detailed error information');
        }

        return suggestions;
    }

    /**
     * Refresh the leaderboard after successful upload
     */
    async refreshLeaderboard() {
        try {
            // Check if there's a global leaderboard refresh function
            if (typeof window.refreshLeaderboard === 'function') {
                console.log('🔄 Refreshing leaderboard...');
                await window.refreshLeaderboard();
                console.log('✅ Leaderboard refreshed');
            } else if (typeof window.loadLeaderboard === 'function') {
                console.log('🔄 Reloading leaderboard...');
                await window.loadLeaderboard();
                console.log('✅ Leaderboard reloaded');
            } else {
                console.log('ℹ️ No leaderboard refresh function found - manual refresh may be needed');
            }
        } catch (error) {
            console.warn('⚠️ Could not refresh leaderboard:', error);
            // Don't throw error - this is not critical to the upload process
        }
    }

    /**
     * Get upload statistics for monitoring
     * @returns {Object} Statistics about uploads
     */
    getUploadStats() {
        return {
            totalUploadsThisSession: this.uploadedGames.size,
            isInitialized: this.isInitialized,
            undoAvailable: this.undoManager ? this.undoManager.isUndoAvailable() : false,
            undoInfo: this.undoManager ? this.undoManager.getUndoInfo() : null
        };
    }

    /**
     * Test all components connectivity and functionality
     * @returns {Promise<Object>} Test results
     */
    async runDiagnostics() {
        const results = {
            csvProcessor: false,
            playerStatsCalculator: false,
            databaseManager: false,
            undoManager: false,
            uploadInterface: false,
            firebase: false,
            localStorage: false
        };

        try {
            // Test CSV Processor
            if (this.csvProcessor) {
                results.csvProcessor = true;
            }

            // Test Player Stats Calculator
            if (this.playerStatsCalculator) {
                results.playerStatsCalculator = true;
            }

            // Test Database Manager
            if (this.databaseManager) {
                results.databaseManager = await this.databaseManager.testConnection();
            }

            // Test Undo Manager
            if (this.undoManager) {
                results.undoManager = this.undoManager.testStorageAvailability();
            }

            // Test Upload Interface
            if (this.uploadInterface) {
                results.uploadInterface = true;
            }

            // Test Firebase
            results.firebase = window.firebase && firebase.apps.length > 0;

            // Test localStorage
            results.localStorage = this.undoManager ? this.undoManager.testStorageAvailability() : false;

        } catch (error) {
            console.error('Diagnostics failed:', error);
        }

        return results;
    }

    /**
     * Reset the orchestrator to initial state
     */
    reset() {
        if (this.uploadInterface) {
            this.uploadInterface.resetInterface();
        }
        
        this.clearUploadedGamesHistory();
        
        console.log('🔄 UploadOrchestrator reset to initial state');
    }

    /**
     * Cleanup resources and event listeners
     */
    destroy() {
        // Reset interface
        if (this.uploadInterface) {
            this.uploadInterface.resetInterface();
        }

        // Dismiss any open results display
        if (this.gameResultsDisplay && this.gameResultsDisplay.isResultsDisplayed()) {
            this.gameResultsDisplay.dismissResults();
        }

        // Clear references
        this.csvProcessor = null;
        this.playerStatsCalculator = null;
        this.databaseManager = null;
        this.undoManager = null;
        this.uploadInterface = null;
        this.gameResultsDisplay = null;
        
        this.isInitialized = false;
        
        console.log('🗑️ UploadOrchestrator destroyed');
    }
}

// Export for use in other modules
window.UploadOrchestrator = UploadOrchestrator;