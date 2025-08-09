/**
 * Test suite for DatabaseManager
 * Tests all database operations and error scenarios
 */

// Load constants for Node.js environment
if (typeof require !== 'undefined') {
    // Set NODE_ENV to development for testing
    process.env.NODE_ENV = 'development';
    const { COLLECTIONS, DATABASE_CONSTANTS } = require('../../src/constants.js');
    global.COLLECTIONS = COLLECTIONS;
    global.DATABASE_CONSTANTS = DATABASE_CONSTANTS;
    
    // Load DatabaseManager for Node.js testing
    const fs = require('fs');
    const path = require('path');
    const dbManagerPath = path.join(__dirname, '../../src/databaseManager.js');
    const dbManagerCode = fs.readFileSync(dbManagerPath, 'utf8');
    
    // Create a mock window object for Node.js
    global.window = global.window || {};
    
    // Execute the DatabaseManager code in Node.js context
    eval(dbManagerCode);
    
    // Make DatabaseManager available globally
    global.DatabaseManager = window.DatabaseManager;
}

// Mock Firebase for testing
class MockFirestore {
    constructor() {
        // Use the single source of truth for collection name
        const collectionName = COLLECTIONS?.PLAYERS || 'players_dev';
        
        this.collections = {
            [collectionName]: {
                'player1': {
                    net: 100,
                    games_played: ['2024-01-01'],
                    player_nicknames: ['player1', 'p1']
                },
                'player2': {
                    net: -50,
                    games_played: ['2024-01-01'],
                    player_nicknames: ['player2', 'p2']
                }
            }
        };
        this.transactionData = {};
    }

    collection(name) {
        return {
            get: () => {
                const docs = Object.keys(this.collections[name] || {}).map(id => ({
                    id,
                    data: () => this.collections[name][id],
                    exists: true
                }));
                return Promise.resolve({
                    forEach: (callback) => docs.forEach(callback)
                });
            },
            doc: (id) => ({
                get: () => {
                    const data = this.collections[name]?.[id];
                    return Promise.resolve({
                        exists: !!data,
                        data: () => data
                    });
                },
                set: (data) => {
                    if (!this.collections[name]) this.collections[name] = {};
                    this.collections[name][id] = data;
                    return Promise.resolve();
                },
                update: (data) => {
                    if (!this.collections[name]?.[id]) {
                        throw new Error(`Document ${id} not found`);
                    }
                    this.collections[name][id] = { ...this.collections[name][id], ...data };
                    return Promise.resolve();
                }
            }),
            limit: (n) => ({
                get: () => Promise.resolve({ forEach: () => {} })
            })
        };
    }

    runTransaction(callback) {
        const self = this;
        
        // Create transaction-scoped data copy
        this.transactionData = JSON.parse(JSON.stringify(this.collections));
        
        const collectionName = COLLECTIONS?.PLAYERS || 'players_dev';
        
        const transaction = {
            get: (ref) => {
                const data = self.transactionData[collectionName]?.[ref._docId];
                return Promise.resolve({
                    exists: !!data,
                    data: () => data
                });
            },
            update: (ref, data) => {
                if (!self.transactionData[collectionName]?.[ref._docId]) {
                    throw new Error(`Document ${ref._docId} not found`);
                }
                self.transactionData[collectionName][ref._docId] = { ...self.transactionData[collectionName][ref._docId], ...data };
            },
            set: (ref, data) => {
                if (!self.transactionData[collectionName]) self.transactionData[collectionName] = {};
                self.transactionData[collectionName][ref._docId] = data;
            }
        };

        // Create collection method that returns refs with docId
        const createCollectionWithRefs = (name) => ({
            doc: (id) => ({
                _docId: id,
                get: () => {
                    const data = self.transactionData[name]?.[id];
                    return Promise.resolve({
                        exists: !!data,
                        data: () => data
                    });
                }
            })
        });

        // Temporarily replace collection method for transaction
        const originalCollection = this.collection;
        this.collection = createCollectionWithRefs;

        return Promise.resolve(callback(transaction)).then(result => {
            // Commit transaction data back to main collections
            this.collections = this.transactionData;
            this.collection = originalCollection;
            return result;
        }).catch(error => {
            // Rollback on error
            this.collection = originalCollection;
            throw error;
        });
    }
}

