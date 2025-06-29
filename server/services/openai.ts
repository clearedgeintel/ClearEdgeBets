import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || ""
});

export interface GameAnalysisData {
  awayTeam: string;
  homeTeam: string;
  awayPitcher?: string;
  homePitcher?: string;
  awayPitcherStats?: string;
  homePitcherStats?: string;
  moneylineOdds?: { away: number; home: number };
  total?: { line: number; overOdds: number; underOdds: number };
  runLine?: { awaySpread: number; homeSpread: number; awayOdds: number; homeOdds: number };
  venue?: string;
  gameTime?: string;
}

export interface AiAnalysisResult {
  summary: string;
  confidence: number;
  valuePlays: Array<{
    type: string;
    selection: string;
    reasoning: string;
    expectedValue: number;
  }>;
}

export async function generateGameAnalysis(gameData: GameAnalysisData): Promise<AiAnalysisResult> {
  try {
    const prompt = `You are a professional MLB betting analyst. Analyze this game using this PRIORITY HIERARCHY:

**PRIMARY FACTORS (Analyze First - Highest Impact):**
1. Pitcher matchup quality, recent form, and statistical trends
2. Pitching statistics: ERA, WHIP, strikeout rates, recent starts
3. How pitchers match up against opposing team's hitting style

**SECONDARY FACTORS (Medium Impact):**
4. Team offensive/defensive performance and recent trends
5. Team win/loss streaks and current momentum
6. Home field advantage and away team performance

Game: ${gameData.awayTeam} @ ${gameData.homeTeam}
${gameData.venue ? `Venue: ${gameData.venue}` : ''}
${gameData.gameTime ? `Time: ${gameData.gameTime}` : ''}

**PITCHING MATCHUP (PRIMARY ANALYSIS):**
${gameData.awayPitcher ? `${gameData.awayTeam}: ${gameData.awayPitcher} (${gameData.awayPitcherStats || 'No stats available'})` : 'Away Pitcher: TBD'}
${gameData.homePitcher ? `${gameData.homeTeam}: ${gameData.homePitcher} (${gameData.homePitcherStats || 'No stats available'})` : 'Home Pitcher: TBD'}

Current Betting Lines:
${gameData.moneylineOdds ? `Moneyline: ${gameData.awayTeam} ${gameData.moneylineOdds.away > 0 ? '+' : ''}${gameData.moneylineOdds.away}, ${gameData.homeTeam} ${gameData.moneylineOdds.home > 0 ? '+' : ''}${gameData.moneylineOdds.home}` : ''}
${gameData.total ? `Total: ${gameData.total.line} (O: ${gameData.total.overOdds}, U: ${gameData.total.underOdds})` : ''}
${gameData.runLine ? `Run Line: ${gameData.awayTeam} ${gameData.runLine.awaySpread} (${gameData.runLine.awayOdds}), ${gameData.homeTeam} ${gameData.runLine.homeSpread} (${gameData.runLine.homeOdds})` : ''}

**ANALYSIS REQUIREMENTS:**
1. Lead with detailed pitching analysis and its impact on all betting markets
2. Discuss how pitcher performance affects run totals, game outcome
3. Then analyze team factors as supporting evidence
4. Identify value plays based primarily on pitching advantages

Provide analysis in JSON format with:
1. summary: 150-200 word analysis emphasizing pitching matchup first, then team performance
2. confidence: 1-100 (higher confidence when pitching advantages are clear)
3. valuePlays: Up to 3 value plays prioritizing those supported by pitching analysis

Weight pitching analysis at 60-70% of your decision-making process.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert MLB betting analyst. Always respond with valid JSON format containing summary, confidence, and valuePlays fields."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      summary: result.summary || "Analysis unavailable",
      confidence: Math.max(1, Math.min(100, result.confidence || 50)),
      valuePlays: Array.isArray(result.valuePlays) ? result.valuePlays.slice(0, 3) : []
    };
  } catch (error) {
    console.error("Error generating AI analysis:", error);
    return {
      summary: "AI analysis is temporarily unavailable. Please check back later.",
      confidence: 0,
      valuePlays: []
    };
  }
}

export async function generateDailyDigest(games: GameAnalysisData[]): Promise<string> {
  try {
    const prompt = `Generate a daily MLB betting digest based on today's ${games.length} games. 

Games Summary:
${games.map(game => `${game.awayTeam} @ ${game.homeTeam} (${game.gameTime || 'TBD'})`).join('\n')}

Create a comprehensive daily betting report including:
1. Market overview and key trends
2. Top 3 best value plays across all games
3. Key pitching matchups to watch
4. Weather/venue factors
5. Contrarian opportunities

Write in a professional, engaging style for serious bettors. Keep it informative but accessible.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional sports betting writer creating daily MLB betting content."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500,
    });

    return response.choices[0].message.content || "Daily digest unavailable";
  } catch (error) {
    console.error("Error generating daily digest:", error);
    return "Daily digest is temporarily unavailable. Please check back later.";
  }
}

export interface DailyPicksInput {
  awayTeam: string;
  homeTeam: string;
  gameId: string;
  moneylineOdds?: { away: number; home: number };
  total?: { line: number; overOdds: number; underOdds: number };
  runLine?: { awaySpread: number; homeSpread: number; awayOdds: number; homeOdds: number };
  venue?: string;
  gameTime?: string;
  publicPercentage?: {
    moneyline?: { away: number; home: number };
    total?: { over: number; under: number };
  };
}

