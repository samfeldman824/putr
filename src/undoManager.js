/**
 * Undo Manager Module
 * Handles backup creation, storage, and restoration for CSV upload operations
 * Provides local storage management and cleanup functionality
 */

class UndoManager {
    constructor() {
        this.storageKey = 'csv_upload_undo_data';
        this.maxBackups = 5; // Maximum number of backups to keep
        this.maxBackupAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        console.log('🔄 UndoManager initialized');
    }

    /**
     * Store backup data for a successful upload
     * @param {Object} backupData - Player data before the upload
     * @param {string} gameDate - Date of the uploaded game (YYYY-MM-DD)
     * @param {number} playerCount - Number of players affected
     * @returns {string} Backup ID for reference
     */
    storeUndoData(backupData, gameDate, playerCount = null) {
        if (!backupData || typeof backupData !== 'object') {
            throw new Error('Backup data must be a valid object');
        }

        if (!gameDate || typeof gameDate !== 'string') {
            throw new Error('Game date must be a valid string');
        }

        try {
            const backupId = this.generateBackupId(gameDate);
            const timestamp = Date.now();
            
            const undoEntry = {
                id: backupId,
                timestamp,
                gameDate,
                playerCount: playerCount || Object.keys(backupData).length,
                backupData: this.deepClone(backupData),
                version: '1.0'
            };

            // Get existing backups
            const existingBackups = this.getStoredBackups();
            
            // Add new backup
            existingBackups[backupId] = undoEntry;
            
            // Clean up old backups before storing
            this.cleanupOldBackups(existingBackups);
            
            // Store updated backups
            this.saveBackupsToStorage(existingBackups);
            
            console.log(`✅ Backup stored: ${backupId} (${Object.keys(backupData).length} players)`);
            return backupId;
            
        } catch (error) {
            console.error('Error storing undo data:', error);
            throw new Error(`Failed to store backup: ${error.message}`);
        }
    }

    /**
     * Get the most recent backup data
     * @returns {Object|null} Most recent backup or null if none exists
     */
    getLatestBackup() {
        try {
            const backups = this.getStoredBackups();
            const backupIds = Object.keys(backups);
            
            if (backupIds.length === 0) {
                return null;
            }
            
            // Find the most recent backup by timestamp
            let latestBackup = null;
            let latestTimestamp = 0;
            
            for (const backupId of backupIds) {
                const backup = backups[backupId];
                if (backup.timestamp > latestTimestamp) {
                    latestTimestamp = backup.timestamp;
                    latestBackup = backup;
                }
            }
            
            return latestBackup;
            
        } catch (error) {
            console.error('Error getting latest backup:', error);
            return null;
        }
    }

    /**
     * Get backup data by ID
     * @param {string} backupId - ID of the backup to retrieve
     * @returns {Object|null} Backup data or null if not found
     */
    getBackupById(backupId) {
        if (!backupId || typeof backupId !== 'string') {
            throw new Error('Backup ID must be a valid string');
        }

        try {
            const backups = this.getStoredBackups();
            return backups[backupId] || null;
            
        } catch (error) {
            console.error(`Error getting backup ${backupId}:`, error);
            return null;
        }
    }

    /**
     * Check if undo is available
     * @returns {boolean} True if undo data is available
     */
    isUndoAvailable() {
        try {
            const latestBackup = this.getLatestBackup();
            return latestBackup !== null;
            
        } catch (error) {
            console.error('Error checking undo availability:', error);
            return false;
        }
    }

    /**
     * Get undo information for display
     * @returns {Object|null} Undo info with gameDate and playerCount, or null
     */
    getUndoInfo() {
        try {
            const latestBackup = this.getLatestBackup();
            
            if (!latestBackup) {
                return null;
            }
            
            return {
                gameDate: latestBackup.gameDate,
                playerCount: latestBackup.playerCount,
                timestamp: latestBackup.timestamp,
                backupId: latestBackup.id
            };
            
        } catch (error) {
            console.error('Error getting undo info:', error);
            return null;
        }
    }

