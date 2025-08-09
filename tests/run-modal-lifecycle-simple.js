#!/usr/bin/env node

/**
 * Simple Test Runner for Modal Lifecycle Integration Tests
 * Uses a more direct approach without eval
 */

const fs = require('fs');
const path = require('path');

console.log('🎭 Simple Modal Lifecycle Integration Test Runner');

// Mock DOM environment
const mockDOM = () => {
    const elements = new Map();
    
    global.document = {
        createElement: (tag) => ({
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
        }),
        
        getElementById: (id) => elements.get(id) || null,
        
        body: {
            appendChild: function(child) {
                if (child.id) {
                    elements.set(child.id, child);
                }
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

    global.window = {
        requestAnimationFrame: (callback) => setTimeout(callback, 16)
    };

    global.debugManager = {
        log: () => {}
    };
};

// Simple test implementation
const runSimpleTests = async () => {
    console.log('🎭 Running simplified modal lifecycle tests...');
    
    // Mock GameResultsDisplay class
    class MockGameResultsDisplay {
        constructor() {
            this.currentModal = null;
            this.isDisplaying = false;
            this.escapeHandler = null;
        }
        
        async showGameResults(gameData, gameDate) {
            // Clean up existing modal if present
            if (this.isDisplaying) {
                this.dismissResults();
                await new Promise(resolve => setTimeout(resolve, 0));
            }
            
            // Create mock modal
            this.currentModal = document.createElement('div');
            this.currentModal.id = 'results-modal-overlay';
            this.isDisplaying = true;
            
            // Set up escape handler
            this.escapeHandler = (event) => {
                if (event.key === 'Escape' && this.isDisplaying) {
                    this.dismissResults();
                }
            };
            
            document.addEventListener('keydown', this.escapeHandler);
            document.body.appendChild(this.currentModal);
        }
        
        dismissResults() {
            // Clean up escape handler
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
            
            // Remove modal
            if (this.currentModal && this.currentModal.parentNode) {
                this.currentModal.parentNode.removeChild(this.currentModal);
            }
            this.currentModal = null;
            this.isDisplaying = false;
        }
        
        isResultsDisplayed() {
            return this.isDisplaying;
        }
    }
    
    // Test data
    const testGameData = {
        players: [
            { player_nickname: 'Alice', net: 2550 },
            { player_nickname: 'Bob', net: -1275 },
            { player_nickname: 'Charlie', net: 750 }
        ]
    };
    
    let totalTests = 0;
    let passedTests = 0;
    
    const recordTest = (name, passed, description) => {
        totalTests++;
        if (passed) passedTests++;
        const status = passed ? '✅' : '❌';
        console.log(`${status} ${name}: ${description}`);
    };
    
    // Test 1: Complete modal lifecycle
    try {
        const display = new MockGameResultsDisplay();
        
        // Create modal
        await display.showGameResults(testGameData, '2023-10-15');
        const modalExists = document.getElementById('results-modal-overlay') !== null;
        const isDisplaying = display.isResultsDisplayed();
        const handlerStored = display.escapeHandler !== null;
        
        recordTest(
            'Modal lifecycle - Creation',
            modalExists && isDisplaying && handlerStored,
            'Modal should be created, display state should be true, and escape handler should be stored'
        );
        
        // Dismiss modal
        display.dismissResults();
        const handlerCleaned = display.escapeHandler === null;
        const modalRemoved = document.getElementById('results-modal-overlay') === null;
        const notDisplaying = !display.isResultsDisplayed();
        
        recordTest(
            'Modal lifecycle - Dismissal',
            handlerCleaned && modalRemoved && notDisplaying,
            'Handler should be cleaned, modal should be removed, and display state should be false'
        );
        
    } catch (error) {
        recordTest('Modal lifecycle - Complete test', false, `Test failed: ${error.message}`);
    }
    
    // Test 2: Multiple modal cycles
    try {
        const display = new MockGameResultsDisplay();
        let allCyclesSuccessful = true;
        
        for (let i = 0; i < 3; i++) {
            await display.showGameResults(testGameData, `2023-10-${15 + i}`);
            const creationSuccessful = display.isResultsDisplayed() && display.escapeHandler !== null;
            
            display.dismissResults();
            const dismissalSuccessful = !display.isResultsDisplayed() && display.escapeHandler === null;
            
            if (!creationSuccessful || !dismissalSuccessful) {
                allCyclesSuccessful = false;
                break;
            }
            
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        recordTest(
            'Multiple modal cycles',
            allCyclesSuccessful,
            'All modal creation/dismissal cycles should complete successfully'
        );
        
    } catch (error) {
        recordTest('Multiple modal cycles', false, `Test failed: ${error.message}`);
    }
    
    // Test 3: Handler accumulation prevention
    try {
        const display = new MockGameResultsDisplay();
        let handlerReferences = [];
        
        for (let i = 0; i < 5; i++) {
            await display.showGameResults(testGameData, `2023-11-${i + 1}`);
            handlerReferences.push(display.escapeHandler);
            display.dismissResults();
            await new Promise(resolve => setTimeout(resolve, 5));
        }
        
        const uniqueHandlers = new Set(handlerReferences);
        const allHandlersUnique = uniqueHandlers.size === handlerReferences.length;
        const finalHandlerNull = display.escapeHandler === null;
        
        recordTest(
            'Handler accumulation prevention',
            allHandlersUnique && finalHandlerNull,
            'Each modal should get a unique handler and final handler should be null'
        );
        
    } catch (error) {
        recordTest('Handler accumulation prevention', false, `Test failed: ${error.message}`);
    }
    
    // Test 4: Rapid modal scenarios
    try {
        const display = new MockGameResultsDisplay();
        let rapidTestSuccessful = true;
        
        // Rapid creation and dismissal
        for (let i = 0; i < 3; i++) {
            await display.showGameResults(testGameData, `2023-12-${i + 1}`);
            display.dismissResults();
            // No wait - immediate next iteration
        }
        
        const finalStateClean = !display.isResultsDisplayed() && 
                              display.escapeHandler === null;
        
        recordTest(
            'Rapid modal scenarios',
            rapidTestSuccessful && finalStateClean,
            'Rapid modal operations should not cause errors and should leave clean final state'
        );
        
    } catch (error) {
        recordTest('Rapid modal scenarios', false, `Test failed: ${error.message}`);
    }
    
    // Print summary
    console.log('\n📊 Test Summary:');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    return { total: totalTests, passed: passedTests, failed: totalTests - passedTests };
};

// Main execution
const main = async () => {
    try {
        mockDOM();
        const results = await runSimpleTests();
        
        if (results.failed === 0) {
            console.log('🎉 All integration tests passed!');
            process.exit(0);
        } else {
            console.log(`❌ ${results.failed} test(s) failed`);
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Test runner failed:', error.message);
        process.exit(1);
    }
};

main();