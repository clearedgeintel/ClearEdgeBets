import cron from 'node-cron';
import { storage } from '../storage';
import { generateAITicket } from './openai';
import { settlePendingBets, settleVirtualBets, syncLiveGameData } from './bet-settlement';
import { fetchRealMLBOdds } from './realOdds';
import { logger } from '../lib/logger';

interface ScheduledTask {
  name: string;
  schedule: string;
  task: () => Promise<void>;
  isRunning: boolean;
}

class SchedulerService {
  private tasks: Map<string, cron.ScheduledTask> = new Map();
  private taskInfo: Map<string, ScheduledTask> = new Map();

  constructor() {
    this.initializeTasks();
  }

  private initializeTasks() {
    // Daily picks generation at 8 AM Central Time (before AI tickets)
    // Ensures fresh picks are available when users check the site
    // timezone: 'America/Chicago' is set in addTask, so hours are Central Time
    this.addTask('daily-picks-generation', '0 0 8 * * *', this.generateDailyPicks.bind(this));

    // Daily AI ticket submission at 9 AM Central Time
    this.addTask('daily-ai-ticket', '0 0 9 * * *', this.generateDailyAITicket.bind(this));

    // Weekly summary ticket every Monday at 9 AM Central
    this.addTask('weekly-summary', '0 0 9 * * 1', this.generateWeeklySummaryTicket.bind(this));
    
    // Automatic bet settlement every 15 minutes
    this.addTask('auto-bet-settlement', '0 */15 * * * *', this.runAutomaticBetSettlement.bind(this));

    // Odds history snapshot every 30 minutes (builds line movement data)
    this.addTask('odds-snapshot', '0 */30 * * * *', this.snapshotOdds.bind(this));

    // Auto Morning Roast — check for completed games and generate reviews every hour
    this.addTask('auto-morning-roast', '0 0 * * * *', this.autoGenerateMorningRoast.bind(this));

    console.log('✓ Scheduler service initialized with automated daily picks, AI tickets, and bet settlement');
    console.log('  - Daily picks: 8:00 AM Central Time');
    console.log('  - Daily tickets: 9:00 AM Central Time');
    console.log('  - Weekly summaries: Mondays at 9:00 AM Central Time');
    console.log('  - Automatic bet settlement: Every 15 minutes');
  }

  public addTask(name: string, schedule: string, taskFunction: () => Promise<void>) {
    try {
      // Validate cron expression
      if (!cron.validate(schedule)) {
        throw new Error(`Invalid cron schedule: ${schedule}`);
      }

      // Stop existing task if it exists
      if (this.tasks.has(name)) {
        this.stopTask(name);
      }

      // Create and start the task
      const task = cron.schedule(schedule, async () => {
        const taskInfo = this.taskInfo.get(name);
        if (taskInfo && taskInfo.isRunning) {
          console.log(`Task ${name} is already running, skipping...`);
          return;
        }

        if (taskInfo) {
          taskInfo.isRunning = true;
        }

        try {
          logger.info(`Starting scheduled task: ${name}`, { task: name });
          await taskFunction();
          logger.info(`Completed scheduled task: ${name}`, { task: name });
        } catch (error) {
          logger.error(`Error in scheduled task ${name}`, { task: name, error: String(error) });
        } finally {
          if (taskInfo) {
            taskInfo.isRunning = false;
          }
        }
      }, {
        scheduled: true,
        timezone: 'America/Chicago' // Central Time
      });

      this.tasks.set(name, task);
      this.taskInfo.set(name, {
        name,
        schedule,
        task: taskFunction,
        isRunning: false
      });

      console.log(`✓ Scheduled task '${name}' added with schedule: ${schedule}`);
    } catch (error) {
      console.error(`Failed to add scheduled task '${name}':`, error);
      throw error;
    }
  }

  public stopTask(name: string) {
    const task = this.tasks.get(name);
    if (task) {
      task.stop();
      this.tasks.delete(name);
      this.taskInfo.delete(name);
      console.log(`✓ Stopped scheduled task: ${name}`);
    }
  }

  public listTasks() {
    return Array.from(this.taskInfo.values()).map(info => ({
      name: info.name,
      schedule: info.schedule,
      isRunning: info.isRunning,
      nextRun: this.tasks.get(info.name)?.getStatus()
    }));
  }

  public getTaskStatus(name: string) {
    const taskInfo = this.taskInfo.get(name);
    const task = this.tasks.get(name);
    
    if (!taskInfo || !task) {
      return null;
    }

    return {
      name: taskInfo.name,
      schedule: taskInfo.schedule,
      isRunning: taskInfo.isRunning,
      isScheduled: task.getStatus(),
      nextExecution: this.getNextExecution(taskInfo.schedule)
    };
  }

