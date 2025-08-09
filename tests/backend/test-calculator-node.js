/**
 * Node.js test runner for PlayerStatsCalculator
 * This allows us to run tests programmatically without a browser
 */

// Mock window object for Node.js environment
global.window = {};

// Load the debug manager first
require('../../src/debugManager.js');

// Load the calculator module
require('../../src/playerStatsCalculator.js');
const PlayerStatsCalculator = global.window.PlayerStatsCalculator;

let testResults = [];
let calculator;

function assert(condition, message) {
    if (condition) {
        testResults.push({ pass: true, message });
        console.log(`✓ ${message}`);
    } else {
        testResults.push({ pass: false, message });
        console.log(`✗ ${message}`);
        throw new Error(message);
    }
}

function assertEqual(actual, expected, message) {
    const condition = JSON.stringify(actual) === JSON.stringify(expected);
    assert(condition, `${message} - Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(actual)}`);
}

function assertThrows(fn, expectedMessage, testMessage) {
    try {
        fn();
        testResults.push({ pass: false, message: `${testMessage} - Expected error but none was thrown` });
        console.log(`✗ ${testMessage} - Expected error but none was thrown`);
    } catch (error) {
        const condition = expectedMessage ? error.message.includes(expectedMessage) : true;
        if (condition) {
            testResults.push({ pass: true, message: `${testMessage} - Correctly threw error: ${error.message}` });
            console.log(`✓ ${testMessage} - Correctly threw error`);
        } else {
            testResults.push({ pass: false, message: `${testMessage} - Wrong error message. Expected: ${expectedMessage}, Got: ${error.message}` });
            console.log(`✗ ${testMessage} - Wrong error message`);
        }
    }
}

function testCalculateNetWinnings() {
    console.log("\n=== Testing calculateNetWinnings ===");

    // Test valid data
    const gameData = [
        { player_nickname: "Alice", net: 5000 },
        { player_nickname: "Bob", net: -2500 },
        { player_nickname: "Charlie", net: 1500 }
    ];

    const result = calculator.calculateNetWinnings(gameData);

    assertEqual(result.length, 3, "Should return same number of players");
    assertEqual(result[0].netWinnings, 50, "Alice's net winnings should be 50");
    assertEqual(result[1].netWinnings, -25, "Bob's net winnings should be -25");
    assertEqual(result[2].netWinnings, 15, "Charlie's net winnings should be 15");

    // Test edge cases
    assertThrows(() => calculator.calculateNetWinnings(null), "Game data must be a valid array", "Should throw for null input");
    assertThrows(() => calculator.calculateNetWinnings([]), "Game data cannot be empty", "Should throw for empty array");
    assertThrows(() => calculator.calculateNetWinnings([{ player_nickname: "Test", net: "invalid" }]), "Invalid net value", "Should throw for invalid net value");
}

function testFindMinMaxPlayers() {
    console.log("\n=== Testing findMinMaxPlayers ===");

    const playersWithWinnings = [
        { player_nickname: "Alice", netWinnings: 50 },
        { player_nickname: "Bob", netWinnings: -25 },
        { player_nickname: "Charlie", netWinnings: 15 },
        { player_nickname: "David", netWinnings: 100 }
    ];

    const result = calculator.findMinMaxPlayers(playersWithWinnings);

    assertEqual(result.minPlayer.player_nickname, "Bob", "Min player should be Bob");
    assertEqual(result.minPlayer.netWinnings, -25, "Min winnings should be -25");
    assertEqual(result.maxPlayer.player_nickname, "David", "Max player should be David");
    assertEqual(result.maxPlayer.netWinnings, 100, "Max winnings should be 100");

    // Test single player
    const singlePlayer = [{ player_nickname: "Solo", netWinnings: 10 }];
    const singleResult = calculator.findMinMaxPlayers(singlePlayer);
    assertEqual(singleResult.minPlayer.player_nickname, "Solo", "Single player should be both min and max");
    assertEqual(singleResult.maxPlayer.player_nickname, "Solo", "Single player should be both min and max");
}

