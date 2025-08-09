/**
 * Node.js Compatible Integration Tests for Modal Lifecycle and Handler Management
 * Tests complete modal lifecycle scenarios and handler management over time
 * Addresses Requirements: 1.4, 1.5, 3.3, 3.4
 */

// Mock DOM environment
const mockDOM = () => {
    const elements = new Map();
    
    const createElement = (tag) => {
        const element = {
            tagName: tag.toUpperCase(),
            className: '',
            id: '',
            innerHTML: '',
            parentNode: null,
            children: [],
            eventListeners: new Map(),
            _id: '',
            
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
                    // First check direct children
                    for (const child of this.children) {
                        if (child.id === id) {
                            return child;
                        }
                        // Recursively check child's children
                        const found = child.querySelector(selector);
                        if (found) {
                            return found;
                        }
                    }
                    // Fallback to global elements map
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
        
        // Set up id property with getter/setter
        Object.defineProperty(element, 'id', {
            get: function() { return this._id; },
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
    
    return {
        createElement,
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
};

// Mock GameResultsDisplay class that mimics the real implementation
class MockGameResultsDisplay {
    constructor() {
        this.currentModal = null;
        this.isDisplaying = false;
        this.escapeHandler = null;
    }
    
    async showGameResults(gameData, gameDate) {
        // Clean up existing modal if present (mimics real implementation)
        if (this.isDisplaying) {
            this.dismissResults();
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        // Create mock modal
        this.currentModal = global.document.createElement('div');
        this.currentModal.id = 'results-modal-overlay';
        this.currentModal.className = 'results-modal-overlay';
        
        // Create inner modal
        const innerModal = global.document.createElement('div');
        innerModal.id = 'results-modal';
        
        // Create modal actions div
        const modalActions = global.document.createElement('div');
        modalActions.className = 'modal-actions';
        
        // Create close button
        const closeButton = global.document.createElement('button');
        closeButton.className = 'close-results-btn';
        closeButton.id = 'close-results-btn';
        closeButton.innerHTML = 'Close';
        
        // Build the structure
        modalActions.appendChild(closeButton);
        innerModal.appendChild(modalActions);
        this.currentModal.appendChild(innerModal);
        
        this.isDisplaying = true;
        
        // Set up event listeners (mimics setupModalEventListeners)
        this.setupModalEventListeners();
        
        // Add to DOM
        global.document.body.appendChild(this.currentModal);
    }
    
    setupModalEventListeners() {
        if (!this.currentModal) return;
        
        // Close button
        const closeBtn = this.currentModal.querySelector('#close-results-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.dismissResults());
        }
        
        // Click outside modal to close
        this.currentModal.addEventListener('click', (event) => {
            if (event.target === this.currentModal) {
                this.dismissResults();
            }
        });
        
        // Create escape handler function and store it
        this.escapeHandler = (event) => {
            if (event.key === 'Escape' && this.isDisplaying) {
                this.dismissResults();
            }
        };
        
        // Add the stored handler to document keydown event listener
        global.document.addEventListener('keydown', this.escapeHandler);
    }
    
    dismissResults() {
        // Clean up escape handler at the beginning (mimics real implementation)
        if (this.escapeHandler) {
            try {
                global.document.removeEventListener('keydown', this.escapeHandler);
            } catch (error) {
                console.warn('Could not remove escape handler:', error);
            }
            this.escapeHandler = null;
        }
        
        if (!this.currentModal || !this.isDisplaying) {
            return;
        }
        
        try {
            // Remove modal (simplified - no animation in tests)
            if (this.currentModal && this.currentModal.parentNode) {
                this.currentModal.parentNode.removeChild(this.currentModal);
            }
            this.currentModal = null;
            this.isDisplaying = false;
        } catch (error) {
            console.error('Error dismissing results modal:', error);
            // Force cleanup
            this.currentModal = null;
            this.isDisplaying = false;
        }
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

const alternateGameData = {
    players: [
        { player_nickname: 'Diana', net: 1000 },
        { player_nickname: 'Eve', net: -500 }
    ]
};

/**
 * Modal Lifecycle Integration Tests
 */
class ModalLifecycleIntegrationTests {
    constructor() {
        this.display = new MockGameResultsDisplay();
        this.testResults = [];
        this.totalTests = 0;
        this.passedTests = 0;
    }

    /**
     * Run all modal lifecycle integration tests
     */
    async runAllTests() {
        console.log('🎭 Starting Modal Lifecycle Integration Tests...');
        
        await this.testCompleteModalLifecycle();
        await this.testMultipleModalCycles();
        await this.testHandlerAccumulation();
        await this.testRapidModalScenarios();
        
        this.printTestResults();
        return this.getTestSummary();
    }

    /**
     * Test complete modal lifecycle (create, interact, dismiss)
     * Requirements: 1.4, 1.5
     */
    async testCompleteModalLifecycle() {
        console.log('🔄 Testing complete modal lifecycle...');
        
        try {
            // Phase 1: Modal Creation
            await this.display.showGameResults(testGameData, '2023-10-15');
            
            const modalExists = global.document.getElementById('results-modal-overlay') !== null;
            const isDisplaying = this.display.isResultsDisplayed();
            const handlerStored = this.display.escapeHandler !== null;
            
            this.recordTest(
                'Modal lifecycle - Creation phase',
                modalExists && isDisplaying && handlerStored,
                'Modal should be created, display state should be true, and escape handler should be stored',
                { modalExists, isDisplaying, handlerStored }
            );

            // Phase 2: Modal Interaction - Test close button functionality
            const closeButton = global.document.getElementById('close-results-btn');
            const closeButtonExists = closeButton !== null;
            
            this.recordTest(
                'Modal lifecycle - Interaction elements',
                closeButtonExists,
                'Close button should be present and accessible',
                { closeButtonExists }
            );

            // Phase 3: Modal Dismissal via close button
            if (closeButton) {
                closeButton.click();
            } else {
                // Fallback to direct dismissal
                this.display.dismissResults();
            }
            
            // Check immediate cleanup
            const handlerCleanedImmediately = this.display.escapeHandler === null;
            
            // Wait for any async operations
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const modalRemoved = global.document.getElementById('results-modal-overlay') === null;
            const notDisplaying = !this.display.isResultsDisplayed();
            
            this.recordTest(
                'Modal lifecycle - Dismissal phase',
                handlerCleanedImmediately && modalRemoved && notDisplaying,
                'Handler should be cleaned immediately, modal should be removed, and display state should be false',
                { handlerCleanedImmediately, modalRemoved, notDisplaying }
            );

        } catch (error) {
            this.recordTest(
                'Modal lifecycle - Complete test',
                false,
                `Complete modal lifecycle test failed: ${error.message}`,
                { error: error.message }
            );
        }
    }

    /**
     * Test multiple modal creation/dismissal cycles
     * Requirements: 1.4, 3.3
     */
    async testMultipleModalCycles() {
        console.log('🔁 Testing multiple modal creation/dismissal cycles...');
        
        const cycleCount = 5;
        let allCyclesSuccessful = true;
        let cycleResults = [];
        
        try {
            for (let i = 0; i < cycleCount; i++) {
                const cycleData = i % 2 === 0 ? testGameData : alternateGameData;
                const cycleDate = `2023-10-${15 + i}`;
                
                // Create modal
                await this.display.showGameResults(cycleData, cycleDate);
                
                const modalExists = global.document.getElementById('results-modal-overlay') !== null;
                const isDisplaying = this.display.isResultsDisplayed();
                const handlerStored = this.display.escapeHandler !== null;
                
                const creationSuccessful = modalExists && isDisplaying && handlerStored;
                
                // Dismiss modal
                this.display.dismissResults();
                
                const handlerCleanedImmediately = this.display.escapeHandler === null;
                
                // Wait for cleanup
                await new Promise(resolve => setTimeout(resolve, 10));
                
                const modalRemoved = global.document.getElementById('results-modal-overlay') === null;
                const notDisplaying = !this.display.isResultsDisplayed();
                
                const dismissalSuccessful = handlerCleanedImmediately && modalRemoved && notDisplaying;
                
                const cycleSuccessful = creationSuccessful && dismissalSuccessful;
                cycleResults.push({
                    cycle: i + 1,
                    creation: creationSuccessful,
                    dismissal: dismissalSuccessful,
                    overall: cycleSuccessful
                });
                
                if (!cycleSuccessful) {
                    allCyclesSuccessful = false;
                }
                
                // Small delay between cycles
                await new Promise(resolve => setTimeout(resolve, 5));
            }
            
            this.recordTest(
                'Multiple modal cycles',
                allCyclesSuccessful,
                `All ${cycleCount} modal creation/dismissal cycles should complete successfully`,
                { 
                    cycleCount,
                    allSuccessful: allCyclesSuccessful,
                    cycleResults
                }
            );

        } catch (error) {
            this.recordTest(
                'Multiple modal cycles',
                false,
                `Multiple modal cycles test failed: ${error.message}`,
                { error: error.message, cycleResults }
            );
        }
    }

    /**
     * Test to verify no handler accumulation over time
     * Requirements: 1.5, 3.3
     */
    async testHandlerAccumulation() {
        console.log('📈 Testing handler accumulation prevention...');
        
        try {
            // Create and dismiss multiple modals
            const iterations = 10;
            let handlerReferences = [];
            
            for (let i = 0; i < iterations; i++) {
                await this.display.showGameResults(testGameData, `2023-10-${i + 1}`);
                
                // Store reference to current handler
                handlerReferences.push(this.display.escapeHandler);
                
                // Dismiss modal
                this.display.dismissResults();
                await new Promise(resolve => setTimeout(resolve, 5));
            }
            
            // Check that all handler references are different (no reuse)
            const uniqueHandlers = new Set(handlerReferences);
            const allHandlersUnique = uniqueHandlers.size === handlerReferences.length;
            
            // Verify current handler is null
            const currentHandlerNull = this.display.escapeHandler === null;
            
            this.recordTest(
                'Handler accumulation prevention',
                allHandlersUnique && currentHandlerNull,
                'Each modal should get a unique handler and final handler should be null',
                {
                    iterations,
                    uniqueHandlerCount: uniqueHandlers.size,
                    totalHandlers: handlerReferences.length,
                    allHandlersUnique,
                    currentHandlerNull
                }
            );

        } catch (error) {
            this.recordTest(
                'Handler accumulation prevention',
                false,
                `Handler accumulation test failed: ${error.message}`,
                { error: error.message }
            );
        }
    }

    /**
     * Test rapid modal creation/dismissal scenarios
     * Requirements: 3.4
     */
    async testRapidModalScenarios() {
        console.log('⚡ Testing rapid modal creation/dismissal scenarios...');
        
        try {
            // Test 1: Rapid creation and dismissal without waiting
            let rapidTestSuccessful = true;
            let rapidTestErrors = [];
            
            for (let i = 0; i < 5; i++) {
                try {
                    await this.display.showGameResults(testGameData, `2023-11-${i + 1}`);
                    this.display.dismissResults();
                    // No wait - immediate next iteration
                } catch (error) {
                    rapidTestSuccessful = false;
                    rapidTestErrors.push(`Iteration ${i + 1}: ${error.message}`);
                }
            }
            
            // Wait for all operations to complete
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const finalStateClean = !this.display.isResultsDisplayed() && 
                                  this.display.escapeHandler === null &&
                                  global.document.getElementById('results-modal-overlay') === null;
            
            this.recordTest(
                'Rapid modal creation/dismissal',
                rapidTestSuccessful && finalStateClean,
                'Rapid modal operations should not cause errors and should leave clean final state',
                {
                    rapidTestSuccessful,
                    finalStateClean,
                    errors: rapidTestErrors
                }
            );

            // Test 2: Multiple rapid show calls (should handle existing modal cleanup)
            let multipleShowSuccessful = true;
            let multipleShowErrors = [];
            
            try {
                // Create first modal
                await this.display.showGameResults(testGameData, '2023-11-10');
                const firstHandler = this.display.escapeHandler;
                
                // Immediately create second modal (should trigger cleanup of first)
                await this.display.showGameResults(alternateGameData, '2023-11-11');
                const secondHandler = this.display.escapeHandler;
                
                // Verify handlers are different and second exists
                const handlersAreDifferent = firstHandler !== secondHandler;
                const secondHandlerExists = secondHandler !== null;
                const modalExists = global.document.getElementById('results-modal-overlay') !== null;
                
                multipleShowSuccessful = handlersAreDifferent && secondHandlerExists && modalExists;
                
                // Clean up
                this.display.dismissResults();
                await new Promise(resolve => setTimeout(resolve, 10));
                
            } catch (error) {
                multipleShowSuccessful = false;
                multipleShowErrors.push(error.message);
            }
            
            this.recordTest(
                'Multiple rapid show calls',
                multipleShowSuccessful,
                'Multiple rapid showGameResults calls should properly clean up previous handlers',
                {
                    multipleShowSuccessful,
                    errors: multipleShowErrors
                }
            );

            // Test 3: Rapid dismiss calls (idempotent behavior)
            let rapidDismissSuccessful = true;
            let rapidDismissErrors = [];
            
            try {
                await this.display.showGameResults(testGameData, '2023-11-12');
                
                // Call dismiss multiple times rapidly
                for (let i = 0; i < 5; i++) {
                    this.display.dismissResults();
                }
                
                // Verify no errors and clean state
                const handlerNull = this.display.escapeHandler === null;
                const notDisplaying = !this.display.isResultsDisplayed();
                
                rapidDismissSuccessful = handlerNull && notDisplaying;
                
                // Wait for any remaining operations
                await new Promise(resolve => setTimeout(resolve, 10));
                
            } catch (error) {
                rapidDismissSuccessful = false;
                rapidDismissErrors.push(error.message);
            }
            
            this.recordTest(
                'Rapid dismiss calls',
                rapidDismissSuccessful,
                'Multiple rapid dismissResults calls should be idempotent and not cause errors',
                {
                    rapidDismissSuccessful,
                    errors: rapidDismissErrors
                }
            );

        } catch (error) {
            this.recordTest(
                'Rapid modal scenarios',
                false,
                `Rapid modal scenarios test failed: ${error.message}`,
                { error: error.message }
            );
        }
    }

    /**
     * Record a test result
     */
    recordTest(testName, passed, description, context = {}) {
        this.totalTests++;
        if (passed) {
            this.passedTests++;
        }
        
        this.testResults.push({
            name: testName,
            passed,
            description,
            context
        });

        const status = passed ? '✅' : '❌';
        console.log(`${status} ${testName}: ${description}`);
    }

    /**
     * Print test results summary
     */
    printTestResults() {
        console.log('\n📊 Modal Lifecycle Integration Test Results:');
        console.log(`Total Tests: ${this.totalTests}`);
        console.log(`Passed: ${this.passedTests}`);
        console.log(`Failed: ${this.totalTests - this.passedTests}`);
        console.log(`Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
        
        const failedTests = this.testResults.filter(test => !test.passed);
        if (failedTests.length > 0) {
            console.log('\n❌ Failed Tests:');
            failedTests.forEach(test => {
                console.log(`  - ${test.name}: ${test.description}`);
                if (test.context && Object.keys(test.context).length > 0) {
                    console.log(`    Context:`, test.context);
                }
            });
        }
    }

    /**
     * Get test summary
     */
    getTestSummary() {
        return {
            total: this.totalTests,
            passed: this.passedTests,
            failed: this.totalTests - this.passedTests,
            successRate: (this.passedTests / this.totalTests) * 100,
            results: this.testResults
        };
    }
}

// Main execution function
async function runModalLifecycleIntegrationTests() {
    // Set up mock DOM
    global.document = mockDOM();
    global.window = {
        requestAnimationFrame: (callback) => setTimeout(callback, 16)
    };
    global.debugManager = {
        log: () => {}
    };
    
    console.log('🎭 Modal Lifecycle Integration Test Runner (Node.js)');
    console.log('='.repeat(60));
    
    try {
        const tests = new ModalLifecycleIntegrationTests();
        const summary = await tests.runAllTests();
        
        console.log('\n🏁 Integration tests completed!');
        return summary;
    } catch (error) {
        console.error('❌ Integration tests failed:', error.message);
        throw error;
    }
}

// Export for use as module
module.exports = {
    ModalLifecycleIntegrationTests,
    runModalLifecycleIntegrationTests
};

// Auto-run if called directly
if (require.main === module) {
    runModalLifecycleIntegrationTests()
        .then(summary => {
            if (summary.failed === 0) {
                console.log('🎉 All integration tests passed!');
                process.exit(0);
            } else {
                console.log(`❌ ${summary.failed} test(s) failed`);
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('❌ Test execution failed:', error.message);
            process.exit(1);
        });
}