  private getNextExecution(schedule: string): Date | null {
    try {
      // Parse cron expression and calculate next execution
      // This is a simplified implementation
      const now = new Date();
      const [second, minute, hour, day, month, dayOfWeek] = schedule.split(' ');
      
      // For daily tasks at 9 AM Central (14:00 UTC)
      if (hour === '14' && minute === '0' && second === '0') {
        const next = new Date();
        next.setUTCHours(14, 0, 0, 0);
        
        // If today's execution time has passed, schedule for tomorrow
        if (next <= now) {
          next.setUTCDate(next.getUTCDate() + 1);
        }
        
        return next;
      }
      
      return null;
    } catch (error) {
      console.error('Error calculating next execution:', error);
      return null;
    }
  }

  // Generate daily AI ticket with market insights
  private async generateDailyAITicket() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's games and market data
      const games = await storage.getGames(today);
      const recentPerformance = await storage.getRecentPerformanceData();
      
      // Analyze market conditions and generate insights
      const marketAnalysis = await this.analyzeMarketConditions(games);
      
      // Generate AI ticket based on current market state
      const ticketData = await generateAITicket({
        type: 'daily_market_insight',
        games: games.slice(0, 5), // Top 5 games for analysis
        marketConditions: marketAnalysis,
        performanceData: recentPerformance
      });

      // Create ticket in database
      await storage.createTicket({
        title: `Daily Market Analysis - ${new Date().toLocaleDateString()}`,
        description: ticketData.analysis,
        category: 'analysis_insight',
        priority: 'medium',
        source: 'ai_automated',
        metadata: {
          generatedAt: new Date().toISOString(),
          gameCount: games.length,
          marketConditions: marketAnalysis,
          recommendations: ticketData.recommendations
        }
      });

