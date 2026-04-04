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

export interface BettingRecommendation {
  betType: 'moneyline' | 'spread' | 'total';
  selection: string;
  odds: number;
  confidence: number;
  reasoning: string;
  expectedValue: string;
  stakeRecommendation: number;
}

export interface EnhancedPicksResult {
  topPicks: BettingRecommendation[];
  overallConfidence: number;
  analysisMetadata: {
    oddsAnalyzed: string[];
    keyFactors: string[];
    riskAssessment: string;
  };
}

export async function generateNewsletterHtml(prompt: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional sports betting analyst writing HTML newsletters. Return only clean, production-ready HTML with no markdown, comments, or explanations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 8000
    });

    let htmlContent = completion.choices[0]?.message?.content || "<html><body><h1>Newsletter generation failed</h1></body></html>";
    
    // Extract HTML from markdown code blocks if present
    if (htmlContent.includes('```html')) {
      const matches = htmlContent.match(/```html\s*([\s\S]*?)\s*```/);
      if (matches && matches[1]) {
        htmlContent = matches[1].trim();
      }
    } else if (htmlContent.includes('```')) {
      // Handle case where there are code blocks without 'html' specifier
      const matches = htmlContent.match(/```\s*([\s\S]*?)\s*```/);
      if (matches && matches[1]) {
        htmlContent = matches[1].trim();
      }
    }
    
    return htmlContent;
  } catch (error) {
    console.error("Error generating newsletter HTML:", error);
    return "<html><body><h1>Error generating newsletter</h1><p>Please try again later.</p></body></html>";
  }
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
      model: "gpt-4o-mini",
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
  awayPitcher?: string;
  homePitcher?: string;
  awayPitcherStats?: string;
  homePitcherStats?: string;
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
GameID: ${game.gameId}
Game: ${game.awayTeam} @ ${game.homeTeam}
${game.awayPitcher && game.homePitcher ? `Pitching: ${game.awayPitcher} ${game.awayPitcherStats || ''} vs ${game.homePitcher} ${game.homePitcherStats || ''}` : 'Pitching matchup TBD'}
${game.moneylineOdds ? `Moneyline: ${game.awayTeam} ${game.moneylineOdds.away > 0 ? '+' : ''}${game.moneylineOdds.away}, ${game.homeTeam} ${game.moneylineOdds.home > 0 ? '+' : ''}${game.moneylineOdds.home}` : ''}
${game.total ? `Total: ${game.total.line} (O: ${game.total.overOdds}, U: ${game.total.underOdds})` : ''}
${game.runLine ? `Run Line: ${game.awayTeam} ${game.runLine.awaySpread} (${game.runLine.awayOdds}), ${game.homeTeam} ${game.runLine.homeSpread} (${game.runLine.homeOdds})` : ''}
${game.publicPercentage ? `Public %: ML ${game.publicPercentage.moneyline?.away}% away, Total ${game.publicPercentage.total?.over}% over` : ''}
Venue: ${game.venue || 'TBD'}
Time: ${game.gameTime || 'TBD'}
`).join('\n')}

**CRITICAL INSTRUCTIONS FOR GAMEID FORMAT:**
You MUST use the EXACT GameID format shown in the data above. DO NOT create your own gameId format.

Example GameID formats from the data:
- CORRECT: "2025-07-23_CIN @ WSH" 
- WRONG: "Cincinnati Reds @ Washington Nationals"
- WRONG: "Game: Cincinnati Reds @ Washington Nationals"

Return your analysis in JSON format with an array of picks. Each pick MUST include:
- gameId: Copy the EXACT GameID string from the games data above (format: "2025-07-23_XXX @ YYY")
- pickType: "moneyline", "total", "spread", or "prop"
- selection: Detailed description of the bet
- odds: The betting odds (American format)
- reasoning: Detailed 100-150 word analysis focusing on pitching matchups, team trends, and specific betting edge. Include specific statistical insights and why this pick offers value.
- confidence: Number from 1-100
- expectedValue: Estimated edge percentage (can be negative)

**REASONING REQUIREMENTS:**
- Start with pitching analysis (starter quality, recent form, matchup advantages)
- Include team offensive/defensive trends supporting the pick
- Explain the specific edge or value opportunity
- Mention relevant situational factors (home/away, streaks, weather, etc.)
- Be specific and detailed like professional betting analysis

Focus on picks with genuine edge and value. Avoid public favorites unless there's clear contrarian value.

**CRITICAL: Ensure all picks are UNIQUE combinations of gameId + pickType + selection. Do not repeat the same bet multiple times.**`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert MLB betting analyst. Always respond with valid JSON containing an array of daily picks with detailed reasoning."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 4000,
    });

    const content = response.choices[0].message.content || '{"picks": []}';
    console.log('OpenAI picks response:', content.substring(0, 500));
    
    const result = JSON.parse(content);
    const picks = Array.isArray(result.picks) ? result.picks : 
                  Array.isArray(result.dailyPicks) ? result.dailyPicks : 
                  Array.isArray(result) ? result : [];
    console.log(`Parsed ${picks.length} picks from OpenAI response`);
    
    return picks;
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
      model: "gpt-4o-mini",
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

