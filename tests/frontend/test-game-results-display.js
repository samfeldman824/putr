/**
 * Unit Tests for Game Results Display Component
 * Tests formatting, sorting, display logic, and modal behavior
 */

// Test data
const testGameData = {
    players: [
        { player_nickname: 'Alice', net: 2550 },
        { player_nickname: 'Bob', net: -1275 },
        { player_nickname: 'Charlie', net: 750 },
        { player_nickname: 'Diana', net: -2025 },
        { player_nickname: 'Eve', net: 0 }
    ]
};

const testGameDataSinglePlayer = {
    players: [
        { player_nickname: 'Solo', net: 1000 }
    ]
};

const testGameDataTies = {
    players: [
        { player_nickname: 'Alice', net: 1000 },
        { player_nickname: 'Bob', net: 1000 },
        { player_nickname: 'Charlie', net: -500 },
        { player_nickname: 'Diana', net: -500 }
    ]
};

const testGameDataDuplicateNicknames = {
    players: [
        { player_nickname: 'Alice', net: 1500 },
        { player_nickname: 'Alice', net: 1050 }, // Same player, multiple entries
        { player_nickname: 'Bob', net: -1275 },
        { player_nickname: 'Charlie', net: 750 },
        { player_nickname: 'Charlie', net: -500 } // Same player, multiple entries
    ]
};

// Test runner
class GameResultsDisplayTests {
    constructor() {
        this.display = new GameResultsDisplay();
        this.testResults = [];
        this.totalTests = 0;
        this.passedTests = 0;
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🧪 Starting Game Results Display Tests...');
        
        // Currency formatting tests
        this.testCurrencyFormatting();
        
        // Player sorting tests
        this.testPlayerSorting();
        
        // Data formatting tests
        this.testPlayerResultsFormatting();
        
        // Modal content creation tests
        this.testModalContentCreation();
        
        // Date formatting tests
        this.testDateFormatting();
        
        // HTML escaping tests
        this.testHtmlEscaping();
        
        // Edge case tests
        this.testEdgeCases();
        
        // Modal behavior tests (async)
        await this.testModalBehavior();
        
        // Integration tests
        await this.testIntegration();
        
        // Escape handler cleanup tests
        await this.testEscapeHandlerCleanup();
        
        this.printTestResults();
        return this.getTestSummary();
    }

    /**
     * Test currency formatting functionality
     */
    testCurrencyFormatting() {
        console.log('💰 Testing currency formatting...');
        
        const testCases = [
            { input: 25.50, expected: '$25.50' },
            { input: -12.75, expected: '-$12.75' },
            { input: 0, expected: '$0.00' },
            { input: 100, expected: '$100.00' },
            { input: -0.01, expected: '-$0.01' },
            { input: 1000.99, expected: '$1000.99' },
            { input: -999.99, expected: '-$999.99' }
        ];

        testCases.forEach((testCase, index) => {
            const result = this.display.formatCurrency(testCase.input);
            const passed = result === testCase.expected;
            
            this.recordTest(
                `Currency formatting test ${index + 1}`,
                passed,
                `Expected: ${testCase.expected}, Got: ${result}`,
                { input: testCase.input, expected: testCase.expected, actual: result }
            );
        });
    }

