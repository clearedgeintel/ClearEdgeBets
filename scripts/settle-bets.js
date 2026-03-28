// Immediate bet settlement script
import { settlePendingBets, settleVirtualBets } from './server/services/bet-settlement.js';

async function settleBetsNow() {
  console.log('🎯 Starting bet settlement...');
  
  try {
    // Settle regular bets
    console.log('⚾ Settling regular bets...');
    const regularBetsSettled = await settlePendingBets();
    console.log(`✅ Settled ${regularBetsSettled} regular bets`);
    
    // Settle virtual bets
    console.log('🎮 Settling virtual bets...');
    const virtualBetsSettled = await settleVirtualBets();
    console.log(`✅ Settled ${virtualBetsSettled} virtual bets`);
    
    console.log(`🏆 Total: ${regularBetsSettled + virtualBetsSettled} bets reconciled`);
    
  } catch (error) {
    console.error('❌ Error settling bets:', error);
  }
  
  process.exit(0);
}

settleBetsNow();