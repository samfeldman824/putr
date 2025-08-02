/**
 * Firebase Database Manager
 * Handles all Firestore operations for the CSV upload functionality
 * Provides transaction-based updates and error handling
 */

class DatabaseManager {
  constructor() {
    // Ensure Firebase is initialized
    if (!firebase.apps.length) {
      throw new Error('Firebase must be initialized before using DatabaseManager');
    }

    // Ensure constants are loaded
    if (typeof COLLECTIONS === 'undefined') {
      throw new Error('COLLECTIONS not found. Make sure constants.js is loaded before DatabaseManager.');
    }

    this.db = firebase.firestore();
    this.playersCollection = COLLECTIONS.PLAYERS;

    console.log(`🔗 DatabaseManager initialized - Using collection: ${this.playersCollection}`);
  }

  /**
   * Fetches all player data from Firestore
   * @returns {Promise<Object>} Object with player names as keys and player data as values
   * @throws {Error} If database fetch fails
   */
  async fetchAllPlayers() {
    try {
      console.log('Fetching all players from Firestore...');
      const querySnapshot = await this.db.collection(this.playersCollection).get();

      const playersData = {};
      querySnapshot.forEach((doc) => {
        playersData[doc.id] = doc.data();
      });

      console.log(`Successfully fetched ${Object.keys(playersData).length} players`);
      return playersData;
    } catch (error) {
      console.error('Error fetching players:', error);
      throw new Error(`Failed to fetch player data: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Updates multiple players atomically using Firestore transactions
   * @param {Object} playerUpdates - Object with player names as keys and update data as values
   * @returns {Promise<void>}
   * @throws {Error} If transaction fails
   */
  async updatePlayersInTransaction(playerUpdates) {
    if (!playerUpdates || Object.keys(playerUpdates).length === 0) {
      throw new Error('No player updates provided');
    }

    try {
      console.log(`Starting transaction to update ${Object.keys(playerUpdates).length} players...`);

      await this.db.runTransaction(async (transaction) => {
        const playerRefs = {};
        const currentData = {};

        // First, get all player references and read current data
        for (const playerName of Object.keys(playerUpdates)) {
          const playerRef = this.db.collection(this.playersCollection).doc(playerName);
          playerRefs[playerName] = playerRef;

          const doc = await transaction.get(playerRef);
          if (!doc.exists) {
            throw new Error(`Player "${playerName}" not found in database`);
          }
          currentData[playerName] = doc.data();
        }

        // Then, perform all updates
        for (const [playerName, updateData] of Object.entries(playerUpdates)) {
          const playerRef = playerRefs[playerName];
          transaction.update(playerRef, updateData);
        }

        console.log('Transaction completed successfully');
      });

    } catch (error) {
      console.error('Transaction failed:', error);
      throw new Error(`Failed to update players: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Creates a backup of player data before updates
   * @param {string[]} playerNames - Array of player names to backup
   * @returns {Promise<Object>} Backup data with player names as keys
   * @throws {Error} If backup creation fails
   */
  async createBackup(playerNames) {
    if (!playerNames || playerNames.length === 0) {
      throw new Error('No players specified for backup');
    }

    try {
      console.log(`Creating backup for ${playerNames.length} players...`);
      const backupData = {};

      // Fetch current data for specified players
      const batch = playerNames.map(playerName =>
        this.db.collection(this.playersCollection).doc(playerName).get()
      );

      const snapshots = await Promise.all(batch);

      snapshots.forEach((doc, index) => {
        const playerName = playerNames[index];
        if (doc.exists) {
          backupData[playerName] = doc.data();
        } else {
          console.warn(`Player "${playerName}" not found during backup`);
        }
      });

      console.log(`Backup created for ${Object.keys(backupData).length} players`);
      return backupData;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error(`Failed to create backup: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Restores player data from backup using transactions
   * @param {Object} backupData - Backup data with player names as keys
   * @returns {Promise<void>}
   * @throws {Error} If restore operation fails
   */
  async restoreFromBackup(backupData) {
    if (!backupData || Object.keys(backupData).length === 0) {
      throw new Error('No backup data provided for restore');
    }

    try {
      console.log(`Restoring ${Object.keys(backupData).length} players from backup...`);

      await this.db.runTransaction(async (transaction) => {
        // Verify all players exist before restoring
        for (const playerName of Object.keys(backupData)) {
          const playerRef = this.db.collection(this.playersCollection).doc(playerName);
          const doc = await transaction.get(playerRef);

          if (!doc.exists) {
            throw new Error(`Cannot restore: Player "${playerName}" no longer exists`);
          }
        }

        // Restore all players
        for (const [playerName, playerData] of Object.entries(backupData)) {
          const playerRef = this.db.collection(this.playersCollection).doc(playerName);
          transaction.set(playerRef, playerData);
        }

        console.log('Restore transaction completed successfully');
      });

    } catch (error) {
      console.error('Restore failed:', error);
      throw new Error(`Failed to restore from backup: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Checks if a player exists in the database
   * @param {string} playerName - Name of the player to check
   * @returns {Promise<boolean>} True if player exists, false otherwise
   */
  async playerExists(playerName) {
    try {
      const doc = await this.db.collection(this.playersCollection).doc(playerName).get();
      return doc.exists;
    } catch (error) {
      console.error(`Error checking if player "${playerName}" exists:`, error);
      return false;
    }
  }

  /**
   * Gets a single player's data
   * @param {string} playerName - Name of the player
   * @returns {Promise<Object|null>} Player data or null if not found
   * @throws {Error} If database operation fails
   */
  async getPlayer(playerName) {
    try {
      const doc = await this.db.collection(this.playersCollection).doc(playerName).get();
      return doc.exists ? doc.data() : null;
    } catch (error) {
      console.error(`Error fetching player "${playerName}":`, error);
      throw new Error(`Failed to fetch player "${playerName}": ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Tests database connectivity
   * @returns {Promise<boolean>} True if connection is successful
   */
  async testConnection() {
    try {
      // Try to read a small amount of data to test connection
      await this.db.collection(this.playersCollection).limit(1).get();
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  /**
   * Extracts user-friendly error messages from Firebase errors
   * @param {Error} error - Firebase error object
   * @returns {string} User-friendly error message
   */
  getErrorMessage(error) {
    if (!error) return 'Unknown error occurred';

    // Handle Firebase-specific error codes
    switch (error.code) {
      case 'permission-denied':
        return 'Access denied. Please check your permissions.';
      case 'unavailable':
        return 'Database is temporarily unavailable. Please try again.';
      case 'deadline-exceeded':
        return 'Request timed out. Please check your connection and try again.';
      case 'not-found':
        return 'Requested data not found.';
      case 'already-exists':
        return 'Data already exists.';
      case 'resource-exhausted':
        return 'Too many requests. Please wait and try again.';
      case 'failed-precondition':
        return 'Operation failed due to system state. Please refresh and try again.';
      case 'aborted':
        return 'Operation was aborted due to a conflict. Please try again.';
      case 'out-of-range':
        return 'Invalid data range provided.';
      case 'unimplemented':
        return 'This operation is not supported.';
      case 'internal':
        return 'Internal server error. Please try again later.';
      case 'unauthenticated':
        return 'Authentication required. Please sign in.';
      default:
        return error.message || 'An unexpected error occurred';
    }
  }

  /**
   * Finds a player by nickname using the player_nicknames array
   * @param {string} nickname - The nickname to search for
   * @param {Object} playersData - Optional cached players data (if not provided, will fetch from database)
   * @returns {Promise<Object|null>} Object with playerKey and playerData, or null if not found
   * @throws {Error} If database operation fails
   */
  async findPlayerByNickname(nickname, playersData = null) {
    if (!nickname || typeof nickname !== 'string') {
      throw new Error('Nickname must be a valid string');
    }

    try {
      // Use cached data if provided, otherwise fetch from database
      const players = playersData || await this.fetchAllPlayers();
      const trimmedNickname = nickname.trim();

      // First, try exact match with player keys
      if (players[trimmedNickname]) {
        return {
          playerKey: trimmedNickname,
          playerData: players[trimmedNickname]
        };
      }

      // Then, search through player_nicknames arrays
      for (const [playerKey, playerData] of Object.entries(players)) {
        if (playerData.player_nicknames && Array.isArray(playerData.player_nicknames)) {
          // Check if nickname exists in the player_nicknames array (case-insensitive)
          const matchFound = playerData.player_nicknames.some(nick =>
            nick && typeof nick === 'string' && nick.trim().toLowerCase() === trimmedNickname.toLowerCase()
          );

          if (matchFound) {
            return {
              playerKey,
              playerData
            };
          }
        }
      }

      // No match found
      return null;
    } catch (error) {
      console.error(`Error finding player by nickname "${nickname}":`, error);
      throw new Error(`Failed to find player by nickname: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Finds multiple players by their nicknames efficiently
   * @param {string[]} nicknames - Array of nicknames to search for
   * @returns {Promise<Object>} Object with matched and unmatched players
   * @throws {Error} If database operation fails
   */
  async findPlayersByNicknames(nicknames) {
    if (!nicknames || !Array.isArray(nicknames)) {
      throw new Error('Nicknames must be a valid array');
    }

    if (nicknames.length === 0) {
      return { matched: {}, unmatched: [] };
    }

    try {
      console.log(`Finding ${nicknames.length} players by nicknames...`);

      // Fetch all players once for efficiency
      const playersData = await this.fetchAllPlayers();

      const matched = {};
      const unmatched = [];

      // Process each nickname
      for (const nickname of nicknames) {
        const result = await this.findPlayerByNickname(nickname, playersData);

        if (result) {
          matched[nickname] = result;
        } else {
          unmatched.push(nickname);
        }
      }

      console.log(`Found ${Object.keys(matched).length} matches, ${unmatched.length} unmatched`);

      return { matched, unmatched };
    } catch (error) {
      console.error('Error finding players by nicknames:', error);
      throw new Error(`Failed to find players by nicknames: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Performs batch update operations for multiple players with optimized transactions
   * @param {Object} playerUpdates - Object with player keys as keys and update data as values
   * @param {Object} options - Optional configuration for batch operations
   * @returns {Promise<Object>} Result object with success count and any errors
   * @throws {Error} If batch operation fails
   */
  async batchUpdatePlayers(playerUpdates, options = {}) {
    if (!playerUpdates || Object.keys(playerUpdates).length === 0) {
      throw new Error('No player updates provided for batch operation');
    }

    const {
      maxBatchSize = 500, // Firestore transaction limit
      continueOnError = false
    } = options;

    const playerKeys = Object.keys(playerUpdates);

    if (playerKeys.length > maxBatchSize) {
      throw new Error(`Batch size ${playerKeys.length} exceeds maximum ${maxBatchSize}`);
    }

    try {
      console.log(`Starting batch update for ${playerKeys.length} players...`);

      const results = {
        successCount: 0,
        errors: [],
        updatedPlayers: []
      };

      await this.db.runTransaction(async (transaction) => {
        const playerRefs = {};
        const currentData = {};

        // First, get all player references and read current data
        for (const playerKey of playerKeys) {
          const playerRef = this.db.collection(this.playersCollection).doc(playerKey);
          playerRefs[playerKey] = playerRef;

          const doc = await transaction.get(playerRef);
          if (!doc.exists) {
            const error = `Player "${playerKey}" not found in database`;
            if (continueOnError) {
              results.errors.push({ playerKey, error });
              continue;
            } else {
              throw new Error(error);
            }
          }
          currentData[playerKey] = doc.data();
        }

        // Then, perform all updates
        for (const [playerKey, updateData] of Object.entries(playerUpdates)) {
          if (playerRefs[playerKey] && currentData[playerKey]) {
            try {
              transaction.update(playerRefs[playerKey], updateData);
              results.successCount++;
              results.updatedPlayers.push(playerKey);
            } catch (error) {
              const errorMsg = `Failed to update player "${playerKey}": ${error.message}`;
              if (continueOnError) {
                results.errors.push({ playerKey, error: errorMsg });
              } else {
                throw new Error(errorMsg);
              }
            }
          }
        }

        console.log(`Batch transaction completed: ${results.successCount} successful updates`);
      });

      return results;

    } catch (error) {
      console.error('Batch update failed:', error);
      throw new Error(`Batch update operation failed: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Gets multiple players' data efficiently
   * @param {string[]} playerKeys - Array of player keys to fetch
   * @returns {Promise<Object>} Object with player keys as keys and player data as values
   * @throws {Error} If database operation fails
   */
  async getMultiplePlayers(playerKeys) {
    if (!playerKeys || !Array.isArray(playerKeys)) {
      throw new Error('Player keys must be a valid array');
    }

    if (playerKeys.length === 0) {
      return {};
    }

    try {
      console.log(`Fetching ${playerKeys.length} players...`);

      // Use Promise.all for parallel fetching
      const promises = playerKeys.map(playerKey =>
        this.db.collection(this.playersCollection).doc(playerKey).get()
      );

      const snapshots = await Promise.all(promises);
      const playersData = {};

      snapshots.forEach((doc, index) => {
        const playerKey = playerKeys[index];
        if (doc.exists) {
          playersData[playerKey] = doc.data();
        } else {
          console.warn(`Player "${playerKey}" not found`);
        }
      });

      console.log(`Successfully fetched ${Object.keys(playersData).length} players`);
      return playersData;
    } catch (error) {
      console.error('Error fetching multiple players:', error);
      throw new Error(`Failed to fetch multiple players: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Validates that required Firebase services are available
   * @throws {Error} If Firebase is not properly configured
   */
  validateFirebaseSetup() {
    if (!window.firebase) {
      throw new Error('Firebase SDK not loaded');
    }

    if (!firebase.apps.length) {
      throw new Error('Firebase not initialized');
    }

    if (!firebase.firestore) {
      throw new Error('Firestore not available');
    }
  }
}

// Export for use in other modules
window.DatabaseManager = DatabaseManager;