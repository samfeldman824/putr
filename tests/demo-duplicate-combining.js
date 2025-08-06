#!/usr/bin/env node

/**
 * Demonstration of duplicate nickname combining functionality
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

// Load the GameResultsDisplay class
const gameResultsCode = fs.readFileSync('src/gameResultsDisplay.js', 'utf8');
eval(gameResultsCode);

// Demo function
function demonstrateDuplicateCombining() {
    console.log('🎮 Demonstrating Duplicate Nickname Combining\n');
    
    const display = new GameResultsDisplay();
    
    // Sample game data with duplicate nicknames (like multiple buy-ins)
    const gameData = {
        players: [
            { player_nickname: 'Alice', net: 1500 },  // Alice's first session: +$15.00
            { player_nickname: 'Alice', net: 1050 },  // Alice's rebuy session: +$10.50
            { player_nickname: 'Bob', net: -1275 },   // Bob's session: -$12.75
            { player_nickname: 'Charlie', net: 750 }, // Charlie's first session: +$7.50
            { player_nickname: 'Charlie', net: -500 }, // Charlie's rebuy session: -$5.00
            { player_nickname: 'Diana', net: -2025 }  // Diana's session: -$20.25
        ]
    };
    
    console.log('📊 Original CSV entries:');
    gameData.players.forEach((player, index) => {
        console.log(`  ${index + 1}. ${player.player_nickname}: ${player.net > 0 ? '+' : ''}$${(player.net / 100).toFixed(2)}`);
    });
    
    console.log('\n🔄 After combining duplicate nicknames:');
    
    // Format and combine duplicates
    const formattedResults = display.formatPlayerResults(gameData);
    const sortedResults = display.sortPlayersByNet(formattedResults);
    
    sortedResults.forEach((player, index) => {
        const rank = index + 1;
        const icon = rank === 1 ? '🏆' : rank === sortedResults.length ? '💸' : '🎯';
        console.log(`  ${rank}. ${icon} ${player.nickname}: ${player.formattedNet}`);
    });
    
    console.log('\n✨ Key Benefits:');
    console.log('  • Alice\'s two sessions ($15.00 + $10.50) = $25.50 total');
    console.log('  • Charlie\'s two sessions ($7.50 - $5.00) = $2.50 total');
    console.log('  • Clean, consolidated view of each player\'s final result');
    console.log('  • Proper sorting by combined net amounts');
    
    console.log('\n🎯 This ensures that players with multiple buy-ins/rebuys');
    console.log('   are shown as single entries with their total net result!');
}

// Run the demonstration
demonstrateDuplicateCombining();