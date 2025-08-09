#!/usr/bin/env node

/**
 * Demonstration of the Debug System
 * Shows how verbose logging can be controlled from the browser console
 */

const fs = require('fs');

// Mock DOM environment
global.document = {
    createElement: () => ({
        textContent: '',
        innerHTML: ''
    })
};

global.window = global;

// Load the debug manager
const debugManagerCode = fs.readFileSync('src/debugManager.js', 'utf8');
eval(debugManagerCode);

// Load the player stats calculator
const playerStatsCalculatorCode = fs.readFileSync('src/playerStatsCalculator.js', 'utf8');
eval(playerStatsCalculatorCode);

// Demo function
function demonstrateDebugSystem() {
    console.log('🐛 Debug System Demonstration\n');
    
    const calculator = new PlayerStatsCalculator();
    
    // Sample player data
    const playersData = {
        'Alice': { player_nicknames: ['alice', 'al'] },
        'Bob': { player_nicknames: ['bobby', 'b'] },
        'Charlie': { player_nicknames: ['chuck', 'char'] }
    };
    
    console.log('📊 Testing player matching WITHOUT debug mode:');
    console.log('(Notice: no verbose logging appears)\n');
    
    // Test without debug mode - should be quiet
    let result = calculator.matchPlayerByNickname('alice', playersData);
    console.log(`Result: ${result}\n`);
    
    console.log('📊 Now enabling debug mode for playerMatching:');
    debugManager.enable('playerMatching');
    console.log('');
    
    // Test with debug mode - should show verbose logging
    result = calculator.matchPlayerByNickname('bobby', playersData);
    console.log(`Result: ${result}\n`);
    
    console.log('📊 Testing with a non-existent player:');
    result = calculator.matchPlayerByNickname('unknown', playersData);
    console.log(`Result: ${result}\n`);
    
    console.log('📊 Disabling debug mode:');
    debugManager.disable('playerMatching');
    console.log('');
    
    // Test without debug mode again - should be quiet
    result = calculator.matchPlayerByNickname('chuck', playersData);
    console.log(`Result: ${result}\n`);
    
    console.log('✨ Debug System Features:');
    console.log('  • In browser console, use: window.debug.enable("playerMatching")');
    console.log('  • Available modes: playerMatching, csvProcessing, gameResults, upload, database, all');
    console.log('  • Use window.debug.status() to see current settings');
    console.log('  • Use window.debug.disable("all") to turn off all debug logging');
    console.log('  • Debug logging only appears when explicitly enabled!');
}

// Run the demonstration
demonstrateDebugSystem();