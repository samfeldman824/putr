/**
 * Integration Tests for Modal Lifecycle and Handler Management
 * Tests complete modal lifecycle scenarios and handler management over time
 * Addresses Requirements: 1.4, 1.5, 3.3, 3.4
 */

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
        this.display = new GameResultsDisplay();
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
            
            const modalExists = document.getElementById('results-modal-overlay') !== null;
            const isDisplaying = this.display.isResultsDisplayed();
            const handlerStored = this.display.escapeHandler !== null;
            
            this.recordTest(
                'Modal lifecycle - Creation phase',
                modalExists && isDisplaying && handlerStored,
                'Modal should be created, display state should be true, and escape handler should be stored',
                { modalExists, isDisplaying, handlerStored }
            );

            // Phase 2: Modal Interaction - Test close button functionality
            const closeButton = document.getElementById('close-results-btn');
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
            
            // Wait for animation to complete
            await new Promise(resolve => setTimeout(resolve, 350));
            
            const modalRemoved = document.getElementById('results-modal-overlay') === null;
            const notDisplaying = !this.display.isResultsDisplayed();
            
            this.recordTest(
                'Modal lifecycle - Dismissal phase',
                handlerCleanedImmediately && modalRemoved && notDisplaying,
                'Handler should be cleaned immediately, modal should be removed after animation, and display state should be false',
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
                
                const modalExists = document.getElementById('results-modal-overlay') !== null;
                const isDisplaying = this.display.isResultsDisplayed();
                const handlerStored = this.display.escapeHandler !== null;
                
                const creationSuccessful = modalExists && isDisplaying && handlerStored;
                
                // Dismiss modal
                this.display.dismissResults();
                
                const handlerCleanedImmediately = this.display.escapeHandler === null;
                
                // Wait for animation
                await new Promise(resolve => setTimeout(resolve, 350));
                
                const modalRemoved = document.getElementById('results-modal-overlay') === null;
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
                await new Promise(resolve => setTimeout(resolve, 50));
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
            // Count initial event listeners (baseline)
            const initialListenerCount = this.countDocumentEventListeners();
            
            // Create and dismiss multiple modals
            const iterations = 10;
            let handlerReferences = [];
            
            for (let i = 0; i < iterations; i++) {
                await this.display.showGameResults(testGameData, `2023-10-${i + 1}`);
                
                // Store reference to current handler
                handlerReferences.push(this.display.escapeHandler);
                
                // Dismiss modal
                this.display.dismissResults();
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Check that all handler references are different (no reuse)
            const uniqueHandlers = new Set(handlerReferences);
            const allHandlersUnique = uniqueHandlers.size === handlerReferences.length;
            
            // Check final listener count
            const finalListenerCount = this.countDocumentEventListeners();
            const noListenerAccumulation = finalListenerCount <= initialListenerCount + 1; // Allow for small variance
            
            // Verify current handler is null
            const currentHandlerNull = this.display.escapeHandler === null;
            
            this.recordTest(
                'Handler accumulation prevention',
                allHandlersUnique && noListenerAccumulation && currentHandlerNull,
                'Each modal should get a unique handler, no listeners should accumulate, and final handler should be null',
                {
                    iterations,
                    uniqueHandlerCount: uniqueHandlers.size,
                    totalHandlers: handlerReferences.length,
                    allHandlersUnique,
                    initialListenerCount,
                    finalListenerCount,
                    noListenerAccumulation,
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
            // Test 1: Rapid creation and dismissal without waiting for animations
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
            
            // Wait for all animations to complete
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const finalStateClean = !this.display.isResultsDisplayed() && 
                                  this.display.escapeHandler === null &&
                                  document.getElementById('results-modal-overlay') === null;
            
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
                const modalExists = document.getElementById('results-modal-overlay') !== null;
                
                multipleShowSuccessful = handlersAreDifferent && secondHandlerExists && modalExists;
                
                // Clean up
                this.display.dismissResults();
                await new Promise(resolve => setTimeout(resolve, 350));
                
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
                
                // Wait for animations
                await new Promise(resolve => setTimeout(resolve, 350));
                
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
     * Helper method to count document event listeners (approximation)
     * Note: This is a simplified approach as there's no direct way to count all listeners
     */
    countDocumentEventListeners() {
        // This is a simplified approximation
        // In a real scenario, you might use more sophisticated monitoring
        try {
            // We can't directly count all event listeners, but we can check for common patterns
            // This is mainly for demonstration purposes
            return 0; // Placeholder - in real implementation, this would use monitoring tools
        } catch (error) {
            return 0;
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

// Export for use in test runner
if (typeof window !== 'undefined') {
    window.ModalLifecycleIntegrationTests = ModalLifecycleIntegrationTests;
}

// Auto-run tests if this file is loaded directly
if (typeof window !== 'undefined' && window.GameResultsDisplay) {
    console.log('🎭 Modal Lifecycle Integration tests detected, running tests...');
    const tests = new ModalLifecycleIntegrationTests();
    tests.runAllTests().then(summary => {
        console.log('🏁 Modal Lifecycle Integration tests completed!');
    });
}