function testMatchPlayerByNickname() {
    console.log("\n=== Testing matchPlayerByNickname ===");

    const playersData = {
        "John Doe": {
            player_nicknames: ["Johnny", "JD", "john"]
        },
        "Jane Smith": {
            player_nicknames: ["Janie", "JS"]
        },
        "Bob Wilson": {
            player_nicknames: ["Bobby", "Bob"]
        }
    };

    // Test exact key match
    assertEqual(calculator.matchPlayerByNickname("John Doe", playersData), "John Doe", "Should match exact key");

    // Test nickname array matches
    assertEqual(calculator.matchPlayerByNickname("Johnny", playersData), "John Doe", "Should match nickname in array");
    assertEqual(calculator.matchPlayerByNickname("JD", playersData), "John Doe", "Should match nickname in array");
    assertEqual(calculator.matchPlayerByNickname("Bobby", playersData), "Bob Wilson", "Should match nickname in array");

    // Test case insensitive matching
    assertEqual(calculator.matchPlayerByNickname("JOHNNY", playersData), "John Doe", "Should match case insensitive");
    assertEqual(calculator.matchPlayerByNickname("jd", playersData), "John Doe", "Should match case insensitive");

    // Test no match
    assertEqual(calculator.matchPlayerByNickname("Unknown", playersData), null, "Should return null for no match");
}

function testProcessGameData() {
    console.log("\n=== Testing processGameData ===");

    const gameData = [
        { player_nickname: "Johnny", net: 5000 },
        { player_nickname: "Janie", net: -2500 },
        { player_nickname: "Unknown", net: 1500 }
    ];

    const playersData = {
        "John Doe": {
            player_nicknames: ["Johnny", "JD"],
            net: 100,
            games_played: [],
            biggest_win: 0,
            biggest_loss: 0,
            highest_net: 0,
            lowest_net: 0,
            net_dictionary: {},
            games_up_most: 0,
            games_down_most: 0,
            games_up: 0,
            games_down: 0,
            average_net: 0
        },
        "Jane Smith": {
            player_nicknames: ["Janie", "JS"],
            net: 50,
            games_played: [],
            biggest_win: 0,
            biggest_loss: 0,
            highest_net: 0,
            lowest_net: 0,
            net_dictionary: {},
            games_up_most: 0,
            games_down_most: 0,
            games_up: 0,
            games_down: 0,
            average_net: 0
        }
    };

    const result = calculator.processGameData(gameData, playersData, "2023-10-15");

    assertEqual(result.processedCount, 3, "Should process all 3 players");
    assertEqual(result.matchedCount, 2, "Should match 2 players");
    assertEqual(result.unmatchedPlayers.length, 1, "Should have 1 unmatched player");
    assertEqual(result.unmatchedPlayers[0], "Unknown", "Unknown should be unmatched");

    assert(result.playerUpdates["John Doe"], "John Doe should have updates");
    assert(result.playerUpdates["Jane Smith"], "Jane Smith should have updates");

    // Check that Johnny (highest) gets games_up_most increment
    assertEqual(result.playerUpdates["John Doe"].games_up_most, 1, "Johnny should have games_up_most incremented");
    // Check that Janie (lowest) gets games_down_most increment
    assertEqual(result.playerUpdates["Jane Smith"].games_down_most, 1, "Janie should have games_down_most incremented");
}

function testCalculationAccuracy() {
    console.log("\n=== Testing Calculation Accuracy ===");

    // Test precise division by 100
    const precisionData = [
        { player_nickname: "Test1", net: 12345 },  // Should be 123.45
        { player_nickname: "Test2", net: -6789 },  // Should be -67.89
        { player_nickname: "Test3", net: 1 },      // Should be 0.01
        { player_nickname: "Test4", net: 0 }       // Should be 0
    ];

    const result = calculator.calculateNetWinnings(precisionData);

    assertEqual(result[0].netWinnings, 123.45, "Should handle decimal precision correctly");
    assertEqual(result[1].netWinnings, -67.89, "Should handle negative decimal precision correctly");
    assertEqual(result[2].netWinnings, 0.01, "Should handle small positive values correctly");
    assertEqual(result[3].netWinnings, 0, "Should handle zero values correctly");
}

