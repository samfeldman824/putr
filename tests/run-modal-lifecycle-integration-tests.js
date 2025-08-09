#!/usr/bin/env node

/**
 * Test Runner for Modal Lifecycle Integration Tests
 * Runs the integration tests for modal lifecycle and handler management
 */

const fs = require('fs');
const path = require('path');

// Set NODE_ENV to development for testing
process.env.NODE_ENV = 'development';

// Resolve paths relative to project root
const projectRoot = path.join(__dirname, '..');
const srcPath = path.join(projectRoot, 'src');
const testsPath = path.join(projectRoot, 'tests');

console.log('🎭 Modal Lifecycle Integration Test Runner');
console.log(`📁 Project Root: ${projectRoot}`);

/**
 * Load required modules and set up test environment
 */
function setupTestEnvironment() {
    try {
        // Mock DOM environment
        global.document = {
            createElement: (tag) => ({
                className: '',
                id: '',
                innerHTML: '',
                appendChild: () => {},
                addEventListener: () => {},
                querySelector: () => null,
                click: () => {}
            }),
            getElementById: () => null,
            body: {
                appendChild: () => {}
            },
            addEventListener: () => {},
            removeEventListener: () => {}
        };

        global.window = {
            requestAnimationFrame: (callback) => setTimeout(callback, 16)
        };

        // Mock console for debugging
        global.debugManager = {
            log: () => {}
        };

        // Load constants with safer evaluation
        const constantsCode = fs.readFileSync(path.join(srcPath, 'constants.js'), 'utf8');
        // Set up basic constants manually to avoid eval issues
        global.COLLECTIONS = { PLAYERS: 'players-dev' };
        global.DATABASE_CONSTANTS = { TIMEOUT: 10000, RETRY_ATTEMPTS: 3 };
        global.isDevelopment = () => true;

        // Load GameResultsDisplay manually
        const GameResultsDisplay = require('./mock-game-results-display.js');
        global.GameResultsDisplay = GameResultsDisplay;

        // Load integration test code manually
        const ModalLifecycleIntegrationTests = require('./mock-modal-lifecycle-tests.js');
        global.ModalLifecycleIntegrationTests = ModalLifecycleIntegrationTests;

        return true;
    } catch (error) {
        console.error('❌ Failed to setup test environment:', error.message);
        return false;
    }
}

/**
 * Enhanced DOM mock for modal lifecycle tests
 */
function setupEnhancedDOMEnvironment() {
    const elements = new Map();
    let elementIdCounter = 0;

    global.document = {
        createElement: (tag) => {
            const element = {
                tagName: tag.toUpperCase(),
                className: '',
                id: '',
                innerHTML: '',
                parentNode: null,
                children: [],
                eventListeners: new Map(),
                
                appendChild: function(child) {
                    this.children.push(child);
                    child.parentNode = this;
                },
                
                addEventListener: function(event, handler) {
                    if (!this.eventListeners.has(event)) {
                        this.eventListeners.set(event, []);
                    }
                    this.eventListeners.get(event).push(handler);
                },
                
                removeEventListener: function(event, handler) {
                    if (this.eventListeners.has(event)) {
                        const handlers = this.eventListeners.get(event);
                        const index = handlers.indexOf(handler);
                        if (index > -1) {
                            handlers.splice(index, 1);
                        }
                    }
                },
                
                querySelector: function(selector) {
                    if (selector.startsWith('#')) {
                        const id = selector.substring(1);
                        return elements.get(id) || null;
                    }
                    return null;
                },
                
                click: function() {
                    if (this.eventListeners.has('click')) {
                        this.eventListeners.get('click').forEach(handler => {
                            try {
                                handler({ target: this });
                            } catch (error) {
                                console.warn('Click handler error:', error);
                            }
                        });
                    }
                }
            };
            
            return element;
        },
        
        getElementById: (id) => {
            return elements.get(id) || null;
        },
        
        body: {
            appendChild: function(child) {
                if (child.id) {
                    elements.set(child.id, child);
                }
                // Simulate adding to DOM
                child.parentNode = this;
            },
            
            removeChild: function(child) {
                if (child.id) {
                    elements.delete(child.id);
                }
                child.parentNode = null;
            }
        },
        
        eventListeners: new Map(),
        
        addEventListener: function(event, handler) {
            if (!this.eventListeners.has(event)) {
                this.eventListeners.set(event, []);
            }
            this.eventListeners.get(event).push(handler);
        },
        
        removeEventListener: function(event, handler) {
            if (this.eventListeners.has(event)) {
                const handlers = this.eventListeners.get(event);
                const index = handlers.indexOf(handler);
                if (index > -1) {
                    handlers.splice(index, 1);
                }
            }
        }
    };

    // Override getElementById to work with our element tracking
    const originalCreateElement = global.document.createElement;
    global.document.createElement = function(tag) {
        const element = originalCreateElement.call(this, tag);
        
        // Override id setter to track elements
        Object.defineProperty(element, 'id', {
            get: function() { return this._id || ''; },
            set: function(value) {
                if (this._id) {
                    elements.delete(this._id);
                }
                this._id = value;
                if (value) {
                    elements.set(value, this);
                }
            }
        });
        
        return element;
    };
}

/**
 * Run the modal lifecycle integration tests
 */
async function runModalLifecycleTests() {
    try {
        console.log('\n🎭 Setting up enhanced DOM environment...');
        setupEnhancedDOMEnvironment();
        
        console.log('🎭 Running Modal Lifecycle Integration Tests...');
        console.log('='.repeat(60));
        
        // Create test instance
        const tests = new global.ModalLifecycleIntegrationTests();
        
        // Run all tests
        const summary = await tests.runAllTests();
        
        console.log('\n📊 Modal Lifecycle Integration Test Summary:');
        console.log(`Total Tests: ${summary.total}`);
        console.log(`Passed: ${summary.passed}`);
        console.log(`Failed: ${summary.failed}`);
        console.log(`Success Rate: ${summary.successRate.toFixed(1)}%`);
        
        // Print detailed results for failed tests
        const failedTests = summary.results.filter(test => !test.passed);
        if (failedTests.length > 0) {
            console.log('\n❌ Failed Tests Details:');
            failedTests.forEach(test => {
                console.log(`  - ${test.name}`);
                console.log(`    ${test.description}`);
                if (test.context && Object.keys(test.context).length > 0) {
                    console.log(`    Context:`, JSON.stringify(test.context, null, 2));
                }
            });
        }
        
        // Exit with appropriate code
        process.exit(summary.failed === 0 ? 0 : 1);
        
    } catch (error) {
        console.error('❌ Modal lifecycle integration tests failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

/**
 * Main execution
 */
async function main() {
    if (!setupTestEnvironment()) {
        process.exit(1);
    }
    
    await runModalLifecycleTests();
}

// Run the tests
main();