// Test framework
class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    async test(name, testFn) {
        try {
            await testFn();
            this.passed++;
            console.log(`✅ ${name}`);
        } catch (error) {
            this.failed++;
            console.error(`❌ ${name}: ${error.message}`);
        }
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected}, got ${actual}`);
        }
    }

    async assertThrows(fn, message) {
        let threw = false;
        try {
            await fn();
        } catch (e) {
            threw = true;
        }
        if (!threw) {
            throw new Error(message || 'Expected function to throw');
        }
    }

    summary() {
        const total = this.passed + this.failed;
        console.log(`\n📊 Test Summary: ${this.passed}/${total} passed`);
        if (this.failed > 0) {
            console.log(`❌ ${this.failed} tests failed`);
        } else {
            console.log('🎉 All tests passed!');
        }
    }
}

// Initialize test environment
function setupMockFirebase() {
    const mockDb = new MockFirestore();
    
    // Mock Firebase global
    global.firebase = {
        apps: [{}],
        firestore: () => mockDb
    };

    return new DatabaseManager();
}

// Test suites
async function runUnitTests() {
    console.log('\n🧪 Running Unit Tests...');
    const runner = new TestRunner();
    const dbManager = setupMockFirebase();

    await runner.test('Constructor initializes correctly', async () => {
        runner.assert(dbManager instanceof DatabaseManager, 'Should be DatabaseManager instance');
        runner.assertEqual(dbManager.playersCollection, COLLECTIONS.PLAYERS, 'Should set players collection from constants');
    });

    await runner.test('fetchAllPlayers returns player data', async () => {
        const players = await dbManager.fetchAllPlayers();
        runner.assert(typeof players === 'object', 'Should return object');
        runner.assert(players.player1, 'Should contain player1');
        runner.assert(players.player2, 'Should contain player2');
        runner.assertEqual(players.player1.net, 100, 'Player1 net should be 100');
    });

    await runner.test('getPlayer returns single player data', async () => {
        const player = await dbManager.getPlayer('player1');
        runner.assert(player, 'Should return player data');
        runner.assertEqual(player.net, 100, 'Player net should be 100');
    });

    await runner.test('getPlayer returns null for non-existent player', async () => {
        const player = await dbManager.getPlayer('nonexistent');
        runner.assertEqual(player, null, 'Should return null for non-existent player');
    });

    await runner.test('playerExists returns true for existing player', async () => {
        const exists = await dbManager.playerExists('player1');
        runner.assertEqual(exists, true, 'Should return true for existing player');
    });

    await runner.test('playerExists returns false for non-existent player', async () => {
        const exists = await dbManager.playerExists('nonexistent');
        runner.assertEqual(exists, false, 'Should return false for non-existent player');
    });

    await runner.test('testConnection returns true', async () => {
        const connected = await dbManager.testConnection();
        runner.assertEqual(connected, true, 'Should return true for successful connection');
    });

    await runner.test('findPlayerByNickname finds player by exact key match', async () => {
        const result = await dbManager.findPlayerByNickname('player1');
        runner.assert(result, 'Should find player');
        runner.assertEqual(result.playerKey, 'player1', 'Should return correct player key');
        runner.assertEqual(result.playerData.net, 100, 'Should return correct player data');
    });

    await runner.test('findPlayerByNickname finds player by nickname array', async () => {
        const result = await dbManager.findPlayerByNickname('p1');
        runner.assert(result, 'Should find player by nickname');
        runner.assertEqual(result.playerKey, 'player1', 'Should return correct player key');
        runner.assertEqual(result.playerData.net, 100, 'Should return correct player data');
    });

    await runner.test('findPlayerByNickname returns null for non-existent player', async () => {
        const result = await dbManager.findPlayerByNickname('nonexistent');
        runner.assertEqual(result, null, 'Should return null for non-existent player');
    });

    await runner.test('findPlayersByNicknames finds multiple players', async () => {
        const result = await dbManager.findPlayersByNicknames(['player1', 'p2', 'nonexistent']);
        runner.assert(result.matched['player1'], 'Should find player1');
        runner.assert(result.matched['p2'], 'Should find player2 by nickname');
        runner.assertEqual(result.matched['player1'].playerKey, 'player1', 'Should have correct player1 key');
        runner.assertEqual(result.matched['p2'].playerKey, 'player2', 'Should have correct player2 key');
        runner.assert(result.unmatched.includes('nonexistent'), 'Should list unmatched players');
        runner.assertEqual(result.unmatched.length, 1, 'Should have one unmatched player');
    });

    await runner.test('getMultiplePlayers fetches multiple players efficiently', async () => {
        const players = await dbManager.getMultiplePlayers(['player1', 'player2']);
        runner.assert(players.player1, 'Should contain player1');
        runner.assert(players.player2, 'Should contain player2');
        runner.assertEqual(players.player1.net, 100, 'Player1 net should be correct');
        runner.assertEqual(players.player2.net, -50, 'Player2 net should be correct');
    });

    runner.summary();
}

async function runIntegrationTests() {
    console.log('\n🔗 Running Integration Tests...');
    const runner = new TestRunner();
    let dbManager = setupMockFirebase();

    await runner.test('createBackup creates player backup', async () => {
        const backup = await dbManager.createBackup(['player1', 'player2']);
        runner.assert(backup.player1, 'Backup should contain player1');
        runner.assert(backup.player2, 'Backup should contain player2');
        runner.assertEqual(backup.player1.net, 100, 'Backup should preserve player1 net');
    });

    await runner.test('updatePlayersInTransaction updates multiple players', async () => {
        const updates = {
            player1: { net: 200 },
            player2: { net: -100 }
        };
        
        await dbManager.updatePlayersInTransaction(updates);
        
        const player1 = await dbManager.getPlayer('player1');
        const player2 = await dbManager.getPlayer('player2');
        
        runner.assertEqual(player1.net, 200, 'Player1 net should be updated');
        runner.assertEqual(player2.net, -100, 'Player2 net should be updated');
    });

    await runner.test('restoreFromBackup restores player data', async () => {
        // Reset to fresh state for this test
        dbManager = setupMockFirebase();
        
        // First create a backup of original state
        const backup = await dbManager.createBackup(['player1', 'player2']);
        
        // Update players
        await dbManager.updatePlayersInTransaction({
            player1: { net: 999 },
            player2: { net: -999 }
        });
        
        // Restore from backup
        await dbManager.restoreFromBackup(backup);
        
        const player1 = await dbManager.getPlayer('player1');
        const player2 = await dbManager.getPlayer('player2');
        
        runner.assertEqual(player1.net, 100, 'Player1 should be restored');
        runner.assertEqual(player2.net, -50, 'Player2 should be restored');
    });

    await runner.test('batchUpdatePlayers updates multiple players efficiently', async () => {
        const updates = {
            player1: { net: 300, games_played: ['2024-01-01', '2024-01-02'] },
            player2: { net: -150, games_played: ['2024-01-01', '2024-01-02'] }
        };
        
        const result = await dbManager.batchUpdatePlayers(updates);
        
        runner.assertEqual(result.successCount, 2, 'Should update both players');
        runner.assertEqual(result.errors.length, 0, 'Should have no errors');
        runner.assert(result.updatedPlayers.includes('player1'), 'Should list player1 as updated');
        runner.assert(result.updatedPlayers.includes('player2'), 'Should list player2 as updated');
        
        // Verify updates were applied
        const player1 = await dbManager.getPlayer('player1');
        const player2 = await dbManager.getPlayer('player2');
        
        runner.assertEqual(player1.net, 300, 'Player1 net should be updated');
        runner.assertEqual(player2.net, -150, 'Player2 net should be updated');
        runner.assertEqual(player1.games_played.length, 2, 'Player1 should have 2 games');
    });

    await runner.test('findPlayersByNicknames with cached data works efficiently', async () => {
        // Test that we can pass cached player data to avoid multiple fetches
        const playersData = await dbManager.fetchAllPlayers();
        const result1 = await dbManager.findPlayerByNickname('p1', playersData);
        const result2 = await dbManager.findPlayerByNickname('p2', playersData);
        
        runner.assert(result1, 'Should find player1 by nickname with cached data');
        runner.assert(result2, 'Should find player2 by nickname with cached data');
        runner.assertEqual(result1.playerKey, 'player1', 'Should return correct player1 key');
        runner.assertEqual(result2.playerKey, 'player2', 'Should return correct player2 key');
    });

    runner.summary();
}

async function runErrorTests() {
    console.log('\n🚨 Running Error Handling Tests...');
    const runner = new TestRunner();
    const dbManager = setupMockFirebase();

    await runner.test('Constructor throws without Firebase', async () => {
        const originalFirebase = global.firebase;
        global.firebase = { apps: [] };
        
        runner.assert(() => {
            new DatabaseManager();
        }, 'Should throw when Firebase not initialized');
        
        global.firebase = originalFirebase;
    });

    await runner.test('updatePlayersInTransaction throws with empty updates', async () => {
        await runner.assertThrows(async () => {
            await dbManager.updatePlayersInTransaction({});
        }, 'Should throw with empty updates');
    });

    await runner.test('createBackup throws with empty player list', async () => {
        await runner.assertThrows(async () => {
            await dbManager.createBackup([]);
        }, 'Should throw with empty player list');
    });

    await runner.test('restoreFromBackup throws with empty backup', async () => {
        await runner.assertThrows(async () => {
            await dbManager.restoreFromBackup({});
        }, 'Should throw with empty backup');
    });

    await runner.test('getErrorMessage handles Firebase error codes', async () => {
        const testCases = [
            { code: 'permission-denied', expected: 'Access denied. Please check your permissions.' },
            { code: 'unavailable', expected: 'Database is temporarily unavailable. Please try again.' },
            { code: 'not-found', expected: 'Requested data not found.' },
            { code: 'unauthenticated', expected: 'Authentication required. Please sign in.' }
        ];
        
        testCases.forEach(({ code, expected }) => {
            const error = new Error('Test error');
            error.code = code;
            const message = dbManager.getErrorMessage(error);
            runner.assertEqual(message, expected, `Should handle ${code} error`);
        });
    });

    await runner.test('getErrorMessage handles null error', async () => {
        const message = dbManager.getErrorMessage(null);
        runner.assertEqual(message, 'Unknown error occurred', 'Should handle null error');
    });

    await runner.test('findPlayerByNickname throws with invalid nickname', async () => {
        await runner.assertThrows(async () => {
            await dbManager.findPlayerByNickname('');
        }, 'Should throw with empty nickname');

        await runner.assertThrows(async () => {
            await dbManager.findPlayerByNickname(null);
        }, 'Should throw with null nickname');
    });

    await runner.test('findPlayersByNicknames throws with invalid input', async () => {
        await runner.assertThrows(async () => {
            await dbManager.findPlayersByNicknames(null);
        }, 'Should throw with null nicknames');

        await runner.assertThrows(async () => {
            await dbManager.findPlayersByNicknames('not-an-array');
        }, 'Should throw with non-array nicknames');
    });

    await runner.test('batchUpdatePlayers throws with empty updates', async () => {
        await runner.assertThrows(async () => {
            await dbManager.batchUpdatePlayers({});
        }, 'Should throw with empty updates');

        await runner.assertThrows(async () => {
            await dbManager.batchUpdatePlayers(null);
        }, 'Should throw with null updates');
    });

    await runner.test('getMultiplePlayers throws with invalid input', async () => {
        await runner.assertThrows(async () => {
            await dbManager.getMultiplePlayers(null);
        }, 'Should throw with null player keys');

        await runner.assertThrows(async () => {
            await dbManager.getMultiplePlayers('not-an-array');
        }, 'Should throw with non-array player keys');
    });

    runner.summary();
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Starting DatabaseManager Tests...');
    
    try {
        await runUnitTests();
        await runIntegrationTests();
        await runErrorTests();
        
        console.log('\n✅ All test suites completed!');
    } catch (error) {
        console.error('❌ Test execution failed:', error);
    }
}

// Export for Node.js or run in browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runAllTests, runUnitTests, runIntegrationTests, runErrorTests };
    
    // Auto-run tests in Node.js environment
    if (require.main === module) {
        runAllTests();
    }
} else {
    // Run tests if in browser
    if (typeof window !== 'undefined') {
        window.runDatabaseManagerTests = runAllTests;
        console.log('DatabaseManager tests loaded. Run window.runDatabaseManagerTests() to execute.');
    }
}