    /**
     * Test player sorting functionality
     */
    testPlayerSorting() {
        console.log('🔄 Testing player sorting...');
        
        // Test basic sorting
        const formattedResults = this.display.formatPlayerResults(testGameData);
        const sortedResults = this.display.sortPlayersByNet(formattedResults);
        
        // Check order (highest to lowest net)
        const expectedOrder = ['Alice', 'Charlie', 'Eve', 'Bob', 'Diana'];
        const actualOrder = sortedResults.map(p => p.nickname);
        
        this.recordTest(
            'Basic player sorting',
            JSON.stringify(actualOrder) === JSON.stringify(expectedOrder),
            `Expected order: ${expectedOrder.join(', ')}, Got: ${actualOrder.join(', ')}`,
            { expected: expectedOrder, actual: actualOrder }
        );

        // Test sorting with ties
        const tieResults = this.display.formatPlayerResults(testGameDataTies);
        const sortedTieResults = this.display.sortPlayersByNet(tieResults);
        
        // Should sort by net amount first, then by nickname for ties
        const expectedTieOrder = ['Alice', 'Bob', 'Charlie', 'Diana'];
        const actualTieOrder = sortedTieResults.map(p => p.nickname);
        
        this.recordTest(
            'Player sorting with ties',
            JSON.stringify(actualTieOrder) === JSON.stringify(expectedTieOrder),
            `Expected order: ${expectedTieOrder.join(', ')}, Got: ${actualTieOrder.join(', ')}`,
            { expected: expectedTieOrder, actual: actualTieOrder }
        );

        // Test single player
        const singleResults = this.display.formatPlayerResults(testGameDataSinglePlayer);
        const sortedSingleResults = this.display.sortPlayersByNet(singleResults);
        
        this.recordTest(
            'Single player sorting',
            sortedSingleResults.length === 1 && sortedSingleResults[0].nickname === 'Solo',
            `Expected 1 player named Solo, Got: ${sortedSingleResults.length} players`,
            { expected: 1, actual: sortedSingleResults.length }
        );

        // Test duplicate nickname combining
        const duplicateResults = this.display.formatPlayerResults(testGameDataDuplicateNicknames);
        const sortedDuplicateResults = this.display.sortPlayersByNet(duplicateResults);
        
        // Should have 3 unique players (Alice, Bob, Charlie) instead of 5 entries
        this.recordTest(
            'Duplicate nickname combining - player count',
            sortedDuplicateResults.length === 3,
            `Expected 3 unique players, Got: ${sortedDuplicateResults.length} players`,
            { expected: 3, actual: sortedDuplicateResults.length }
        );

        // Alice should have combined net of 1500 + 1050 = 2550 cents = $25.50
        const aliceCombined = sortedDuplicateResults.find(p => p.nickname === 'Alice');
        this.recordTest(
            'Duplicate nickname combining - Alice net amount',
            aliceCombined && aliceCombined.netAmount === 25.50,
            `Expected Alice's combined net to be $25.50, Got: $${aliceCombined?.netAmount}`,
            { expected: 25.50, actual: aliceCombined?.netAmount }
        );

        // Charlie should have combined net of 750 + (-500) = 250 cents = $2.50
        const charlieCombined = sortedDuplicateResults.find(p => p.nickname === 'Charlie');
        this.recordTest(
            'Duplicate nickname combining - Charlie net amount',
            charlieCombined && charlieCombined.netAmount === 2.50,
            `Expected Charlie's combined net to be $2.50, Got: $${charlieCombined?.netAmount}`,
            { expected: 2.50, actual: charlieCombined?.netAmount }
        );

        // Check final sorting order: Alice ($25.50), Charlie ($2.50), Bob (-$12.75)
        const expectedDuplicateOrder = ['Alice', 'Charlie', 'Bob'];
        const actualDuplicateOrder = sortedDuplicateResults.map(p => p.nickname);
        
        this.recordTest(
            'Duplicate nickname combining - final sorting',
            JSON.stringify(actualDuplicateOrder) === JSON.stringify(expectedDuplicateOrder),
            `Expected order: ${expectedDuplicateOrder.join(', ')}, Got: ${actualDuplicateOrder.join(', ')}`,
            { expected: expectedDuplicateOrder, actual: actualDuplicateOrder }
        );
    }

