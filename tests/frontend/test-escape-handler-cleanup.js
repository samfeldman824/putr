/**
 * Unit Tests for Escape Handler Cleanup Functionality
 * Tests the memory leak fix for escape key event handlers in GameResultsDisplay
 */

// Test data
const testGameData = {
    players: [
        { player_nickname: 'Alice', net: 2550 },
        { player_nickname: 'Bob', net: -1275 },
        { player_nickname: 'Charlie', net: 750 }
    ]
};

/**
 * Escape Handler Cleanup Tests
 */
class EscapeHandlerCleanupTests {
    constructor() {
        this.display = new GameResultsDisplay();
        this.testResults = [];
        this.totalTests = 0;
        this.passedTests = 0;
    }

    /**
     * Run all escape handler cleanup tests
     */
    async runAllTests() {
        console.log('🔑 Starting Escape Handler Cleanup Tests...');
        
        await this.testEscapeHandlerCleanup();
        
        this.printTestResults();
        return this.getTestSummary();
    }

    /**
     * Test escape handler cleanup functionality
     */
    async testEscapeHandlerCleanup() {
        console.log('🔑 Testing escape handler cleanup functionality...');
        
        // Test 1: Verify escapeHandler property is initialized correctly
        const freshDisplay = new GameResultsDisplay();
        this.recordTest(
            'EscapeHandler property initialization',
            freshDisplay.escapeHandler === null,
            'escapeHandler should be initialized as null in constructor',
            { initialValue: freshDisplay.escapeHandler }
        );

        // Test 2: Verify escape handler is stored when modal is created
        try {
            await this.display.showGameResults(testGameData, '2023-10-15');
            
            const handlerStored = this.display.escapeHandler !== null && typeof this.display.escapeHandler === 'function';
            this.recordTest(
                'Escape handler storage on modal creation',
                handlerStored,
                'escapeHandler should be stored as a function when modal is created',
                { 
                    handlerExists: this.display.escapeHandler !== null,
                    handlerType: typeof this.display.escapeHandler
                }
            );

            // Clean up for next test
            this.display.dismissResults();
            await new Promise(resolve => setTimeout(resolve, 350));
            
        } catch (error) {
            this.recordTest(
                'Escape handler storage on modal creation',
                false,
                `Failed to test escape handler storage: ${error.message}`,
                { error: error.message }
            );
        }

        // Test 3: Verify escape handler is cleaned up when modal is dismissed via close button
        try {
            await this.display.showGameResults(testGameData, '2023-10-15');
            
            // Verify handler is stored
            const handlerStoredBeforeClose = this.display.escapeHandler !== null;
            
            // Simulate close button click by calling dismissResults directly
            this.display.dismissResults();
            
            // Check if handler is cleaned up immediately (before animation)
            const handlerCleanedAfterClose = this.display.escapeHandler === null;
            
            this.recordTest(
                'Escape handler cleanup via close button',
                handlerStoredBeforeClose && handlerCleanedAfterClose,
                'escapeHandler should be cleaned up when modal is dismissed via close button',
                { 
                    handlerStoredBefore: handlerStoredBeforeClose,
                    handlerCleanedAfter: handlerCleanedAfterClose
                }
            );

            // Wait for animation to complete
            await new Promise(resolve => setTimeout(resolve, 350));
            
        } catch (error) {
            this.recordTest(
                'Escape handler cleanup via close button',
                false,
                `Failed to test close button cleanup: ${error.message}`,
                { error: error.message }
            );
        }

        // Test 4: Verify escape handler is cleaned up when modal is dismissed by clicking outside
        try {
            await this.display.showGameResults(testGameData, '2023-10-15');
            
            // Verify handler is stored
            const handlerStoredBeforeOutsideClick = this.display.escapeHandler !== null;
            
            // Simulate clicking outside by calling dismissResults (same cleanup path)
            this.display.dismissResults();
            
            // Check if handler is cleaned up
            const handlerCleanedAfterOutsideClick = this.display.escapeHandler === null;
            
            this.recordTest(
                'Escape handler cleanup via clicking outside',
                handlerStoredBeforeOutsideClick && handlerCleanedAfterOutsideClick,
                'escapeHandler should be cleaned up when modal is dismissed by clicking outside',
                { 
                    handlerStoredBefore: handlerStoredBeforeOutsideClick,
                    handlerCleanedAfter: handlerCleanedAfterOutsideClick
                }
            );

            // Wait for animation to complete
            await new Promise(resolve => setTimeout(resolve, 350));
            
        } catch (error) {
            this.recordTest(
                'Escape handler cleanup via clicking outside',
                false,
                `Failed to test outside click cleanup: ${error.message}`,
                { error: error.message }
            );
        }

        // Test 5: Verify escape handler is cleaned up when modal is dismissed via escape key
        try {
            await this.display.showGameResults(testGameData, '2023-10-15');
            
            // Verify handler is stored
            const handlerStoredBeforeEscape = this.display.escapeHandler !== null;
            
            // Simulate escape key press by calling the handler directly
            if (this.display.escapeHandler) {
                const mockEscapeEvent = { key: 'Escape' };
                this.display.escapeHandler(mockEscapeEvent);
            }
            
            // Check if handler is cleaned up
            const handlerCleanedAfterEscape = this.display.escapeHandler === null;
            
            this.recordTest(
                'Escape handler cleanup via escape key',
                handlerStoredBeforeEscape && handlerCleanedAfterEscape,
                'escapeHandler should be cleaned up when modal is dismissed via escape key',
                { 
                    handlerStoredBefore: handlerStoredBeforeEscape,
                    handlerCleanedAfter: handlerCleanedAfterEscape
                }
            );

            // Wait for animation to complete
            await new Promise(resolve => setTimeout(resolve, 350));
            
        } catch (error) {
            this.recordTest(
                'Escape handler cleanup via escape key',
                false,
                `Failed to test escape key cleanup: ${error.message}`,
                { error: error.message }
            );
        }

        // Test 6: Verify multiple calls to dismissResults don't cause errors
        try {
            await this.display.showGameResults(testGameData, '2023-10-15');
            
            // Call dismissResults multiple times
            let errorOccurred = false;
            let errorMessage = '';
            
            try {
                this.display.dismissResults();
                this.display.dismissResults();
                this.display.dismissResults();
            } catch (error) {
                errorOccurred = true;
                errorMessage = error.message;
            }
            
            // Verify no errors occurred and handler is null
            const noErrors = !errorOccurred;
            const handlerIsNull = this.display.escapeHandler === null;
            
            this.recordTest(
                'Multiple dismissResults calls safety',
                noErrors && handlerIsNull,
                'Multiple calls to dismissResults should not cause errors and should be idempotent',
                { 
                    noErrors,
                    handlerIsNull,
                    errorMessage: errorMessage || 'No errors'
                }
            );

            // Wait for animation to complete
            await new Promise(resolve => setTimeout(resolve, 350));
            
        } catch (error) {
            this.recordTest(
                'Multiple dismissResults calls safety',
                false,
                `Failed to test multiple dismissResults calls: ${error.message}`,
                { error: error.message }
            );
        }

        // Test 7: Verify cleanup works when handler is already null
        try {
            // Ensure display is clean
            this.display.dismissResults();
            await new Promise(resolve => setTimeout(resolve, 350));
            
            // Verify handler is null
            const handlerIsNullBefore = this.display.escapeHandler === null;
            
            // Call dismissResults when handler is already null
            let errorOccurred = false;
            let errorMessage = '';
            
            try {
                this.display.dismissResults();
            } catch (error) {
                errorOccurred = true;
                errorMessage = error.message;
            }
            
            // Verify no errors occurred
            const noErrors = !errorOccurred;
            const handlerStillNull = this.display.escapeHandler === null;
            
            this.recordTest(
                'Cleanup when handler already null',
                handlerIsNullBefore && noErrors && handlerStillNull,
                'dismissResults should handle null escapeHandler gracefully',
                { 
                    handlerWasNull: handlerIsNullBefore,
                    noErrors,
                    handlerStillNull,
                    errorMessage: errorMessage || 'No errors'
                }
            );
            
        } catch (error) {
            this.recordTest(
                'Cleanup when handler already null',
                false,
                `Failed to test null handler cleanup: ${error.message}`,
                { error: error.message }
            );
        }

        // Test 8: Verify new modal gets fresh escape handler after cleanup
        try {
            // Create first modal
            await this.display.showGameResults(testGameData, '2023-10-15');
            const firstHandler = this.display.escapeHandler;
            
            // Dismiss first modal
            this.display.dismissResults();
            await new Promise(resolve => setTimeout(resolve, 350));
            
            // Create second modal
            await this.display.showGameResults(testGameData, '2023-10-16');
            const secondHandler = this.display.escapeHandler;
            
            // Verify handlers are different and second is not null
            const handlersAreDifferent = firstHandler !== secondHandler;
            const secondHandlerExists = secondHandler !== null && typeof secondHandler === 'function';
            
            this.recordTest(
                'Fresh escape handler for new modal',
                handlersAreDifferent && secondHandlerExists,
                'New modal should get a fresh escape handler after previous cleanup',
                { 
                    handlersAreDifferent,
                    secondHandlerExists,
                    firstHandlerType: typeof firstHandler,
                    secondHandlerType: typeof secondHandler
                }
            );

            // Clean up
            this.display.dismissResults();
            await new Promise(resolve => setTimeout(resolve, 350));
            
        } catch (error) {
            this.recordTest(
                'Fresh escape handler for new modal',
                false,
                `Failed to test fresh handler creation: ${error.message}`,
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
        console.log('\n📊 Escape Handler Cleanup Test Results:');
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
    window.EscapeHandlerCleanupTests = EscapeHandlerCleanupTests;
}

// Auto-run tests if this file is loaded directly
if (typeof window !== 'undefined' && window.GameResultsDisplay) {
    console.log('🔑 Escape Handler Cleanup tests detected, running tests...');
    const tests = new EscapeHandlerCleanupTests();
    tests.runAllTests().then(summary => {
        console.log('🏁 Escape Handler Cleanup tests completed!');
    });
}