function testEdgeCasesAndBoundaries() {
    console.log("\n=== Testing Edge Cases and Boundaries ===");

    // Test with identical net winnings (tie scenarios)
    const tieData = [
        { player_nickname: "Player1", netWinnings: 50 },
        { player_nickname: "Player2", netWinnings: 50 },
        { player_nickname: "Player3", netWinnings: -25 },
        { player_nickname: "Player4", netWinnings: -25 }
    ];

    const tieResult = calculator.findMinMaxPlayers(tieData);
    assertEqual(tieResult.maxPlayer.netWinnings, 50, "Should handle ties in max correctly");
    assertEqual(tieResult.minPlayer.netWinnings, -25, "Should handle ties in min correctly");

    // Test nickname matching with whitespace and special characters
    const specialPlayersData = {
        "Player With Spaces": {
            player_nicknames: [" SpacedNick ", "  ExtraSpaces  "]
        },
        "Player-With-Dashes": {
            player_nicknames: ["Dash-Nick", "Under_Score"]
        }
    };

    assertEqual(calculator.matchPlayerByNickname("SpacedNick", specialPlayersData), "Player With Spaces", "Should handle whitespace in nicknames");
    assertEqual(calculator.matchPlayerByNickname("  SpacedNick  ", specialPlayersData), "Player With Spaces", "Should trim input nicknames");
    assertEqual(calculator.matchPlayerByNickname("Dash-Nick", specialPlayersData), "Player-With-Dashes", "Should handle special characters");

    // Test with empty player_nicknames array
    const emptyNicknamesData = {
        "TestPlayer": {
            player_nicknames: []
        }
    };
    assertEqual(calculator.matchPlayerByNickname("TestPlayer", emptyNicknamesData), "TestPlayer", "Should match exact key even with empty nicknames array");
    assertEqual(calculator.matchPlayerByNickname("SomeNick", emptyNicknamesData), null, "Should return null when no nicknames and no exact match");
}

function testLargeDatasetPerformance() {
    console.log("\n=== Testing Large Dataset Performance ===");

    // Create a larger dataset to test performance
    const largeGameData = [];
    for (let i = 0; i < 100; i++) {
        largeGameData.push({
            player_nickname: `Player${i}`,
            net: Math.floor(Math.random() * 20000) - 10000 // Random between -10000 and 10000
        });
    }

    const startTime = Date.now();
    const result = calculator.calculateNetWinnings(largeGameData);
    const endTime = Date.now();

    assertEqual(result.length, 100, "Should process all 100 players");
    assert(endTime - startTime < 100, "Should process 100 players in under 100ms");

    // Test min/max with large dataset
    const minMaxStartTime = Date.now();
    const minMaxResult = calculator.findMinMaxPlayers(result);
    const minMaxEndTime = Date.now();

    assert(minMaxResult.minPlayer, "Should find min player in large dataset");
    assert(minMaxResult.maxPlayer, "Should find max player in large dataset");
    assert(minMaxEndTime - minMaxStartTime < 50, "Should find min/max in large dataset in under 50ms");
}

function testComplexPlayerMatching() {
    console.log("\n=== Testing Complex Player Matching ===");

    const complexPlayersData = {
        "John Smith": {
            player_nicknames: ["Johnny", "John", "JS", "Smithy"]
        },
        "John Doe": {
            player_nicknames: ["JD", "Johnny D", "Doe"]
        },
        "Jane Johnson": {
            player_nicknames: ["JJ", "Jane", "Johnson"]
        }
    };

    // Test that first match is returned (order matters)
    assertEqual(calculator.matchPlayerByNickname("John", complexPlayersData), "John Smith", "Should return first match when multiple possible");

    // Test unique nicknames
    assertEqual(calculator.matchPlayerByNickname("JD", complexPlayersData), "John Doe", "Should match unique nickname correctly");
    assertEqual(calculator.matchPlayerByNickname("Smithy", complexPlayersData), "John Smith", "Should match unique nickname correctly");

    // Test case variations
    assertEqual(calculator.matchPlayerByNickname("JOHNNY", complexPlayersData), "John Smith", "Should handle case insensitive matching");
    assertEqual(calculator.matchPlayerByNickname("jj", complexPlayersData), "Jane Johnson", "Should handle lowercase matching");
}