    /**
     * Test player results formatting
     */
    testPlayerResultsFormatting() {
        console.log('📊 Testing player results formatting...');
        
        const formattedResults = this.display.formatPlayerResults(testGameData);
        
        // Check structure
        const hasCorrectStructure = formattedResults.every(player => 
            player.hasOwnProperty('nickname') &&
            player.hasOwnProperty('netAmount') &&
            player.hasOwnProperty('formattedNet') &&
            player.hasOwnProperty('rawNet')
        );
        
        this.recordTest(
            'Player results structure',
            hasCorrectStructure,
            'All players should have nickname, netAmount, formattedNet, and rawNet properties',
            { samplePlayer: formattedResults[0] }
        );

        // Check conversion from cents to dollars
        const aliceResult = formattedResults.find(p => p.nickname === 'Alice');
        const correctConversion = aliceResult && aliceResult.netAmount === 25.50;
        
        this.recordTest(
            'Cents to dollars conversion',
            correctConversion,
            `Expected Alice's net to be $25.50, Got: $${aliceResult?.netAmount}`,
            { expected: 25.50, actual: aliceResult?.netAmount }
        );

        // Check formatted currency
        const correctFormatting = aliceResult && aliceResult.formattedNet === '$25.50';
        
        this.recordTest(
            'Currency formatting in results',
            correctFormatting,
            `Expected Alice's formatted net to be '$25.50', Got: '${aliceResult?.formattedNet}'`,
            { expected: '$25.50', actual: aliceResult?.formattedNet }
        );
    }

    /**
     * Test modal content creation
     */
    testModalContentCreation() {
        console.log('🖼️ Testing modal content creation...');
        
        const formattedResults = this.display.formatPlayerResults(testGameData);
        const sortedResults = this.display.sortPlayersByNet(formattedResults);
        const modalContent = this.display.createModalContent(sortedResults, '2023-10-15');
        
        // Check if content contains expected elements
        const containsHeader = modalContent.includes('Game Results');
        const containsDate = modalContent.includes('2023-10-15') || modalContent.includes('October');
        const containsPlayerCount = modalContent.includes('5 players');
        const containsBiggestWinner = modalContent.includes('Alice');
        const containsBiggestLoser = modalContent.includes('Diana');
        const containsCloseButton = modalContent.includes('close-results-btn');
        
        this.recordTest(
            'Modal content includes header',
            containsHeader,
            'Modal should contain "Game Results" header',
            { content: modalContent.substring(0, 200) + '...' }
        );

        this.recordTest(
            'Modal content includes date',
            containsDate,
            'Modal should contain game date',
            { searchedFor: '2023-10-15 or October' }
        );

        this.recordTest(
            'Modal content includes player count',
            containsPlayerCount,
            'Modal should show "5 players"',
            { searchedFor: '5 players' }
        );

        this.recordTest(
            'Modal content includes biggest winner',
            containsBiggestWinner,
            'Modal should mention Alice as biggest winner',
            { searchedFor: 'Alice' }
        );

        this.recordTest(
            'Modal content includes biggest loser',
            containsBiggestLoser,
            'Modal should mention Diana as biggest loser',
            { searchedFor: 'Diana' }
        );

        this.recordTest(
            'Modal content includes close button',
            containsCloseButton,
            'Modal should have close button with ID close-results-btn',
            { searchedFor: 'close-results-btn' }
        );

        // Check if content contains colored bars
        const containsPositiveBar = modalContent.includes('positive-bar');
        const containsNegativeBar = modalContent.includes('negative-bar');
        const containsResultBar = modalContent.includes('result-bar');
        
        this.recordTest(
            'Modal content includes colored bars',
            containsPositiveBar && containsNegativeBar && containsResultBar,
            'Modal should contain colored bars for positive and negative results',
            { 
                containsPositiveBar, 
                containsNegativeBar, 
                containsResultBar,
                searchedFor: 'positive-bar, negative-bar, result-bar'
            }
        );
    }