// Generate AI-powered support tickets for automated insights
export async function generateAITicket(requestData: {
  type: 'daily_market_insight' | 'weekly_summary' | 'feature_request' | 'bug_analysis';
  games?: any[];
  marketConditions?: any;
  performanceData?: any;
  dateRange?: { start: Date; end: Date };
}): Promise<{
  analysis: string;
  recommendations?: string[];
  metrics?: any;
  summary?: string;
}> {
  try {
    let prompt = '';
    
    switch (requestData.type) {
      case 'daily_market_insight':
        prompt = `You are an expert MLB betting analyst generating a daily market insight report. 

**Current Market Data:**
- Total games analyzed: ${requestData.games?.length || 0}
- Market conditions: ${JSON.stringify(requestData.marketConditions, null, 2)}

**Analysis Requirements:**
1. Identify the strongest betting opportunities for today
2. Highlight any unusual line movements or market inefficiencies  
3. Provide risk assessment for high-profile games
4. Suggest bankroll management strategies for current market conditions
5. Flag any red flags or concerning trends

**Output Format:**
Provide a comprehensive analysis in JSON format:
{
  "analysis": "Detailed market analysis text",
  "recommendations": ["actionable recommendation 1", "recommendation 2", "..."]
}

Focus on actionable insights that would help betting professionals make informed decisions.`;
        break;

      case 'weekly_summary':
        prompt = `You are generating a comprehensive weekly performance summary for a professional betting platform.

**Performance Data:**
${JSON.stringify(requestData.performanceData, null, 2)}

**Date Range:** ${requestData.dateRange?.start.toDateString()} to ${requestData.dateRange?.end.toDateString()}

**Analysis Requirements:**
1. Overall performance metrics and trends
2. Best performing bet types and strategies
3. Areas for improvement and optimization
4. Market pattern recognition
5. Strategic recommendations for next week

**Output Format:**
{
  "summary": "Executive summary of weekly performance",
  "metrics": {
    "winRate": "percentage",
    "roi": "return on investment",
    "topPerformer": "best strategy/bet type",
    "improvement_area": "area needing attention"
  },
  "recommendations": ["strategic recommendation 1", "recommendation 2"]
}`;
        break;

      default:
        prompt = `Generate a professional analysis ticket for type: ${requestData.type}`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert MLB betting analyst and platform administrator. Generate professional, actionable insights for automated ticket system."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result;
  } catch (error) {
    console.error("Error generating AI ticket:", error);
    
    // Fallback response structure
    return {
      analysis: `Automated ${requestData.type} analysis generated on ${new Date().toLocaleDateString()}. 
      Market data has been collected and is ready for review. 
      Contact platform administrator for detailed insights.`,
      recommendations: [
        "Review current betting positions",
        "Monitor line movements closely",
        "Adjust bankroll management strategy"
      ]
    };
  }
}

export async function generateEnhancedBettingPicks(
  gameData: GameAnalysisData, 
  existingAnalysis: string, 
  odds: {
    moneyline?: { away: number; home: number };
    spread?: { awaySpread: number; homeSpread: number; awayOdds: number; homeOdds: number };
    total?: { line: number; overOdds: number; underOdds: number };
  }
): Promise<EnhancedPicksResult> {
  try {
    const prompt = `As a professional sports betting analyst, analyze this MLB game and provide exactly 3 betting recommendations based on the existing AI analysis and current odds.

GAME DETAILS:
${gameData.awayTeam} @ ${gameData.homeTeam}
Away Pitcher: ${gameData.awayPitcher || 'TBD'} ${gameData.awayPitcherStats || ''}
Home Pitcher: ${gameData.homePitcher || 'TBD'} ${gameData.homePitcherStats || ''}
Venue: ${gameData.venue || 'N/A'}

EXISTING AI ANALYSIS:
${existingAnalysis}

CURRENT ODDS:
${odds.moneyline ? `Moneyline: ${gameData.awayTeam} ${odds.moneyline.away > 0 ? '+' : ''}${odds.moneyline.away}, ${gameData.homeTeam} ${odds.moneyline.home > 0 ? '+' : ''}${odds.moneyline.home}` : ''}
${odds.spread ? `Run Line: ${gameData.awayTeam} ${odds.spread.awaySpread > 0 ? '+' : ''}${odds.spread.awaySpread} (${odds.spread.awayOdds}), ${gameData.homeTeam} ${odds.spread.homeSpread > 0 ? '+' : ''}${odds.spread.homeSpread} (${odds.spread.homeOdds})` : ''}
${odds.total ? `Total: Over ${odds.total.line} (${odds.total.overOdds}), Under ${odds.total.line} (${odds.total.underOdds})` : ''}

INSTRUCTIONS:
1. Analyze the existing AI summary for key insights about team advantages, pitching matchups, and game factors
2. Evaluate each available betting market (moneyline, spread, total) for value opportunities
3. Consider implied probabilities vs. your assessment based on the analysis
4. Provide exactly 3 picks ranked by confidence and value

Return your response as valid JSON in this exact format:
{
  "topPicks": [
    {
      "betType": "moneyline|spread|total",
      "selection": "Team Name ML|Team Name +/-X.X|Over/Under X.X",
      "odds": numeric_odds_value,
      "confidence": confidence_percentage_1_to_100,
      "reasoning": "Detailed explanation referencing analysis and odds value",
      "expectedValue": "+X.X%" or "-X.X%",
      "stakeRecommendation": percentage_1_to_10
    }
  ],
  "overallConfidence": average_confidence_of_top_3_picks,
  "analysisMetadata": {
    "oddsAnalyzed": ["moneyline", "spread", "total"],
    "keyFactors": ["factor1", "factor2", "factor3"],
    "riskAssessment": "low|medium|high"
  }
}

Focus on value betting opportunities where your analysis suggests the true probability differs from implied odds probability. Be specific about why each pick has value based on the existing analysis.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional sports betting analyst. Analyze games and odds to find value betting opportunities. Always return valid JSON responses only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    return {
      topPicks: Array.isArray(result.topPicks) ? result.topPicks.slice(0, 3) : [],
      overallConfidence: Math.max(1, Math.min(100, result.overallConfidence || 50)),
      analysisMetadata: {
        oddsAnalyzed: Array.isArray(result.analysisMetadata?.oddsAnalyzed) ? result.analysisMetadata.oddsAnalyzed : [],
        keyFactors: Array.isArray(result.analysisMetadata?.keyFactors) ? result.analysisMetadata.keyFactors : [],
        riskAssessment: result.analysisMetadata?.riskAssessment || 'medium'
      }
    };
  } catch (error) {
    console.error("Error generating enhanced betting picks:", error);
    return {
      topPicks: [],
      overallConfidence: 0,
      analysisMetadata: {
        oddsAnalyzed: [],
        keyFactors: ['Analysis temporarily unavailable'],
        riskAssessment: 'high'
      }
    };
  }
}

// ── Expert Panel Pick Generator ──────────────────────────────────────

import type { ExpertAnalyst } from '@shared/expert-panel';

export interface ExpertPickInput {
  expert: ExpertAnalyst;
  games: Array<{
    gameId: string;
    away: string;
    home: string;
    gameTime: string;
    awayPitcher?: string;
    homePitcher?: string;
    moneyline?: { away: number; home: number };
    total?: { line: string };
    runline?: { away: string; home: string };
    parkFactor?: number;
    weather?: string;
  }>;
}

export async function generateExpertPicks(input: ExpertPickInput): Promise<Array<{
  gameId: string;
  pickType: string;
  selection: string;
  odds: number;
  confidence: number;
  rationale: string;
  units: number;
}>> {
  const { expert, games } = input;
  if (games.length === 0) return [];

  const gameLines = games.map(g => {
    let line = `${g.away} @ ${g.home} (${g.gameTime})`;
    if (g.awayPitcher || g.homePitcher) line += ` | ${g.awayPitcher || 'TBD'} vs ${g.homePitcher || 'TBD'}`;
    if (g.moneyline) line += ` | ML: ${g.moneyline.away > 0 ? '+' : ''}${g.moneyline.away} / ${g.moneyline.home > 0 ? '+' : ''}${g.moneyline.home}`;
    if (g.total) line += ` | O/U: ${g.total.line}`;
    if (g.runline) line += ` | RL: ${g.away} ${g.runline.away} / ${g.home} ${g.runline.home}`;
    if (g.parkFactor) line += ` | PF: ${g.parkFactor}`;
    if (g.weather) line += ` | ${g.weather}`;
    return line;
  }).join('\n');

  // Auto-fetch real-time news context for expert picks
  let newsBlock = '';
  try {
    const { buildNewsContext, formatContextForPrompt } = await import('./news-context');
    const newsCtx = await buildNewsContext();
    newsBlock = formatContextForPrompt(newsCtx);
  } catch {}

  const prompt = `${expert.voiceDirective}
${newsBlock}
You are analyzing today's MLB slate. Pick ${expert.maxPicksPerDay} games maximum. Only pick games where you have a genuine edge based on your specialty.

**Your preferred bet types:** ${expert.pickTypes.join(', ')}
**Your risk level:** ${expert.riskLevel}

**Today's games:**
${gameLines}

For each pick, provide:
- gameId: the away@home code (e.g. "NYY@BOS")
- pickType: moneyline, total, or runline
- selection: the specific pick (e.g. "NYY ML", "Over 8.5", "LAD -1.5")
- odds: the odds number (e.g. -130, +150)
- confidence: 1-100 how confident you are
- rationale: 1-2 sentences in YOUR voice explaining why
- units: how many units to risk (0.5 to 3.0 based on confidence)

Return JSON: { "picks": [...] }
If no games have enough edge for your style, return { "picks": [] } — it's fine to pass.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.85,
      max_tokens: 1200,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return (result.picks || []).slice(0, expert.maxPicksPerDay);
  } catch (error) {
    console.error(`Error generating picks for ${expert.name}:`, error);
    return [];
  }
}

// ── Sarcastic Game Review Generator ──────────────────────────────────

import { BEAT_WRITERS, getRandomBeatWriter, getBeatWriter, type BeatWriter } from '@shared/beat-writers';

export interface GameReviewInput {
  gameId: string;
  awayTeam: string;
  homeTeam: string;
  awayScore: number;
  homeScore: number;
  venue: string;
  weather: string;
  attendance: string;
  wind: string;
  lineScore: any;
  decisions: any[];
  playerHighlights: string;
}

export interface GameReviewResult {
  title: string;
  content: string;
  slug: string;
  author: string;
  authorMood: string;
}

export async function generateSarcasticGameReview(input: GameReviewInput): Promise<GameReviewResult> {
  const blowout = Math.abs(input.awayScore - input.homeScore) >= 6;
  const shutout = input.awayScore === 0 || input.homeScore === 0;
  const extras = input.lineScore?.away?.scoresByInning && Object.keys(input.lineScore.away.scoresByInning).length > 9;
  const winner = input.awayScore > input.homeScore ? input.awayTeam : input.homeTeam;
  const loser = input.awayScore > input.homeScore ? input.homeTeam : input.awayTeam;
  const writer = getRandomBeatWriter();

  // Auto-fetch real-time news context
  let newsBlock = '';
  try {
    const { buildNewsContext, formatContextForPrompt } = await import('./news-context');
    const newsCtx = await buildNewsContext();
    newsBlock = formatContextForPrompt(newsCtx);
  } catch {}

  const personalityPrompt = `You are **${writer.name}**, ${writer.title} at ClearEdge Sports.

**Your backstory:** ${writer.bio}

**Your personality:** ${writer.mood}

**Your writing quirks — you MUST use these:**
${writer.quirks.map(q => `• ${q}`).join('\n')}

**Your catchphrase (work this in naturally):** "${writer.catchphrase}"

**Your specialty:** ${writer.specialty}
${writer.favoriteTeam ? `**Secret bias:** You have a soft spot for the ${writer.favoriteTeam}, but try to hide it.` : ''}

Stay in character as ${writer.name} throughout. This is YOUR column, YOUR voice. The reader should feel like they know you personally.
${newsBlock}`;

  const prompt = `${personalityPrompt}

Write your game review for this MLB game:

**${input.awayTeam} ${input.awayScore} @ ${input.homeTeam} ${input.homeScore}**
Venue: ${input.venue} | Weather: ${input.weather} | Wind: ${input.wind} | Attendance: ${input.attendance}
${blowout ? 'BLOWOUT ALERT' : ''}${shutout ? 'SHUTOUT' : ''}${extras ? 'EXTRA INNINGS' : ''}

**Line Score:**
${JSON.stringify(input.lineScore, null, 2)}

**Decisions:** ${JSON.stringify(input.decisions)}

**Key Performances:**
${input.playerHighlights}

REQUIREMENTS:
1. Write a clickbait-worthy headline in YOUR voice (sarcastic, funny, max 15 words)
2. Write a 3-5 paragraph review in markdown format — in character as ${writer.name}
3. Reference specific stats, innings, and player performances from the data above
4. Roast the losing team mercilessly but with love
5. Give backhanded compliments to the winning team
6. Make at least one reference to the weather, venue, or attendance
7. Include one ridiculous metaphor or analogy that fits YOUR personality
8. End with a "**Final Verdict:**" one-liner in YOUR signature style
9. Tone: match your personality (${writer.mood}) — readers should learn what happened while laughing
10. Use at least ONE of your writing quirks from the list above — make it unmistakably YOUR column
11. Work your catchphrase in somewhere natural

Return JSON: { "title": "...", "content": "..." }`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.95,
      max_tokens: 1500,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    const dateStr = input.gameId.split('_')[0] || '';
    const slug = `${dateStr}-${input.awayTeam.toLowerCase().replace(/[^a-z]/g, '')}-vs-${input.homeTeam.toLowerCase().replace(/[^a-z]/g, '')}`;

    return {
      title: result.title || `${winner} defeats ${loser}`,
      content: result.content || 'Review generation failed.',
      slug,
      author: writer.name,
      authorMood: writer.mood,
    };
  } catch (error) {
    console.error('Error generating sarcastic review:', error);
    return {
      title: `${winner} Beat ${loser} and We Have Thoughts`,
      content: `${writer.name} called in sick today, but ${winner} won. More details when our beat writer recovers from whatever is ailing them.`,
      slug: input.gameId.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase(),
      author: writer.name,
      authorMood: writer.mood,
    };
  }
}

