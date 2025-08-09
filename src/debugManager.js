/**
 * Debug Manager
 * Provides centralized debug logging that can be controlled from the browser console
 * 
 * Usage Examples:
 * - window.debug.enable("playerMatching")  // Enable specific debug mode
 * - window.debug.enable("all")             // Enable all debug modes
 * - window.debug.disable("csvProcessing")  // Disable specific debug mode
 * - window.debug.disable("all")            // Disable all debug modes
 * - window.debug.toggle("upload")          // Toggle a debug mode on/off
 * - window.debug.status()                  // Show current status of all modes
 * - window.debug.isEnabled("database")     // Check if a mode is enabled
 * 
 * Available Debug Modes:
 * - playerMatching: Debug logs for player matching functionality
 * - csvProcessing: Debug logs for CSV file processing
 * - gameResults: Debug logs for game results handling
 * - upload: Debug logs for upload operations
 * - database: Debug logs for database operations
 * - all: Master switch that enables/disables all debug modes
 * 
 * In your code, use debugManager.log(), debugManager.warn(), or debugManager.error()
 * to conditionally log messages based on enabled debug modes.
 */

class DebugManager {
    constructor() {
        this.debugModes = {
            playerMatching: false,
            csvProcessing: false,
            gameResults: false,
            upload: false,
            database: false,
            all: false
        };

        // Make debug manager globally accessible as window.debug
        // This allows developers to control debugging from browser console
        // Example: window.debug.enable("playerMatching")
        if (typeof window !== 'undefined') {
            window.debug = this;
        }

        console.log('🐛 Debug Manager initialized. Use window.debug to control logging.');
    }

    /**
     * Enable debug mode for a specific category or all
     * @param {string} mode - Debug mode to enable
     */
    enable(mode) {
        if (mode === 'all') {
            Object.keys(this.debugModes).forEach(key => {
                this.debugModes[key] = true;
            });
            console.log('🐛 All debug modes enabled');
        } else if (this.debugModes.hasOwnProperty(mode)) {
            this.debugModes[mode] = true;
            console.log(`🐛 Debug mode '${mode}' enabled`);
        } else {
            console.warn(`🐛 Unknown debug mode: ${mode}`);
            console.log('Available modes:', Object.keys(this.debugModes));
        }
        return this;
    }

    /**
     * Disable debug mode for a specific category or all
     * @param {string} mode - Debug mode to disable
     */
    disable(mode) {
        if (mode === 'all') {
            Object.keys(this.debugModes).forEach(key => {
                this.debugModes[key] = false;
            });
            console.log('🐛 All debug modes disabled');
        } else if (this.debugModes.hasOwnProperty(mode)) {
            this.debugModes[mode] = false;
            console.log(`🐛 Debug mode '${mode}' disabled`);
        } else {
            console.warn(`🐛 Unknown debug mode: ${mode}`);
        }
        return this;
    }

    /**
     * Check if a debug mode is enabled
     * @param {string} mode - Debug mode to check
     * @returns {boolean} True if enabled
     */
    isEnabled(mode) {
        return this.debugModes.all || this.debugModes[mode] || false;
    }

    /**
     * Log a debug message if the mode is enabled
     * @param {string} mode - Debug mode category
     * @param {string} message - Message to log
     * @param {...any} args - Additional arguments to log
     */
    log(mode, message, ...args) {
        if (this.isEnabled(mode)) {
            console.log(`🐛 [${mode}] ${message}`, ...args);
        }
    }

    /**
     * Log a debug warning if the mode is enabled
     * @param {string} mode - Debug mode category
     * @param {string} message - Message to log
     * @param {...any} args - Additional arguments to log
     */
    warn(mode, message, ...args) {
        if (this.isEnabled(mode)) {
            console.warn(`🐛 [${mode}] ${message}`, ...args);
        }
    }

    /**
     * Log a debug error if the mode is enabled
     * @param {string} mode - Debug mode category
     * @param {string} message - Message to log
     * @param {...any} args - Additional arguments to log
     */
    error(mode, message, ...args) {
        if (this.isEnabled(mode)) {
            console.error(`🐛 [${mode}] ${message}`, ...args);
        }
    }

    /**
     * Show current debug status
     */
    status() {
        console.log('🐛 Debug Manager Status:');
        Object.entries(this.debugModes).forEach(([mode, enabled]) => {
            console.log(`  ${mode}: ${enabled ? '✅ enabled' : '❌ disabled'}`);
        });
        return this.debugModes;
    }

    /**
     * Toggle a debug mode
     * @param {string} mode - Debug mode to toggle
     */
    toggle(mode) {
        if (this.debugModes.hasOwnProperty(mode)) {
            this.debugModes[mode] = !this.debugModes[mode];
            console.log(`🐛 Debug mode '${mode}' ${this.debugModes[mode] ? 'enabled' : 'disabled'}`);
        } else {
            console.warn(`🐛 Unknown debug mode: ${mode}`);
        }
        return this;
    }
}

// Create global instance - this automatically makes window.debug available
const debugManager = new DebugManager();

// Export for use in other modules
// window.debug points to the debugManager instance for console control
// window.debugManager provides direct access to the instance
if (typeof window !== 'undefined') {
    window.DebugManager = DebugManager;
    window.debugManager = debugManager;
} else {
    // For Node.js environments (testing)
    global.debugManager = debugManager;
}