    /**
     * Test date formatting
     */
    testDateFormatting() {
        console.log('📅 Testing date formatting...');
        
        const testDates = [
            { input: '2023-10-15', shouldContain: ['October', '15', '2023'] },
            { input: '2023-01-01', shouldContain: ['January', '1', '2023'] },
            { input: '2023-12-31', shouldContain: ['December', '31', '2023'] }
        ];

        testDates.forEach((testCase, index) => {
            const formatted = this.display.formatDateForDisplay(testCase.input);
            const containsAll = testCase.shouldContain.every(part => 
                formatted.includes(part)
            );
            
            this.recordTest(
                `Date formatting test ${index + 1}`,
                containsAll,
                `Expected formatted date to contain: ${testCase.shouldContain.join(', ')}, Got: ${formatted}`,
                { input: testCase.input, expected: testCase.shouldContain, actual: formatted }
            );
        });

        // Test invalid date handling
        const invalidDate = this.display.formatDateForDisplay('invalid-date');
        this.recordTest(
            'Invalid date handling',
            invalidDate === 'invalid-date',
            'Invalid dates should be returned as-is',
            { input: 'invalid-date', actual: invalidDate }
        );
    }

    /**
     * Test HTML escaping
     */
    testHtmlEscaping() {
        console.log('🔒 Testing HTML escaping...');
        
        const testCases = [
            { input: '<script>alert("xss")</script>', shouldNotContain: '<script>' },
            { input: 'Player & Co.', shouldContain: '&amp;' },
            { input: 'Player "Nickname"', shouldContain: '&quot;' },
            { input: "Player's Name", shouldContain: '&#x27;' },
            { input: 'Normal Name', shouldBe: 'Normal Name' }
        ];

        testCases.forEach((testCase, index) => {
            const escaped = this.display.escapeHtml(testCase.input);
            
            if (testCase.shouldNotContain) {
                const passed = !escaped.includes(testCase.shouldNotContain);
                this.recordTest(
                    `HTML escaping test ${index + 1} (should not contain)`,
                    passed,
                    `Escaped text should not contain: ${testCase.shouldNotContain}, Got: ${escaped}`,
                    { input: testCase.input, shouldNotContain: testCase.shouldNotContain, actual: escaped }
                );
            }
            
            if (testCase.shouldContain) {
                const passed = escaped.includes(testCase.shouldContain);
                this.recordTest(
                    `HTML escaping test ${index + 1} (should contain)`,
                    passed,
                    `Escaped text should contain: ${testCase.shouldContain}, Got: ${escaped}`,
                    { input: testCase.input, shouldContain: testCase.shouldContain, actual: escaped }
                );
            }
            
            if (testCase.shouldBe) {
                const passed = escaped === testCase.shouldBe;
                this.recordTest(
                    `HTML escaping test ${index + 1} (should be)`,
                    passed,
                    `Expected: ${testCase.shouldBe}, Got: ${escaped}`,
                    { input: testCase.input, expected: testCase.shouldBe, actual: escaped }
                );
            }
        });
    }

    /**
     * Test edge cases
     */
    testEdgeCases() {
        console.log('⚠️ Testing edge cases...');
        
        // Test with empty players array
        try {
            const emptyData = { players: [] };
            this.display.formatPlayerResults(emptyData);
            this.recordTest(
                'Empty players array',
                false,
                'Should throw error for empty players array',
                { input: emptyData }
            );
        } catch (error) {
            this.recordTest(
                'Empty players array',
                true,
                'Correctly throws error for empty players array',
                { error: error.message }
            );
        }

        // Test with null game data
        try {
            this.display.formatPlayerResults(null);
            this.recordTest(
                'Null game data',
                false,
                'Should throw error for null game data',
                { input: null }
            );
        } catch (error) {
            this.recordTest(
                'Null game data',
                true,
                'Correctly throws error for null game data',
                { error: error.message }
            );
        }

        // Test with missing player_nickname
        try {
            const badData = { players: [{ net: 1000 }] };
            const result = this.display.formatPlayerResults(badData);
            const hasUnknownPlayer = result[0].nickname === 'Unknown Player';
            
            this.recordTest(
                'Missing player nickname',
                hasUnknownPlayer,
                'Should use "Unknown Player" for missing nicknames',
                { result: result[0] }
            );
        } catch (error) {
            this.recordTest(
                'Missing player nickname',
                false,
                'Should handle missing nicknames gracefully',
                { error: error.message }
            );
        }

        // Test very large numbers
        const largeNumberData = { players: [{ player_nickname: 'BigWinner', net: 999999999 }] };
        const largeResult = this.display.formatPlayerResults(largeNumberData);
        const correctLargeFormat = largeResult[0].formattedNet === '$9999999.99';
        
        this.recordTest(
            'Large number formatting',
            correctLargeFormat,
            'Should handle large numbers correctly',
            { expected: '$9999999.99', actual: largeResult[0].formattedNet }
        );
    }