/**
 * Generate an ad-hoc column from a specific writer on any topic or game.
 * Used by the "Editor's Desk" assignment feature.
 */
export async function generateWriterColumn(
  writer: BeatWriter,
  topic: string,
  context?: string,  // Optional box score data, stats, etc.
): Promise<{ title: string; content: string }> {
  // Auto-fetch real-time news context
  let newsBlock = '';
  try {
    const { buildNewsContext, formatContextForPrompt } = await import('./news-context');
    const newsCtx = await buildNewsContext();
    newsBlock = formatContextForPrompt(newsCtx);
  } catch {}

  const prompt = `You are **${writer.name}**, ${writer.title} at ClearEdge Sports.

**Your backstory:** ${writer.bio}
**Your personality:** ${writer.mood}
**Your writing quirks — you MUST use these:**
${writer.quirks.map(q => `• ${q}`).join('\n')}
**Your catchphrase (work this in naturally):** "${writer.catchphrase}"
**Your specialty:** ${writer.specialty}
${writer.favoriteTeam ? `**Secret bias:** You have a soft spot for the ${writer.favoriteTeam}.` : ''}
${newsBlock}

Your editor has assigned you the following topic:

**ASSIGNMENT:** ${topic}

${context ? `**Supporting data/context:**\n${context}` : ''}

Write a 3-5 paragraph column in YOUR voice. Be entertaining, opinionated, and stay 100% in character.
Include a headline and end with a "**Final Verdict:**" one-liner.

Return JSON: { "title": "...", "content": "..." }`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.95,
      max_tokens: 1500,
    });
    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error(`Error generating column for ${writer.name}:`, error);
    return {
      title: `${writer.name} Has Thoughts`,
      content: `${writer.name} stared at the blank page, muttered "${writer.catchphrase}", and went to get coffee. Column forthcoming.`,
    };
  }
}