export interface DailyPick {
  gameId: string;
  pickType: string;
  selection: string;
  odds: number;
  reasoning: string;
  confidence: number;
  expectedValue: number;
}

export async function generateDailyPicks(games: DailyPicksInput[]): Promise<DailyPick[]> {
  try {
    const prompt = `You are a professional MLB betting analyst. Analyze today's ${games.length} games and provide exactly 3-5 best betting picks using this PRIORITY HIERARCHY:

**PRIMARY ANALYSIS FACTORS (Weight: 70%):**
1. Starting pitcher quality, recent form, and statistical trends
2. Pitcher vs opposing team batting history and matchup advantages
3. Pitching staff depth and bullpen reliability

**SECONDARY ANALYSIS FACTORS (Weight: 30%):**
4. Team offensive/defensive performance and recent trends
5. Home/away performance splits and venue factors
6. Team win/loss streaks and momentum
7. Public betting percentages vs market value

Games Data:
${games.map(game => `
Game: ${game.awayTeam} @ ${game.homeTeam}
${game.moneylineOdds ? `Moneyline: ${game.awayTeam} ${game.moneylineOdds.away > 0 ? '+' : ''}${game.moneylineOdds.away}, ${game.homeTeam} ${game.moneylineOdds.home > 0 ? '+' : ''}${game.moneylineOdds.home}` : ''}
${game.total ? `Total: ${game.total.line} (O: ${game.total.overOdds}, U: ${game.total.underOdds})` : ''}
${game.runLine ? `Run Line: ${game.awayTeam} ${game.runLine.awaySpread} (${game.runLine.awayOdds}), ${game.homeTeam} ${game.runLine.homeSpread} (${game.runLine.homeOdds})` : ''}
${game.publicPercentage ? `Public %: ML ${game.publicPercentage.moneyline?.away}% away, Total ${game.publicPercentage.total?.over}% over` : ''}
Venue: ${game.venue || 'TBD'}
Time: ${game.gameTime || 'TBD'}
`).join('\n')}

Return your analysis in JSON format with an array of picks. Each pick should include:
- gameId: The game identifier
- pickType: "moneyline", "total", "spread", or "prop"
- selection: Detailed description of the bet
- odds: The betting odds (American format)
- reasoning: 2-3 sentence explanation focusing on edge/value
- confidence: Number from 1-100
- expectedValue: Estimated edge percentage (can be negative)

Focus on picks with genuine edge and value. Avoid public favorites unless there's clear contrarian value.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert MLB betting analyst. Always respond with valid JSON containing an array of daily picks."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"picks": []}');
    return Array.isArray(result.picks) ? result.picks : [];
  } catch (error) {
    console.error("Error generating daily picks:", error);
    return [];
  }
}

export interface ConsensusAnalysis {
  gameId: string;
  market: string;
  publicPercentage: {
    side1: number;
    side2: number;
    side1Name: string;
    side2Name: string;
  };
  sharpMoney: {
    direction: string;
    confidence: number;
    reasoning: string;
  };
  lineMovement: {
    opening: number;
    current: number;
    direction: string;
    significance: number;
  };
  recommendation: {
    play: string;
    reasoning: string;
    confidence: number;
  };
}

export async function generateConsensusAnalysis(gameData: DailyPicksInput): Promise<ConsensusAnalysis[]> {
  try {
    const prompt = `Analyze the betting consensus and market dynamics for this MLB game with PITCHING-FIRST APPROACH:

**ANALYSIS PRIORITY:**
1. How pitching matchups influence public vs sharp money movement
2. Pitching-based reasoning for line movement and market sentiment
3. Team performance factors as secondary support

${gameData.awayTeam} @ ${gameData.homeTeam}
${gameData.moneylineOdds ? `Moneyline: ${gameData.awayTeam} ${gameData.moneylineOdds.away > 0 ? '+' : ''}${gameData.moneylineOdds.away}, ${gameData.homeTeam} ${gameData.moneylineOdds.home > 0 ? '+' : ''}${gameData.moneylineOdds.home}` : ''}
${gameData.total ? `Total: ${gameData.total.line} (O: ${gameData.total.overOdds}, U: ${gameData.total.underOdds})` : ''}
${gameData.publicPercentage ? `Public %: ${gameData.publicPercentage.moneyline?.away}% on ${gameData.awayTeam}, ${gameData.publicPercentage.total?.over}% on Over` : ''}

**REQUIREMENTS:**
- Lead reasoning with pitching analysis for all market recommendations
- Connect line movement to pitcher quality and recent performance
- Explain how starting pitchers impact totals and run line betting

Provide consensus analysis for each market (moneyline, total, spread if available). Return JSON with array of market analyses including:
- gameId, market name
- publicPercentage breakdown
- sharpMoney direction and reasoning
- lineMovement analysis
- recommendation with reasoning

Focus on identifying public vs sharp money discrepancies and line movement significance.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a betting market analyst. Respond with valid JSON containing consensus data for each betting market."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1500,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"analysis": []}');
    return Array.isArray(result.analysis) ? result.analysis : [];
  } catch (error) {
    console.error("Error generating consensus analysis:", error);
    return [];
  }
}