    /**
     * Clear specific backup by ID
     * @param {string} backupId - ID of backup to clear
     * @returns {boolean} True if backup was cleared successfully
     */
    clearBackup(backupId) {
        if (!backupId || typeof backupId !== 'string') {
            throw new Error('Backup ID must be a valid string');
        }

        try {
            const backups = this.getStoredBackups();
            
            if (backups[backupId]) {
                delete backups[backupId];
                this.saveBackupsToStorage(backups);
                console.log(`🗑️ Backup cleared: ${backupId}`);
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error(`Error clearing backup ${backupId}:`, error);
            throw new Error(`Failed to clear backup: ${error.message}`);
        }
    }

    /**
     * Clear all backup data
     * @returns {boolean} True if all backups were cleared successfully
     */
    clearAllBackups() {
        try {
            localStorage.removeItem(this.storageKey);
            console.log('🗑️ All backups cleared');
            return true;
            
        } catch (error) {
            console.error('Error clearing all backups:', error);
            throw new Error(`Failed to clear all backups: ${error.message}`);
        }
    }

    /**
     * Get backup statistics for monitoring
     * @returns {Object} Statistics about stored backups
     */
    getBackupStats() {
        try {
            const backups = this.getStoredBackups();
            const backupIds = Object.keys(backups);
            
            if (backupIds.length === 0) {
                return {
                    count: 0,
                    totalSize: 0,
                    oldestTimestamp: null,
                    newestTimestamp: null
                };
            }
            
            let oldestTimestamp = Infinity;
            let newestTimestamp = 0;
            let totalSize = 0;
            
            for (const backupId of backupIds) {
                const backup = backups[backupId];
                const backupSize = JSON.stringify(backup).length;
                
                totalSize += backupSize;
                oldestTimestamp = Math.min(oldestTimestamp, backup.timestamp);
                newestTimestamp = Math.max(newestTimestamp, backup.timestamp);
            }
            
            return {
                count: backupIds.length,
                totalSize,
                oldestTimestamp: oldestTimestamp === Infinity ? null : oldestTimestamp,
                newestTimestamp: newestTimestamp === 0 ? null : newestTimestamp
            };
            
        } catch (error) {
            console.error('Error getting backup stats:', error);
            return {
                count: 0,
                totalSize: 0,
                oldestTimestamp: null,
                newestTimestamp: null
            };
        }
    }

    /**
     * Validate backup data integrity
     * @param {Object} backupData - Backup data to validate
     * @returns {Object} Validation result with isValid and errors
     */
    validateBackupData(backupData) {
        const result = {
            isValid: true,
            errors: []
        };

        if (!backupData || typeof backupData !== 'object') {
            result.isValid = false;
            result.errors.push('Backup data must be a valid object');
            return result;
        }

        // Check if backup has required structure
        if (!backupData.id || typeof backupData.id !== 'string') {
            result.isValid = false;
            result.errors.push('Backup must have a valid ID');
        }

        if (!backupData.timestamp || typeof backupData.timestamp !== 'number') {
            result.isValid = false;
            result.errors.push('Backup must have a valid timestamp');
        }

        if (!backupData.gameDate || typeof backupData.gameDate !== 'string') {
            result.isValid = false;
            result.errors.push('Backup must have a valid game date');
        }

        if (!backupData.backupData || typeof backupData.backupData !== 'object') {
            result.isValid = false;
            result.errors.push('Backup must contain valid player data');
        }

        // Validate player data structure
        if (result.isValid && backupData.backupData) {
            for (const [playerKey, playerData] of Object.entries(backupData.backupData)) {
                if (!playerData || typeof playerData !== 'object') {
                    result.isValid = false;
                    result.errors.push(`Invalid player data for ${playerKey}`);
                    break;
                }
            }
        }

        return result;
    }

    /**
     * Get all stored backups from localStorage
     * @returns {Object} Object containing all backups
     * @private
     */
    getStoredBackups() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : {};
            
        } catch (error) {
            console.error('Error reading backups from storage:', error);
            // If storage is corrupted, return empty object and clear it
            localStorage.removeItem(this.storageKey);
            return {};
        }
    }

    /**
     * Save backups to localStorage
     * @param {Object} backups - Backups object to save
     * @private
     */
    saveBackupsToStorage(backups) {
        try {
            const serialized = JSON.stringify(backups);
            
            // Check if we're approaching localStorage limits (5MB typical limit)
            const sizeInMB = new Blob([serialized]).size / (1024 * 1024);
            if (sizeInMB > 4) { // Leave 1MB buffer
                console.warn('⚠️ Backup storage approaching limits, cleaning up...');
                this.forceCleanupBackups(backups);
                return;
            }
            
            localStorage.setItem(this.storageKey, serialized);
            
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.warn('⚠️ Storage quota exceeded, forcing cleanup...');
                this.forceCleanupBackups(backups);
            } else {
                throw error;
            }
        }
    }

    /**
     * Clean up old backups based on age and count limits
     * @param {Object} backups - Backups object to clean
     * @private
     */
    cleanupOldBackups(backups) {
        const now = Date.now();
        const backupIds = Object.keys(backups);
        
        // Remove backups older than maxBackupAge
        for (const backupId of backupIds) {
            const backup = backups[backupId];
            if (now - backup.timestamp > this.maxBackupAge) {
                delete backups[backupId];
                console.log(`🗑️ Removed expired backup: ${backupId}`);
            }
        }
        
        // If still too many backups, remove oldest ones
        const remainingIds = Object.keys(backups);
        if (remainingIds.length > this.maxBackups) {
            // Sort by timestamp (oldest first)
            const sortedIds = remainingIds.sort((a, b) => 
                backups[a].timestamp - backups[b].timestamp
            );
            
            // Remove oldest backups
            const toRemove = sortedIds.slice(0, remainingIds.length - this.maxBackups);
            for (const backupId of toRemove) {
                delete backups[backupId];
                console.log(`🗑️ Removed old backup: ${backupId}`);
            }
        }
    }

    /**
     * Force cleanup when storage is full
     * @param {Object} backups - Backups object to clean
     * @private
     */
    forceCleanupBackups(backups) {
        const backupIds = Object.keys(backups);
        
        if (backupIds.length === 0) {
            return;
        }
        
        // Keep only the most recent backup
        const sortedIds = backupIds.sort((a, b) => 
            backups[b].timestamp - backups[a].timestamp
        );
        
        const mostRecent = sortedIds[0];
        const cleanedBackups = {
            [mostRecent]: backups[mostRecent]
        };
        
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(cleanedBackups));
            console.log('🗑️ Force cleanup completed, kept most recent backup only');
        } catch (error) {
            // If even one backup is too large, clear everything
            localStorage.removeItem(this.storageKey);
            console.log('🗑️ Storage completely cleared due to size constraints');
        }
    }

    /**
     * Generate a unique backup ID
     * @param {string} gameDate - Game date for the backup
     * @returns {string} Unique backup ID
     * @private
     */
    generateBackupId(gameDate) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `backup_${gameDate}_${timestamp}_${random}`;
    }

    /**
     * Create a deep clone of an object
     * @param {Object} obj - Object to clone
     * @returns {Object} Deep cloned object
     * @private
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.deepClone(item));
        }
        
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        
        return cloned;
    }

    /**
     * Test localStorage availability and functionality
     * @returns {boolean} True if localStorage is available and working
     */
    testStorageAvailability() {
        try {
            const testKey = 'undo_manager_test';
            const testValue = 'test_data';
            
            localStorage.setItem(testKey, testValue);
            const retrieved = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);
            
            return retrieved === testValue;
            
        } catch (error) {
            console.error('localStorage test failed:', error);
            return false;
        }
    }

    /**
     * Get storage usage information
     * @returns {Object} Storage usage statistics
     */
    getStorageUsage() {
        try {
            const backups = this.getStoredBackups();
            const serialized = JSON.stringify(backups);
            const sizeInBytes = new Blob([serialized]).size;
            const sizeInKB = Math.round(sizeInBytes / 1024);
            const sizeInMB = Math.round(sizeInBytes / (1024 * 1024) * 100) / 100;
            
            return {
                backupCount: Object.keys(backups).length,
                sizeInBytes,
                sizeInKB,
                sizeInMB,
                storageAvailable: this.testStorageAvailability()
            };
            
        } catch (error) {
            console.error('Error getting storage usage:', error);
            return {
                backupCount: 0,
                sizeInBytes: 0,
                sizeInKB: 0,
                sizeInMB: 0,
                storageAvailable: false
            };
        }
    }

    /**
     * Perform undo operation by restoring from the latest backup
     * @param {DatabaseManager} databaseManager - Database manager instance for Firebase operations
     * @param {Object} options - Optional configuration for undo operation
     * @returns {Promise<Object>} Result object with success status and details
     */
    async performUndo(databaseManager, options = {}) {
        if (!databaseManager) {
            throw new Error('DatabaseManager instance is required for undo operation');
        }

        const {
            confirmationCallback = null,
            progressCallback = null,
            backupId = null // If specified, undo specific backup instead of latest
        } = options;

        try {
            // Get backup to restore
            const backup = backupId ? this.getBackupById(backupId) : this.getLatestBackup();
            
            if (!backup) {
                throw new Error('No backup available for undo operation');
            }

            // Validate backup data
            const validation = this.validateBackupData(backup);
            if (!validation.isValid) {
                throw new Error(`Invalid backup data: ${validation.errors.join(', ')}`);
            }

            // Show confirmation dialog if callback provided
            if (confirmationCallback && typeof confirmationCallback === 'function') {
                const confirmed = await confirmationCallback({
                    gameDate: backup.gameDate,
                    playerCount: backup.playerCount,
                    timestamp: backup.timestamp
                });

                if (!confirmed) {
                    return {
                        success: false,
                        cancelled: true,
                        message: 'Undo operation cancelled by user'
                    };
                }
            }

            // Report progress
            if (progressCallback) {
                progressCallback('Preparing undo operation...', 0);
            }

            console.log(`🔄 Starting undo operation for backup: ${backup.id}`);

            // Verify all players still exist in database
            const playerKeys = Object.keys(backup.backupData);
            
            if (progressCallback) {
                progressCallback('Verifying player data...', 20);
            }

            for (const playerKey of playerKeys) {
                const exists = await databaseManager.playerExists(playerKey);
                if (!exists) {
                    throw new Error(`Cannot undo: Player "${playerKey}" no longer exists in database`);
                }
            }

            if (progressCallback) {
                progressCallback('Restoring player statistics...', 50);
            }

            // Restore player data using database manager
            await databaseManager.restoreFromBackup(backup.backupData);

            if (progressCallback) {
                progressCallback('Cleaning up backup data...', 80);
            }

            // Clear the backup after successful restore
            this.clearBackup(backup.id);

            if (progressCallback) {
                progressCallback('Undo completed successfully', 100);
            }

            console.log(`✅ Undo operation completed successfully for ${playerKeys.length} players`);

            return {
                success: true,
                gameDate: backup.gameDate,
                playerCount: backup.playerCount,
                restoredPlayers: playerKeys,
                message: `Successfully undid upload for ${backup.gameDate} (${backup.playerCount} players)`
            };

        } catch (error) {
            console.error('Undo operation failed:', error);
            
            return {
                success: false,
                error: error.message,
                message: `Undo operation failed: ${error.message}`
            };
        }
    }

    /**
     * Create a confirmation dialog for undo operations
     * @param {Object} backupInfo - Information about the backup to undo
     * @returns {Promise<boolean>} True if user confirms, false otherwise
     */
    async showUndoConfirmation(backupInfo) {
        return new Promise((resolve) => {
            const { gameDate, playerCount, timestamp } = backupInfo;
            const dateStr = new Date(timestamp).toLocaleString();
            
            const message = `Are you sure you want to undo the upload for ${gameDate}?\n\n` +
                          `This will revert statistics for ${playerCount} players to their state before the upload on ${dateStr}.\n\n` +
                          `This action cannot be undone.`;

            const confirmed = confirm(message);
            resolve(confirmed);
        });
    }

    /**
     * Create a custom confirmation dialog with enhanced UI
     * @param {Object} backupInfo - Information about the backup to undo
     * @param {Object} options - Dialog options
     * @returns {Promise<boolean>} True if user confirms, false otherwise
     */
    async showCustomUndoConfirmation(backupInfo, options = {}) {
        return new Promise((resolve) => {
            const { gameDate, playerCount, timestamp } = backupInfo;
            const {
                title = 'Confirm Undo Operation',
                showDetails = true,
                confirmText = 'Yes, Undo Upload',
                cancelText = 'Cancel'
            } = options;

            // Create modal dialog
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                font-family: Arial, sans-serif;
            `;

            const dialog = document.createElement('div');
            dialog.style.cssText = `
                background: white;
                border-radius: 8px;
                padding: 24px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            `;

            const titleEl = document.createElement('h3');
            titleEl.textContent = title;
            titleEl.style.cssText = `
                margin: 0 0 16px 0;
                color: #dc3545;
                font-size: 18px;
            `;

            const messageEl = document.createElement('p');
            messageEl.textContent = `Are you sure you want to undo the upload for ${gameDate}?`;
            messageEl.style.cssText = `
                margin: 0 0 16px 0;
                color: #333;
                line-height: 1.5;
            `;

            const detailsEl = document.createElement('div');
            if (showDetails) {
                detailsEl.innerHTML = `
                    <div style="background: #f8f9fa; padding: 12px; border-radius: 4px; margin-bottom: 16px;">
                        <strong>Details:</strong><br>
                        • Game Date: ${gameDate}<br>
                        • Players Affected: ${playerCount}<br>
                        • Upload Time: ${new Date(timestamp).toLocaleString()}<br>
                    </div>
                    <p style="color: #856404; font-size: 14px; margin: 0 0 16px 0;">
                        ⚠️ This will revert all player statistics to their state before this upload. This action cannot be undone.
                    </p>
                `;
            }

            const buttonsEl = document.createElement('div');
            buttonsEl.style.cssText = `
                display: flex;
                gap: 12px;
                justify-content: flex-end;
            `;

            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = cancelText;
            cancelBtn.style.cssText = `
                padding: 8px 16px;
                border: 1px solid #ccc;
                background: white;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            `;

            const confirmBtn = document.createElement('button');
            confirmBtn.textContent = confirmText;
            confirmBtn.style.cssText = `
                padding: 8px 16px;
                border: none;
                background: #dc3545;
                color: white;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            `;

            // Event handlers
            const cleanup = () => {
                document.body.removeChild(modal);
            };

            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(false);
            });

            confirmBtn.addEventListener('click', () => {
                cleanup();
                resolve(true);
            });

            // Close on escape key
            const handleKeydown = (e) => {
                if (e.key === 'Escape') {
                    cleanup();
                    resolve(false);
                    document.removeEventListener('keydown', handleKeydown);
                }
            };
            document.addEventListener('keydown', handleKeydown);

            // Close on backdrop click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    cleanup();
                    resolve(false);
                }
            });

            // Assemble dialog
            buttonsEl.appendChild(cancelBtn);
            buttonsEl.appendChild(confirmBtn);
            
            dialog.appendChild(titleEl);
            dialog.appendChild(messageEl);
            dialog.appendChild(detailsEl);
            dialog.appendChild(buttonsEl);
            
            modal.appendChild(dialog);
            document.body.appendChild(modal);

            // Focus confirm button
            confirmBtn.focus();
        });
    }

    /**
     * Perform undo with built-in confirmation dialog
     * @param {DatabaseManager} databaseManager - Database manager instance
     * @param {Object} options - Options for undo operation
     * @returns {Promise<Object>} Result of undo operation
     */
    async performUndoWithConfirmation(databaseManager, options = {}) {
        const {
            useCustomDialog = false,
            progressCallback = null,
            backupId = null
        } = options;

        try {
            // Get backup info for confirmation
            const backup = backupId ? this.getBackupById(backupId) : this.getLatestBackup();
            
            if (!backup) {
                throw new Error('No backup available for undo operation');
            }

            // Show confirmation dialog
            const confirmationCallback = useCustomDialog 
                ? (info) => this.showCustomUndoConfirmation(info, options)
                : (info) => this.showUndoConfirmation(info);

            // Perform undo with confirmation
            return await this.performUndo(databaseManager, {
                confirmationCallback,
                progressCallback,
                backupId
            });

        } catch (error) {
            console.error('Undo with confirmation failed:', error);
            return {
                success: false,
                error: error.message,
                message: `Undo operation failed: ${error.message}`
            };
        }
    }

    /**
     * Get detailed undo preview information
     * @param {string} backupId - Optional backup ID, uses latest if not provided
     * @returns {Object|null} Preview information or null if no backup
     */
    getUndoPreview(backupId = null) {
        try {
            const backup = backupId ? this.getBackupById(backupId) : this.getLatestBackup();
            
            if (!backup) {
                return null;
            }

            const playerKeys = Object.keys(backup.backupData);
            const playerPreviews = {};

            // Create preview for each player
            for (const playerKey of playerKeys) {
                const playerData = backup.backupData[playerKey];
                playerPreviews[playerKey] = {
                    net: playerData.net || 0,
                    gamesPlayed: playerData.games_played ? playerData.games_played.length : 0,
                    biggestWin: playerData.biggest_win || 0,
                    biggestLoss: playerData.biggest_loss || 0,
                    averageNet: playerData.average_net || 0
                };
            }

            return {
                backupId: backup.id,
                gameDate: backup.gameDate,
                playerCount: backup.playerCount,
                timestamp: backup.timestamp,
                playerPreviews,
                totalPlayers: playerKeys.length
            };

        } catch (error) {
            console.error('Error getting undo preview:', error);
            return null;
        }
    }

    /**
     * Check if undo operation is safe to perform
     * @param {DatabaseManager} databaseManager - Database manager instance
     * @param {string} backupId - Optional backup ID, uses latest if not provided
     * @returns {Promise<Object>} Safety check result
     */
    async checkUndoSafety(databaseManager, backupId = null) {
        if (!databaseManager) {
            throw new Error('DatabaseManager instance is required');
        }

        try {
            const backup = backupId ? this.getBackupById(backupId) : this.getLatestBackup();
            
            if (!backup) {
                return {
                    safe: false,
                    reason: 'No backup available',
                    issues: ['No backup data found']
                };
            }

            const issues = [];
            const playerKeys = Object.keys(backup.backupData);

            // Check if all players still exist
            for (const playerKey of playerKeys) {
                const exists = await databaseManager.playerExists(playerKey);
                if (!exists) {
                    issues.push(`Player "${playerKey}" no longer exists in database`);
                }
            }

            // Validate backup data
            const validation = this.validateBackupData(backup);
            if (!validation.isValid) {
                issues.push(...validation.errors);
            }

            // Check database connectivity
            const connected = await databaseManager.testConnection();
            if (!connected) {
                issues.push('Database connection unavailable');
            }

            return {
                safe: issues.length === 0,
                reason: issues.length > 0 ? 'Safety issues detected' : 'Safe to undo',
                issues,
                playerCount: playerKeys.length,
                gameDate: backup.gameDate
            };

        } catch (error) {
            console.error('Error checking undo safety:', error);
            return {
                safe: false,
                reason: 'Error during safety check',
                issues: [error.message]
            };
        }
    }
}

// Export for use in other modules
window.UndoManager = UndoManager;