function testBackendComparisonSingleGame() {
    console.log("\n=== Testing Backend Comparison - Single Game ===");

    // Test data that matches the backend test case
    const existingPlayer = {
        net: 0,
        games_played: [],
        biggest_win: 0,
        biggest_loss: 0,
        highest_net: 0,
        lowest_net: 0,
        net_dictionary: { "01_01": 0 },
        games_up_most: 0,
        games_down_most: 0,
        games_up: 0,
        games_down: 0,
        average_net: 0
    };

    // Simulate Alice winning 5.5 (550 cents)
    const updatedAlice = calculator.updatePlayerStats(
        existingPlayer,
        "Alice",
        5.5,
        "2023-01-01",
        true,  // upMost
        false  // downMost
    );

    // Compare with backend expected results
    assertEqual(updatedAlice.net, 5.5, "Alice net should match backend");
    assertEqual(updatedAlice.games_played, ["2023-01-01"], "Alice games_played should match backend");
    assertEqual(updatedAlice.biggest_win, 5.5, "Alice biggest_win should match backend");
    assertEqual(updatedAlice.biggest_loss, 0, "Alice biggest_loss should match backend");
    assertEqual(updatedAlice.highest_net, 5.5, "Alice highest_net should match backend");
    assertEqual(updatedAlice.lowest_net, 0, "Alice lowest_net should match backend");
    assertEqual(updatedAlice.net_dictionary["23_01_01"], 5.5, "Alice net_dictionary should match backend format");
    assertEqual(updatedAlice.games_up_most, 1, "Alice games_up_most should match backend");
    assertEqual(updatedAlice.games_down_most, 0, "Alice games_down_most should match backend");
    assertEqual(updatedAlice.games_up, 1, "Alice games_up should match backend");
    assertEqual(updatedAlice.games_down, 0, "Alice games_down should match backend");
    assertEqual(updatedAlice.average_net, 5.5, "Alice average_net should match backend");

    // Test Bob losing -4.25 (downMost)
    const updatedBob = calculator.updatePlayerStats(
        JSON.parse(JSON.stringify(existingPlayer)),
        "Bob",
        -4.25,
        "2023-01-01",
        false, // upMost
        true   // downMost
    );

    assertEqual(updatedBob.net, -4.25, "Bob net should match backend");
    assertEqual(updatedBob.biggest_win, 0, "Bob biggest_win should match backend");
    assertEqual(updatedBob.biggest_loss, -4.25, "Bob biggest_loss should match backend");
    assertEqual(updatedBob.highest_net, 0, "Bob highest_net should match backend");
    assertEqual(updatedBob.lowest_net, -4.25, "Bob lowest_net should match backend");
    assertEqual(updatedBob.net_dictionary["23_01_01"], -4.25, "Bob net_dictionary should match backend format");
    assertEqual(updatedBob.games_up_most, 0, "Bob games_up_most should match backend");
    assertEqual(updatedBob.games_down_most, 1, "Bob games_down_most should match backend");
    assertEqual(updatedBob.games_up, 0, "Bob games_up should match backend");
    assertEqual(updatedBob.games_down, 1, "Bob games_down should match backend");
    assertEqual(updatedBob.average_net, -4.25, "Bob average_net should match backend");
}

function testBackendComparisonMultipleGames() {
    console.log("\n=== Testing Backend Comparison - Multiple Games ===");

    // Start with Alice after first game
    let alice = {
        net: 5.5,
        games_played: ["23_01_01"],
        biggest_win: 5.5,
        biggest_loss: 0,
        highest_net: 5.5,
        lowest_net: 0,
        net_dictionary: { "23_01_01": 5.5 },
        games_up_most: 1,
        games_down_most: 0,
        games_up: 1,
        games_down: 0,
        average_net: 5.5
    };

    // Add second game where Alice loses -2.0 (not upMost or downMost)
    alice = calculator.updatePlayerStats(
        alice,
        "Alice",
        -2.0,
        "2023-01-02",
        false, // upMost
        false  // downMost
    );

    assertEqual(alice.net, 3.5, "Alice net after two games should be 3.5");
    assertEqual(alice.games_played.length, 2, "Alice should have played 2 games");
    assert(alice.games_played.includes("2023-01-02"), "Alice should have second game in games_played");
    assertEqual(alice.biggest_win, 5.5, "Alice biggest_win should remain 5.5");
    assertEqual(alice.biggest_loss, -2.0, "Alice biggest_loss should be -2.0");
    assertEqual(alice.highest_net, 5.5, "Alice highest_net should remain 5.5");
    assertEqual(alice.lowest_net, 0, "Alice lowest_net should remain 0");
    assertEqual(alice.net_dictionary["23_01_02"], 3.5, "Alice net_dictionary should show running total");
    assertEqual(alice.games_up_most, 1, "Alice games_up_most should remain 1");
    assertEqual(alice.games_down_most, 0, "Alice games_down_most should remain 0");
    assertEqual(alice.games_up, 1, "Alice games_up should remain 1");
    assertEqual(alice.games_down, 1, "Alice games_down should be 1");
    assertEqual(alice.average_net, 1.75, "Alice average_net should be 3.5/2 = 1.75");
}