      console.log(`✓ Generated daily AI ticket for ${today}`);
    } catch (error) {
      console.error('Failed to generate daily AI ticket:', error);
    }
  }

  // Generate weekly summary ticket
  private async generateWeeklySummaryTicket() {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);

      // Get week's performance data
      const weeklyData = await storage.getPerformanceDataRange(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      // Generate comprehensive weekly analysis
      const weeklyAnalysis = await generateAITicket({
        type: 'weekly_summary',
        performanceData: weeklyData,
        dateRange: { start: startDate, end: endDate }
      });

      await storage.createTicket({
        title: `Weekly Performance Summary - Week of ${startDate.toLocaleDateString()}`,
        description: weeklyAnalysis.summary,
        category: 'analysis_insight',
        priority: 'high',
        source: 'ai_automated',
        metadata: {
          generatedAt: new Date().toISOString(),
          weekStart: startDate.toISOString(),
          weekEnd: endDate.toISOString(),
          performanceMetrics: weeklyAnalysis.metrics
        }
      });

      console.log(`✓ Generated weekly summary ticket for week of ${startDate.toLocaleDateString()}`);
    } catch (error) {
      console.error('Failed to generate weekly summary ticket:', error);
    }
  }

  private async analyzeMarketConditions(games: any[]) {
    const analysis = {
      totalGames: games.length,
      highConfidenceGames: games.filter(g => g.confidence && g.confidence > 75).length,
      averageConfidence: games.reduce((sum, g) => sum + (g.confidence || 0), 0) / games.length,
      marketTrends: {
        favoritesPerforming: Math.random() > 0.5, // Simplified - would use real data
        totalTrends: games.filter(g => g.total && g.total > 8.5).length,
        heavyAction: games.filter(g => g.publicPercentage && g.publicPercentage > 70).length
      }
    };

    return analysis;
  }

  // Automatic bet settlement task
  private async runAutomaticBetSettlement() {
    try {
      console.log('🎯 Running scheduled bet settlement...');
      
      // Sync live game data first to get latest scores
      const syncedGames = await syncLiveGameData();
      
      // Settle regular bets
      const regularBetsSettled = await settlePendingBets();
      
      // Settle virtual bets
      const virtualBetsSettled = await settleVirtualBets();
      
      const totalSettled = regularBetsSettled + virtualBetsSettled;
      
      if (totalSettled > 0) {
        console.log(`✅ Scheduled settlement complete: ${totalSettled} bets reconciled (${regularBetsSettled} regular, ${virtualBetsSettled} virtual)`);
      }
      
    } catch (error) {
      console.error('❌ Scheduled bet settlement failed:', error);
    }
  }

  public async snapshotOdds() {
    try {
      const odds = await fetchRealMLBOdds();
      if (odds.length === 0) return;

      const entries = odds.flatMap(game => {
        const rows = [];
        if (game.moneyline) {
          rows.push({ gameId: game.gameId, bookmaker: 'consensus', market: 'moneyline', awayOdds: game.moneyline.away, homeOdds: game.moneyline.home, line: null });
        }
        if (game.spread) {
          rows.push({ gameId: game.gameId, bookmaker: 'consensus', market: 'spread', awayOdds: (game.spread as any).awayOdds, homeOdds: (game.spread as any).homeOdds, line: String(game.spread.line) });
        }
        if (game.total) {
          rows.push({ gameId: game.gameId, bookmaker: 'consensus', market: 'total', awayOdds: game.total.over, homeOdds: game.total.under, line: String(game.total.line) });
        }
        return rows;
      });

      await storage.recordOddsSnapshot(entries);
      console.log(`📊 Odds snapshot recorded: ${entries.length} entries for ${odds.length} games`);
    } catch (error) {
      console.error('❌ Odds snapshot failed:', error);
    }
  }

  // Generate daily picks automatically
  private async generateDailyPicks() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if picks already exist for today
      const existingPicks = await storage.getDailyPicks(today);
      if (existingPicks && existingPicks.length > 0) {
        console.log(`✓ Daily picks already exist for ${today} (${existingPicks.length} picks)`);
        return;
      }
      
      // Check if games are available by making API call
      const gamesResponse = await fetch(`http://localhost:5000/api/games`);
      let games: any[] = [];
      
      if (gamesResponse.ok) {
        games = await gamesResponse.json();
      }
      
      if (!games || games.length === 0) {
        console.log(`⚠️ No games found for ${today}, skipping picks generation`);
        return;
      }
      
      // Generate picks using the existing endpoint logic
      const response = await fetch(`http://localhost:5000/api/daily-picks/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today })
      });
      
      if (response.ok) {
        const picks = await response.json();
        console.log(`✅ Generated ${picks.length} daily picks for ${today}`);
      } else {
        console.error(`❌ Failed to generate daily picks: ${response.status} ${response.statusText}`);
      }
      
    } catch (error) {
      console.error('❌ Failed to generate daily picks:', error);
    }
  }

  // Manual trigger for testing
  public async triggerDailyTicket() {
    console.log('Manually triggering daily AI ticket generation...');
    await this.generateDailyAITicket();
  }

  public async triggerWeeklyTicket() {
    console.log('Manually triggering weekly summary ticket generation...');
    await this.generateWeeklySummaryTicket();
  }

  public async triggerDailyPicks() {
    console.log('Manually triggering daily picks generation...');
    await this.generateDailyPicks();
  }

  /**
   * Auto Morning Roast — checks yesterday's completed games,
   * finds ones without reviews, assigns the beat writer, generates the recap.
   */
  public async autoGenerateMorningRoast() {
    try {
      const { fetchTank01Scores, getTeamFullName } = await import('./tank01-mlb');
      const { getBeatWriterForGame } = await import('@shared/beat-writers');
      const { generateSarcasticGameReview } = await import('./openai');
      const { trackedFetch } = await import('../lib/api-tracker');

      // Yesterday's date
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const yesterday = d.toISOString().split('T')[0];

      const scores = await fetchTank01Scores(yesterday);
      const completed = Object.entries(scores)
        .filter(([, g]) => g.gameStatusCode === '2' || g.gameStatus === 'Completed');

      if (completed.length === 0) {
        logger.info('Auto Morning Roast: no completed games found for ' + yesterday);
        return;
      }

      // Check which games already have reviews
      const existingReviews = await storage.getBlogReviewsByDate(yesterday);
      const reviewedGameIds = new Set(existingReviews.map(r => r.gameId));

      let generated = 0;
      for (const [gameID, game] of completed) {
        // Skip if already reviewed (check various ID formats)
        if (reviewedGameIds.has(gameID)) continue;

        try {
          // Fetch box score
          const boxResp = await trackedFetch(
            `https://tank01-mlb-live-in-game-real-time-statistics.p.rapidapi.com/getMLBBoxScore?gameID=${gameID}`,
            { headers: { 'x-rapidapi-host': 'tank01-mlb-live-in-game-real-time-statistics.p.rapidapi.com', 'x-rapidapi-key': process.env.TANK01_API_KEY || '' } }
          );
          if (!boxResp.ok) continue;
          const boxData = (await boxResp.json() as any).body;

          const awayCode = boxData.away || gameID.split('_')[1]?.split('@')[0] || '';
          const homeCode = boxData.home || gameID.split('@')[1] || '';
          const awayScore = parseInt(boxData.lineScore?.away?.R || '0');
          const homeScore = parseInt(boxData.lineScore?.home?.R || '0');

          // Get the assigned beat writer for this game
          const writer = getBeatWriterForGame(homeCode, awayCode);

          // Build player highlights from box score
          const playerStats = boxData.playerStats || {};
          const highlights: string[] = [];
          const { fetchTank01Player } = await import('./tank01-mlb');

          const hitters = Object.values(playerStats)
            .filter((p: any) => p.Hitting && parseInt(p.Hitting.H || '0') > 0)
            .sort((a: any, b: any) => {
              const aS = parseInt(a.Hitting.HR || '0') * 5 + parseInt(a.Hitting.H || '0') + parseInt(a.Hitting.RBI || '0') * 2;
              const bS = parseInt(b.Hitting.HR || '0') * 5 + parseInt(b.Hitting.H || '0') + parseInt(b.Hitting.RBI || '0') * 2;
              return bS - aS;
            })
            .slice(0, 4) as any[];

          for (const h of hitters) {
            const info = await fetchTank01Player(h.playerID, false);
            const name = info?.longName || `#${h.playerID}`;
            const hit = h.Hitting;
            highlights.push(`${name} (${h.team}): ${hit.H}-${hit.AB}${parseInt(hit.HR||'0') > 0 ? `, ${hit.HR} HR` : ''}${parseInt(hit.RBI||'0') > 0 ? `, ${hit.RBI} RBI` : ''}`);
          }

          const decisions = boxData.decisions || [];
          for (const dec of decisions) {
            const info = await fetchTank01Player(dec.playerID, false);
            const name = info?.longName || `#${dec.playerID}`;
            const pitcher = Object.values(playerStats).find((p: any) => p.playerID === dec.playerID) as any;
            if (pitcher?.Pitching) {
              const p = pitcher.Pitching;
              highlights.push(`${name} (${dec.team}, ${dec.decision}): ${p.InningsPitched} IP, ${p.ER} ER, ${p.SO} K`);
            }
          }

          // Generate review with the assigned beat writer
          const review = await generateSarcasticGameReview({
            gameId: gameID,
            awayTeam: getTeamFullName(awayCode),
            homeTeam: getTeamFullName(homeCode),
            awayScore,
            homeScore,
            venue: boxData.Venue || '',
            weather: boxData.Weather || '',
            attendance: boxData.Attendance || '',
            wind: boxData.Wind || '',
            lineScore: boxData.lineScore,
            decisions,
            playerHighlights: highlights.join('\n'),
          });

          // Override the randomly picked writer with the beat writer
          const awayLogo = `https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/${awayCode.toLowerCase()}.png`;
          const homeLogo = `https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/${homeCode.toLowerCase()}.png`;

          // Try to get ESPN hero image
          let heroImage: string | undefined;
          try {
            const espnDate = yesterday.replace(/-/g, '');
            const espnResp = await fetch(`https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${espnDate}`);
            if (espnResp.ok) {
              const espnData = await espnResp.json() as any;
              const match = espnData.events?.find((ev: any) => {
                const comp = ev.competitions?.[0];
                const a = comp?.competitors?.find((c: any) => c.homeAway === 'away');
                return a?.team?.abbreviation === awayCode;
              });
              heroImage = match?.competitions?.[0]?.headlines?.[0]?.video?.[0]?.thumbnail;
            }
          } catch {}

          await storage.createBlogReview({
            gameId: gameID,
            gameDate: yesterday,
            awayTeam: getTeamFullName(awayCode),
            homeTeam: getTeamFullName(homeCode),
            awayScore,
            homeScore,
            title: review.title,
            content: review.content,
            slug: `${yesterday.replace(/-/g, '')}-${awayCode.toLowerCase()}-vs-${homeCode.toLowerCase()}`,
            author: writer.name,  // Beat writer, not random
            authorMood: writer.mood,
            venue: boxData.Venue,
            weather: boxData.Weather,
            attendance: boxData.Attendance,
            heroImage,
            awayLogo,
            homeLogo,
            espnRecap: undefined,
            boxScoreData: boxData,
          });

          generated++;
          logger.info(`Auto Morning Roast: ${writer.name} covered ${awayCode}@${homeCode} (${awayScore}-${homeScore})`);
        } catch (err) {
          logger.error(`Auto Morning Roast: failed to generate review for ${gameID}: ${err}`);
        }
      }

      logger.info(`Auto Morning Roast: generated ${generated} reviews for ${yesterday}`);
    } catch (error) {
      logger.error('Auto Morning Roast scheduler error: ' + error);
    }
  }
}

// Create singleton instance
export const schedulerService = new SchedulerService();