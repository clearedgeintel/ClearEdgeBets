// Test script to settle bets manually
const { settlePendingBets } = require('./server/services/bet-settlement.ts');

async function testBetSettlement() {
  console.log('Testing bet settlement system...');
  
  try {
    const settledBets = await settlePendingBets();
    console.log(`Successfully settled ${settledBets} bets`);
  } catch (error) {
    console.error('Error settling bets:', error);
  }
}

testBetSettlement();