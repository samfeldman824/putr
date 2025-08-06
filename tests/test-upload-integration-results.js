/**
 * Integration test for game results display in upload workflow
 */

// Mock DOM environment for testing
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

// Mock window.location
global.window.location = {
    href: 'http://localhost/test',
    pathname: '/test',
    search: '',
    hash: ''
};

// Mock Firebase
global.firebase = {
    apps: [{}],
    firestore: () => ({
        collection: () => ({
            get: () => Promise.resolve({
                docs: []
            }),
            doc: () => ({
                get: () => Promise.resolve({
                    exists: true,
                    data: () => ({})
                }),
                set: () => Promise.resolve(),
                update: () => Promise.resolve()
            })
        }),
        runTransaction: (callback) => Promise.resolve(callback({
            get: () => Promise.resolve({
                exists: true,
                data: () => ({})
            }),
            set: () => {},
            update: () => {}
        }))
    })
};

// Mock localStorage
global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
};

// Load required modules
const fs = require('fs');

// Load all components
const debugManagerCode = fs.readFileSync('src/debugManager.js', 'utf8');
eval(debugManagerCode);

const constantsCode = fs.readFileSync('src/constants.js', 'utf8');
eval(constantsCode);

const errorHandlerCode = fs.readFileSync('src/errorHandler.js', 'utf8');
eval(errorHandlerCode);

const csvProcessorCode = fs.readFileSync('src/csvProcessor.js', 'utf8');
eval(csvProcessorCode);

const playerStatsCalculatorCode = fs.readFileSync('src/playerStatsCalculator.js', 'utf8');
eval(playerStatsCalculatorCode);

const databaseManagerCode = fs.readFileSync('src/databaseManager.js', 'utf8');
eval(databaseManagerCode);

const undoManagerCode = fs.readFileSync('src/undoManager.js', 'utf8');
eval(undoManagerCode);

const gameResultsDisplayCode = fs.readFileSync('src/gameResultsDisplay.js', 'utf8');
eval(gameResultsDisplayCode);

const uploadInterfaceCode = fs.readFileSync('src/uploadInterface.js', 'utf8');
eval(uploadInterfaceCode);

const uploadOrchestratorCode = fs.readFileSync('src/uploadOrchestrator.js', 'utf8');
eval(uploadOrchestratorCode);

// Test the integration
async function testUploadIntegration() {
    console.log('🧪 Testing upload integration with game results display...');
    
    try {
        // Create orchestrator
        const orchestrator = new UploadOrchestrator();
        
        // Mock the upload interface methods
        const mockUploadInterface = {
            initialize: () => {},
            setFileSelectedCallback: () => {},
            showProcessingStep: (step, total, message) => {
                console.log(`Step ${step}/${total}: ${message}`);
            },
            showDetailedSuccess: (gameDate, playerCount, undoCallback) => {
                console.log(`✅ Success: ${gameDate} with ${playerCount} players`);
            },
            resetInterface: () => {},
            showStructuredError: (error) => {
                console.log(`❌ Error: ${error.message}`);
            }
        };
        
        // Mock the database manager
        const mockDatabaseManager = {
            validateFirebaseSetup: () => {},
            fetchAllPlayers: () => Promise.resolve({
                'player1': {
                    player_nicknames: ['Alice', 'alice'],
                    net: 0,
                    games_played: []
                },
                'player2': {
                    player_nicknames: ['Bob', 'bob'],
                    net: 0,
                    games_played: []
                }
            }),
            createBackup: (keys) => Promise.resolve({}),
            updatePlayersInTransaction: (updates) => Promise.resolve()
        };
        
        // Initialize with mocked components
        orchestrator.initialize({
            uploadInterface: mockUploadInterface,
            databaseManager: mockDatabaseManager
        });
        
        // Create test CSV file with duplicate nicknames to test combining
        const testCSV = `player_nickname,player_id,session_start_at,session_end_at,buy_in,buy_out,stack,net
Alice,1,2023-10-15 19:00:00,2023-10-15 21:00:00,5000,6500,6500,1500
Alice,1,2023-10-15 21:00:00,2023-10-15 23:00:00,5000,6050,6050,1050
Bob,2,2023-10-15 19:00:00,2023-10-15 23:00:00,5000,3725,3725,-1275`;
        
        const testFile = new File([testCSV], 'ledger23_10_15.csv', { type: 'text/csv' });
        
        // Test the upload process
        console.log('🚀 Starting upload test...');
        await orchestrator.handleFileUpload(testFile);
        
        // Check if game results display was called
        const gameResultsDisplay = orchestrator.gameResultsDisplay;
        const displayInfo = gameResultsDisplay.getDisplayInfo();
        
        console.log('📊 Upload integration test results:');
        console.log('- GameResultsDisplay component exists:', !!gameResultsDisplay);
        console.log('- Display info:', displayInfo);
        
        // Check if modal was created (in mock environment)
        const modalExists = document.getElementById('results-modal-overlay') !== null;
        console.log('- Modal created:', modalExists);
        
        console.log('✅ Upload integration test completed successfully!');
        return true;
        
    } catch (error) {
        console.error('❌ Upload integration test failed:', error);
        return false;
    }
}

// Run the test
testUploadIntegration().then(success => {
    process.exit(success ? 0 : 1);
});