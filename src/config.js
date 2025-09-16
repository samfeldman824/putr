/**
 * Application Constants
 * Single source of truth for all constant values used across the application
 */

// Environment detection
const isDevelopment = () => {
  if (typeof window !== 'undefined' && window.location) {
    // Browser environment
    return window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.search.includes('dev=true');
  } else {
    // Node.js environment or testing
    return process.env.NODE_ENV === 'development';
  }
};

// Database Collection Names - SINGLE SOURCE OF TRUTH
const COLLECTIONS = {
  PLAYERS: isDevelopment() ? 'players-dev' : 'players'
};

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  // Node.js export
  module.exports = {
    COLLECTIONS,
    isDevelopment
  };
}

console.log(`Players Collection: ${COLLECTIONS.PLAYERS}`);