/**
 * Debug Manager
 * Provides centralized debug logging that can be controlled from the browser console
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
        
        // Make debug manager globally accessible
        if (typeof window !== 'undefined') {
            window.debug = this;
        }
        
        console.log('🐛 Debug Manager initialized. Use window.debug to control logging.');
        console.log('Available modes:', Object.keys(this.debugModes));
        console.log('Examples:');
        console.log('  window.debug.enable("playerMatching")');
        console.log('  window.debug.enable("all")');
        console.log('  window.debug.disable("all")');
        console.log('  window.debug.status()');
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

// Create global instance
const debugManager = new DebugManager();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.DebugManager = DebugManager;
    window.debugManager = debugManager;
} else {
    // For Node.js environments (testing)
    global.debugManager = debugManager;
}