    /**
     * Test modal behavior (async)
     */
    async testModalBehavior() {
        console.log('🎭 Testing modal behavior...');
        
        // Test modal creation and display
        try {
            await this.display.showGameResults(testGameData, '2023-10-15');
            
            const modalExists = document.getElementById('results-modal-overlay') !== null;
            this.recordTest(
                'Modal creation',
                modalExists,
                'Modal should be created and added to DOM',
                { modalExists }
            );

            const isDisplaying = this.display.isResultsDisplayed();
            this.recordTest(
                'Display state tracking',
                isDisplaying,
                'Display should track that results are being shown',
                { isDisplaying }
            );

            // Test modal dismissal
            this.display.dismissResults();
            
            // Wait for animation
            await new Promise(resolve => setTimeout(resolve, 350));
            
            const modalRemoved = document.getElementById('results-modal-overlay') === null;
            const notDisplaying = !this.display.isResultsDisplayed();
            
            this.recordTest(
                'Modal dismissal',
                modalRemoved && notDisplaying,
                'Modal should be removed from DOM and state should be updated',
                { modalRemoved, notDisplaying }
            );

        } catch (error) {
            this.recordTest(
                'Modal behavior test',
                false,
                `Modal behavior test failed: ${error.message}`,
                { error: error.message }
            );
        }
    }

    /**
     * Test integration with various game scenarios
     */
    async testIntegration() {
        console.log('🔗 Testing integration scenarios...');
        
        // Test with single player game
        try {
            await this.display.showGameResults(testGameDataSinglePlayer, '2023-10-16');
            
            const modal = document.getElementById('results-modal');
            const modalContent = modal ? modal.innerHTML : '';
            
            const containsSinglePlayer = modalContent.includes('1 players') || modalContent.includes('1 player');
            const containsSolo = modalContent.includes('Solo');
            
            this.recordTest(
                'Single player integration',
                containsSinglePlayer && containsSolo,
                'Should handle single player games correctly',
                { containsSinglePlayer, containsSolo }
            );
            
            this.display.dismissResults();
            await new Promise(resolve => setTimeout(resolve, 350));
            
        } catch (error) {
            this.recordTest(
                'Single player integration',
                false,
                `Single player integration failed: ${error.message}`,
                { error: error.message }
            );
        }

        // Test with tie scenarios
        try {
            await this.display.showGameResults(testGameDataTies, '2023-10-17');
            
            const modal = document.getElementById('results-modal');
            const modalContent = modal ? modal.innerHTML : '';
            
            const containsAllPlayers = ['Alice', 'Bob', 'Charlie', 'Diana'].every(name => 
                modalContent.includes(name)
            );
            
            this.recordTest(
                'Tie scenarios integration',
                containsAllPlayers,
                'Should handle tied net amounts correctly',
                { containsAllPlayers }
            );
            
            this.display.dismissResults();
            await new Promise(resolve => setTimeout(resolve, 350));
            
        } catch (error) {
            this.recordTest(
                'Tie scenarios integration',
                false,
                `Tie scenarios integration failed: ${error.message}`,
                { error: error.message }
            );
        }
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
        console.log('\n📊 Game Results Display Test Results:');
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
    window.GameResultsDisplayTests = GameResultsDisplayTests;
}

// Auto-run tests if this file is loaded directly
if (typeof window !== 'undefined' && window.GameResultsDisplay) {
    console.log('🧪 Game Results Display component detected, running tests...');
    const tests = new GameResultsDisplayTests();
    tests.runAllTests().then(summary => {
        console.log('🏁 Game Results Display tests completed!');
    });
}