// ── Daily Newsletter Generator ──────────────────────────────────

export interface NewsletterInput {
  date: string;                 // "2026-04-03"
  yesterdayScores: Array<{ away: string; home: string; awayScore: number; homeScore: number }>;
  todayGames: Array<{ away: string; home: string; gameTime: string; awayPitcher?: string; homePitcher?: string; moneyline?: { away: number; home: number }; total?: string }>;
  topPick?: { selection: string; reasoning: string; confidence: number };
}

export async function generateDailyNewsletter(input: NewsletterInput): Promise<{ subject: string; previewText: string; html: string; text: string; quickPicks: any[] }> {
  const yesterdayLines = input.yesterdayScores.map(g =>
    `${g.away} ${g.awayScore} @ ${g.home} ${g.homeScore}`
  ).join('\n');

  const todayLines = input.todayGames.map(g => {
    let line = `${g.away} @ ${g.home} (${g.gameTime})`;
    if (g.awayPitcher || g.homePitcher) line += ` — ${g.awayPitcher || 'TBD'} vs ${g.homePitcher || 'TBD'}`;
    if (g.moneyline) line += ` [ML: ${g.moneyline.away > 0 ? '+' : ''}${g.moneyline.away}/${g.moneyline.home > 0 ? '+' : ''}${g.moneyline.home}]`;
    if (g.total) line += ` [O/U: ${g.total}]`;
    return line;
  }).join('\n');

  const prompt = `Generate a daily sports newsletter for ClearEdge Sports. Date: ${input.date}

**Yesterday's Results:**
${yesterdayLines || 'No games yesterday'}

**Today's Schedule:**
${todayLines || 'No games today'}

${input.topPick ? `**Editor's Top Pick:** ${input.topPick.selection} (${input.topPick.confidence}% confidence) — ${input.topPick.reasoning}` : ''}

Create a newsletter with these sections:
1. **Subject line** — catchy, 50 chars max
2. **Preview text** — 100 chars for email preview
3. **Quick Picks** — 3 value plays from today's slate with brief reasoning (return as JSON array with selection, reasoning, confidence)
4. **Yesterday's Recap** — 2-3 sentences covering the highlights
5. **Today's Slate Preview** — Key matchups and pitching highlights
6. **Weather Watch** — Brief note about any weather-impacted games
7. **Parting Shot** — One sarcastic one-liner to close

Tone: Knowledgeable but fun. Like a smart friend texting you about baseball. Keep it scannable — short paragraphs, bold key names/numbers.

Return JSON: {
  "subject": "...",
  "previewText": "...",
  "quickPicks": [{ "selection": "...", "reasoning": "...", "confidence": 75 }],
  "recap": "...",
  "slatePreview": "...",
  "weatherWatch": "...",
  "partingShot": "..."
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.85,
      max_tokens: 2000,
    });

    const r = JSON.parse(response.choices[0].message.content || '{}');

    // Build email-friendly HTML
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #09090b; color: #d4d4d8; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
  .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #27272a; margin-bottom: 24px; }
  .header h1 { color: #22c55e; font-size: 24px; margin: 0 0 4px; }
  .header p { color: #71717a; font-size: 13px; margin: 0; }
  .section { margin-bottom: 24px; }
  .section h2 { color: #fafafa; font-size: 16px; margin: 0 0 8px; border-left: 3px solid #22c55e; padding-left: 10px; }
  .section p { color: #a1a1aa; font-size: 14px; line-height: 1.6; margin: 0 0 8px; }
  .pick-card { background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 12px; margin-bottom: 8px; }
  .pick-card .selection { color: #22c55e; font-weight: 700; font-size: 15px; }
  .pick-card .reasoning { color: #a1a1aa; font-size: 13px; margin-top: 4px; }
  .pick-card .confidence { display: inline-block; background: #27272a; color: #d4d4d8; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-top: 6px; }
  .scores { background: #18181b; border-radius: 8px; padding: 12px; }
  .scores .game { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #1e1e22; font-size: 13px; }
  .scores .game:last-child { border: none; }
  .scores .game .teams { color: #d4d4d8; }
  .scores .game .score { color: #22c55e; font-weight: 600; font-variant-numeric: tabular-nums; }
  .parting { background: #22c55e10; border: 1px solid #22c55e30; border-radius: 8px; padding: 16px; text-align: center; color: #22c55e; font-style: italic; font-size: 14px; }
  .footer { text-align: center; padding: 20px 0; border-top: 1px solid #27272a; margin-top: 24px; color: #52525b; font-size: 11px; }
  .footer a { color: #71717a; }
</style></head><body>
<div class="container">
  <div class="header">
    <h1>ClearEdge Sports</h1>
    <p>Daily Intelligence Brief — ${input.date}</p>
  </div>

  <div class="section">
    <h2>⚡ Quick Picks</h2>
    ${(r.quickPicks || []).map((p: any) => `
    <div class="pick-card">
      <div class="selection">${p.selection}</div>
      <div class="reasoning">${p.reasoning}</div>
      <span class="confidence">${p.confidence}% confidence</span>
    </div>`).join('')}
  </div>

  <div class="section">
    <h2>📊 Yesterday's Recap</h2>
    <p>${r.recap || 'No recap available.'}</p>
    ${input.yesterdayScores.length > 0 ? `<div class="scores">${input.yesterdayScores.map(g => `<div class="game"><span class="teams">${g.away} @ ${g.home}</span><span class="score">${g.awayScore} - ${g.homeScore}</span></div>`).join('')}</div>` : ''}
  </div>

  <div class="section">
    <h2>⚾ Today's Slate</h2>
    <p>${r.slatePreview || 'Check the app for today\'s games.'}</p>
  </div>

  <div class="section">
    <h2>🌦️ Weather Watch</h2>
    <p>${r.weatherWatch || 'All clear across the league.'}</p>
  </div>

  <div class="parting">${r.partingShot || 'Play ball.'}</div>

  <div class="footer">
    <p>ClearEdge Sports · AI-Powered Sports Intelligence</p>
    <p>For entertainment purposes only · <a href="{{unsubscribe_url}}">Unsubscribe</a></p>
  </div>
</div></body></html>`;

    // Plain text version
    const text = `CLEAREDGE SPORTS — Daily Brief (${input.date})

QUICK PICKS:
${(r.quickPicks || []).map((p: any) => `→ ${p.selection} (${p.confidence}%) — ${p.reasoning}`).join('\n')}

YESTERDAY'S RECAP:
${r.recap || 'No recap.'}

${input.yesterdayScores.map(g => `  ${g.away} ${g.awayScore} @ ${g.home} ${g.homeScore}`).join('\n')}

TODAY'S SLATE:
${r.slatePreview || 'Check the app.'}

WEATHER WATCH:
${r.weatherWatch || 'All clear.'}

${r.partingShot || 'Play ball.'}

---
ClearEdge Sports · Unsubscribe: {{unsubscribe_url}}`;

    return {
      subject: r.subject || `ClearEdge Daily — ${input.date}`,
      previewText: r.previewText || 'Your daily sports intelligence brief',
      html,
      text,
      quickPicks: r.quickPicks || [],
    };
  } catch (error) {
    console.error('Error generating newsletter:', error);
    return {
      subject: `ClearEdge Daily — ${input.date}`,
      previewText: 'Your daily sports intelligence brief',
      html: '<p>Newsletter generation failed. Try again.</p>',
      text: 'Newsletter generation failed.',
      quickPicks: [],
    };
  }
}