function testDateFormatting() {
    console.log("\n=== Testing Date Formatting ===");

    const player = {
        net: 0,
        games_played: [],
        biggest_win: 0,
        biggest_loss: 0,
        highest_net: 0,
        lowest_net: 0,
        net_dictionary: {},
        games_up_most: 0,
        games_down_most: 0,
        games_up: 0,
        games_down: 0,
        average_net: 0
    };

    // Test various date formats
    const testCases = [
        { input: "2023-01-01", expected: "23_01_01" },
        { input: "2023-12-31", expected: "23_12_31" },
        { input: "2024-06-15", expected: "24_06_15" }
    ];

    testCases.forEach(testCase => {
        const updated = calculator.updatePlayerStats(
            JSON.parse(JSON.stringify(player)),
            "TestPlayer",
            10,
            testCase.input,
            false,
            false
        );

        assert(updated.net_dictionary[testCase.expected] !== undefined,
            `Date ${testCase.input} should be formatted as ${testCase.expected}`);
        assertEqual(updated.net_dictionary[testCase.expected], 10,
            `Net dictionary should contain running total for ${testCase.expected}`);
    });
}

function testPrecisionAndRounding() {
    console.log("\n=== Testing Precision and Rounding ===");

    const player = {
        net: 0,
        games_played: [],
        biggest_win: 0,
        biggest_loss: 0,
        highest_net: 0,
        lowest_net: 0,
        net_dictionary: {},
        games_up_most: 0,
        games_down_most: 0,
        games_up: 0,
        games_down: 0,
        average_net: 0
    };

    // Test floating point precision issues
    let updated = calculator.updatePlayerStats(
        JSON.parse(JSON.stringify(player)),
        "TestPlayer",
        0.1,
        "2023-01-01",
        false,
        false
    );

    updated = calculator.updatePlayerStats(
        updated,
        "TestPlayer",
        0.2,
        "2023-01-02",
        false,
        false
    );

    assertEqual(updated.net, 0.3, "Should handle floating point precision correctly");
    assertEqual(updated.average_net, 0.15, "Average should be calculated with proper precision");

    // Test rounding to 2 decimal places
    updated = calculator.updatePlayerStats(
        updated,
        "TestPlayer",
        0.333333,
        "2023-01-03",
        false,
        false
    );

    assertEqual(updated.net, 0.63, "Net should be rounded to 2 decimal places");
    assertEqual(updated.average_net, 0.21, "Average should be rounded to 2 decimal places");
}

function runAllTests() {
    console.log("🧪 Running Player Stats Calculator Tests\n");

    testResults = [];
    calculator = new PlayerStatsCalculator();

    try {
        testCalculateNetWinnings();
        testFindMinMaxPlayers();
        testMatchPlayerByNickname();
        testProcessGameData();
        testCalculationAccuracy();
        testEdgeCasesAndBoundaries();
        testLargeDatasetPerformance();
        testComplexPlayerMatching();
        testBackendComparisonSingleGame();
        testBackendComparisonMultipleGames();
        testDateFormatting();
        testPrecisionAndRounding();
    } catch (error) {
        console.error("Test execution error:", error);
    }

    // Display summary
    const passCount = testResults.filter(r => r.pass).length;
    const totalCount = testResults.length;

    console.log(`\n📊 Test Summary: ${passCount}/${totalCount} tests passed`);

    if (passCount === totalCount) {
        console.log("🎉 All tests passed!");
        process.exit(0);
    } else {
        console.log("❌ Some tests failed!");
        process.exit(1);
    }
}

// Run tests
runAllTests();