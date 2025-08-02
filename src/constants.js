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

// Other database constants
const DATABASE_CONSTANTS = {
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3
};

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  // Node.js export
  module.exports = {
    COLLECTIONS,
    DATABASE_CONSTANTS,
    isDevelopment
  };
  // Also set as globals for eval context
  global.COLLECTIONS = COLLECTIONS;
  global.DATABASE_CONSTANTS = DATABASE_CONSTANTS;
  global.isDevelopment = isDevelopment;
} else {
  // Browser export
  window.COLLECTIONS = COLLECTIONS;
  window.DATABASE_CONSTANTS = DATABASE_CONSTANTS;
  window.isDevelopment = isDevelopment;
}

console.log(`📋 Constants loaded - Environment: ${isDevelopment() ? 'development' : 'production'}, Players Collection: ${COLLECTIONS.PLAYERS}`);