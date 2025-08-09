#!/usr/bin/env node

/**
 * Test runner for Escape Handler Cleanup functionality
 */

const fs = require('fs');

// Mock DOM environment
const mockElements = new Map();

global.document = {
    createElement: (tag) => {
        const element = {
            tagName: tag.toUpperCase(),
            className: '',
            id: '',
            innerHTML: '',
            textContent: '',
            classList: {
                add: () => {},
                remove: () => {},
                contains: () => false
            },
            addEventListener: () => {},
            removeEventListener: () => {},
            appendChild: (child) => {
                if (child && child.id) {
                    mockElements.set(child.id, child);
                }
            },
            querySelector: () => null,
            parentNode: { 
                removeChild: (child) => {
                    if (child && child.id) {
                        mockElements.delete(child.id);
                    }
                }
            }
        };
        
        // Mock textContent setter for HTML escaping
        Object.defineProperty(element, 'textContent', {
            get: function() { return this._textContent || ''; },
            set: function(value) { 
                this._textContent = value;
                this.innerHTML = String(value)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#x27;');
            }
        });
        
        return element;
    },
    body: {
        appendChild: (child) => {
            if (child && child.id) {
                mockElements.set(child.id, child);
            }
        }
    },
    getElementById: (id) => mockElements.get(id) || null,
    addEventListener: () => {},
    removeEventListener: () => {}
};

global.window = global;
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);

// Load the DebugManager first
const debugManagerCode = fs.readFileSync('src/debugManager.js', 'utf8');
eval(debugManagerCode);

// Load the GameResultsDisplay class
const gameResultsCode = fs.readFileSync('src/gameResultsDisplay.js', 'utf8');
eval(gameResultsCode);

// Load and run escape handler cleanup tests
const testCode = fs.readFileSync('tests/test-escape-handler-cleanup.js', 'utf8');
eval(testCode);

// Run tests
async function runTests() {
    try {
        const tests = new EscapeHandlerCleanupTests();
        const summary = await tests.runAllTests();
        
        console.log('\n🏁 Test execution completed!');
        console.log(`Final Results: ${summary.passed}/${summary.total} tests passed (${summary.successRate.toFixed(1)}%)`);
        
        if (summary.failed > 0) {
            console.log('❌ Some tests failed. Check the output above for details.');
            process.exit(1);
        } else {
            console.log('✅ All escape handler cleanup tests passed!');
            process.exit(0);
        }
    } catch (error) {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    }
}

runTests();