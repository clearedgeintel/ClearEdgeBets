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

    // Expert panel picks at 8:30 AM Central Time (after daily picks, before AI ticket)
    this.addTask('expert-picks-generation', '0 30 8 * * *', this.generateExpertPicks.bind(this));

    // Daily AI ticket submission at 9 AM Central Time
    this.addTask('daily-ai-ticket', '0 0 9 * * *', this.generateDailyAITicket.bind(this));

    // Weekly summary ticket every Monday at 9 AM Central
    this.addTask('weekly-summary', '0 0 9 * * 1', this.generateWeeklySummaryTicket.bind(this));

    // Daily newsletter — generate + send at 9:15 AM Central
    this.addTask('daily-newsletter', '0 15 9 * * *', this.generateAndSendNewsletter.bind(this));
    
    // Automatic bet settlement every 15 minutes
    this.addTask('auto-bet-settlement', '0 */15 * * * *', this.runAutomaticBetSettlement.bind(this));

    // Odds history snapshot every 30 minutes (builds line movement data)
    this.addTask('odds-snapshot', '0 */30 * * * *', this.snapshotOdds.bind(this));

    // Auto Morning Roast — check for completed games every 15 minutes
    // Generates recap within 15 min of game ending
    this.addTask('auto-morning-roast', '0 */15 * * * *', this.autoGenerateMorningRoast.bind(this));

    // Auto-grade expert picks every 30 minutes
    this.addTask('expert-pick-grading', '0 */30 * * * *', this.gradeExpertPicks.bind(this));

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
      // Sync live game data first to get latest scores
      await syncLiveGameData();

      // Use the new unified settlement engine
      const { runSettlement } = await import('./settlement-engine');
      const report = await runSettlement({ betType: 'both' });

      if (report.betsSettled + report.virtualBetsSettled > 0) {
        logger.info(`Settlement: ${report.gamesProcessed} games, ${report.betsSettled} real, ${report.virtualBetsSettled} virtual${report.errors.length > 0 ? `, ${report.errors.length} errors` : ''}`);
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
   * Auto-generate and send the daily newsletter.
   */
  private async generateAndSendNewsletter() {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Check if already sent today
      const existing = await storage.getNewsletters(5);
      if (existing.some(n => n.edition === today && n.status === 'sent')) {
        logger.info('Newsletter: already sent for ' + today);
        return;
      }

      // Generate the newsletter
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const { fetchTank01Games, fetchTank01Odds, getConsensusOdds, parseMultiBookOdds, getTeamFullName } = await import('./tank01-mlb');
      const { fetchTank01Scores } = await import('./tank01-mlb');

      const [todayGames, yesterdayScores, todayOdds] = await Promise.all([
        fetchTank01Games(today),
        fetchTank01Scores(yesterday),
        fetchTank01Odds(today),
      ]);

      const yScores = Object.values(yesterdayScores)
        .filter((g: any) => g.gameStatusCode === '2')
        .map((g: any) => ({
          away: getTeamFullName(g.away),
          home: getTeamFullName(g.home),
          awayScore: parseInt(g.lineScore?.away?.R || '0'),
          homeScore: parseInt(g.lineScore?.home?.R || '0'),
        }));

      const tGames = todayGames.map(g => {
        const odds = todayOdds[g.gameID];
        const books = odds ? parseMultiBookOdds(odds) : [];
        const consensus = books.length > 0 ? getConsensusOdds(books) : { moneyline: null, total: null };
        return {
          away: getTeamFullName(g.away),
          home: getTeamFullName(g.home),
          gameTime: g.gameTime,
          moneyline: consensus.moneyline || undefined,
          total: consensus.total?.line || undefined,
        };
      });

      const { generateDailyNewsletter } = await import('./openai');
      const result = await generateDailyNewsletter({ date: today, yesterdayScores: yScores, todayGames: tGames });

      const slug = `newsletter-${today}`;
      const nl = await storage.createNewsletter({
        subject: result.subject,
        previewText: result.previewText,
        htmlContent: result.html,
        textContent: result.text,
        slug,
        edition: today,
        quickPicks: result.quickPicks,
        yesterdayRecap: yScores,
        status: 'draft',
        sentAt: null,
        recipientCount: 0,
        openCount: 0,
        clickCount: 0,
      });

      // Send to all active subscribers
      const subs = await storage.getActiveSubscribers();
      if (subs.length > 0) {
        const { sendNewsletter, isEmailConfigured } = await import('./email');
        if (isEmailConfigured()) {
          const sendResult = await sendNewsletter(
            nl.subject,
            nl.htmlContent,
            nl.textContent || '',
            subs.map(s => ({ email: s.email, unsubscribeToken: s.unsubscribeToken })),
          );
          await storage.updateNewsletter(nl.id, { status: 'sent', sentAt: new Date(), recipientCount: sendResult.sent });
          logger.info(`Newsletter: generated + sent to ${sendResult.sent} subscribers`);
        } else {
          await storage.updateNewsletter(nl.id, { status: 'sent', sentAt: new Date(), recipientCount: 0 });
          logger.info('Newsletter: generated but email not configured (RESEND_API_KEY missing)');
        }
      } else {
        await storage.updateNewsletter(nl.id, { status: 'sent', sentAt: new Date(), recipientCount: 0 });
        logger.info('Newsletter: generated, no active subscribers');
      }
    } catch (error) {
      logger.error('Newsletter auto-send error: ' + error);
    }
  }

  /**
   * Auto-generate expert panel picks for today's games.
   */
  private async generateExpertPicks() {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Check if already generated today
      const existing = await storage.getExpertPicksByDate(today);
      if (existing.length > 0) {
        logger.info(`Expert picks: already have ${existing.length} picks for ${today}, skipping`);
        return;
      }

      let totalPicks = 0;

      // Generate MLB expert picks
      totalPicks += await this.generateMLBExpertPicks(today);

      // Generate NHL expert picks
      totalPicks += await this.generateNHLExpertPicks(today);

      logger.info(`Expert picks: generated ${totalPicks} total picks from 5 experts for ${today}`);
    } catch (error) {
      logger.error('Expert picks generation error: ' + error);
    }
  }

  /** Generate expert picks for MLB games */
  private async generateMLBExpertPicks(today: string): Promise<number> {
    const { getAllExperts } = await import('@shared/expert-panel');
    const { generateExpertPicks: genPicks } = await import('./openai');
    const { fetchTank01Games, fetchTank01Odds, fetchTank01Player, fetchTank01Teams, fetchTank01RosterWithStats, parseMultiBookOdds, getConsensusOdds, getTeamFullName } = await import('./tank01-mlb');
    const { getParkFactor } = await import('../lib/park-factors');

    const [games, oddsMap, allTeams] = await Promise.all([
      fetchTank01Games(today),
      fetchTank01Odds(today),
      fetchTank01Teams(),
    ]);
    const teamLookup: Record<string, { wins: string; loss: string; diff: string }> = {};
    allTeams.forEach(t => { teamLookup[t.teamAbv] = { wins: t.wins, loss: t.loss, diff: t.DIFF }; });

    if (games.length === 0) {
      logger.info('Expert picks (MLB): no games today');
      return 0;
    }

    // Fetch all rosters with stats in parallel
    const teamAbvs: string[] = [];
    games.forEach(g => {
      if (!teamAbvs.includes(g.away)) teamAbvs.push(g.away);
      if (!teamAbvs.includes(g.home)) teamAbvs.push(g.home);
    });
    const rosterMap: Record<string, any[]> = {};
    await Promise.all(teamAbvs.map(async abv => {
      try { rosterMap[abv] = await fetchTank01RosterWithStats(abv); } catch { rosterMap[abv] = []; }
    }));

    const getTopHitters = (roster: any[], count = 3) => {
      return roster
        .filter((p: any) => p.stats?.Hitting && parseInt(p.stats.Hitting.AB || '0') >= 30)
        .map((p: any) => {
          const s = p.stats.Hitting;
          const ab = parseInt(s.AB || '0'), h = parseInt(s.H || '0'), bb = parseInt(s.BB || '0'), tb = parseInt(s.TB || '0');
          const avg = ab > 0 ? (h / ab).toFixed(3) : '.000';
          const obp = (ab + bb) > 0 ? ((h + bb) / (ab + bb)) : 0;
          const slg = ab > 0 ? tb / ab : 0;
          const ops = (obp + slg).toFixed(3);
          return { name: p.longName, avg: avg.startsWith('0') ? avg.slice(1) : avg, hr: parseInt(s.HR || '0'), ops: ops.startsWith('0') ? ops.slice(1) : ops, pos: p.pos };
        })
        .sort((a: any, b: any) => parseFloat(b.ops) - parseFloat(a.ops))
        .slice(0, count);
    };

    const getInjuries = (roster: any[]) => {
      return roster
        .filter((p: any) => p.injury?.designation)
        .map((p: any) => `${p.longName} (${p.injury.designation}, ${p.injury.description || 'undisclosed'})`)
        .slice(0, 5);
    };

    const buildPitcherProfile = (player: any) => {
      if (!player) return undefined;
      const s = player.stats?.Pitching;
      if (!s) return { name: player.longName };
      const ip = parseFloat(s.InningsPitched || '0');
      const so = parseInt(s.SO || '0');
      const gs = parseInt(s.GamesStarted || s.GS || '0');
      return { name: player.longName, record: `${s.Win || 0}-${s.Loss || 0}`, era: s.ERA || undefined, whip: s.WHIP || undefined, k9: ip > 0 ? ((so / ip) * 9).toFixed(1) : undefined, ip: s.InningsPitched || undefined, gamesStarted: gs || undefined };
    };

    const gameData = await Promise.all(games.map(async g => {
      const odds = oddsMap[g.gameID];
      const books = odds ? parseMultiBookOdds(odds) : [];
      const consensus = books.length > 0 ? getConsensusOdds(books) : { moneyline: null, total: null, spread: null };
      const pf = getParkFactor(g.home);

      const [awayPitcherData, homePitcherData] = await Promise.all([
        g.probableStartingPitchers?.away ? fetchTank01Player(g.probableStartingPitchers.away, true) : null,
        g.probableStartingPitchers?.home ? fetchTank01Player(g.probableStartingPitchers.home, true) : null,
      ]);

      const awayRoster = rosterMap[g.away] || [];
      const homeRoster = rosterMap[g.home] || [];

      return {
        gameId: `${g.away}@${g.home}`,
        away: getTeamFullName(g.away),
        home: getTeamFullName(g.home),
        gameTime: g.gameTime,
        awayPitcher: awayPitcherData?.longName,
        homePitcher: homePitcherData?.longName,
        awayPitcherProfile: buildPitcherProfile(awayPitcherData),
        homePitcherProfile: buildPitcherProfile(homePitcherData),
        awayTopHitters: getTopHitters(awayRoster),
        homeTopHitters: getTopHitters(homeRoster),
        awayInjuries: getInjuries(awayRoster),
        homeInjuries: getInjuries(homeRoster),
        awayRecord: teamLookup[g.away] ? `${teamLookup[g.away].wins}-${teamLookup[g.away].loss}` : undefined,
        homeRecord: teamLookup[g.home] ? `${teamLookup[g.home].wins}-${teamLookup[g.home].loss}` : undefined,
        awayRunDiff: teamLookup[g.away]?.diff ? parseInt(teamLookup[g.away].diff) : undefined,
        homeRunDiff: teamLookup[g.home]?.diff ? parseInt(teamLookup[g.home].diff) : undefined,
        moneyline: consensus.moneyline || undefined,
        total: consensus.total ? { line: consensus.total.line, overOdds: consensus.total.over, underOdds: consensus.total.under } : undefined,
        runline: consensus.spread ? { away: consensus.spread.away, home: consensus.spread.home, awayOdds: consensus.spread.awayOdds, homeOdds: consensus.spread.homeOdds } : undefined,
        parkFactor: pf?.factor,
      };
    }));

    let picks = 0;
    for (const expert of getAllExperts()) {
      const expertPicks = await genPicks({ expert, games: gameData, sport: 'mlb' });
      for (const pick of expertPicks) {
        await storage.createExpertPick({
          expertId: expert.id,
          gameId: pick.gameId,
          gameDate: today,
          pickType: pick.pickType,
          selection: pick.selection,
          odds: pick.odds,
          confidence: pick.confidence,
          rationale: pick.rationale,
          units: String(pick.units || 1),
          result: 'pending',
          gradedAt: null,
          sport: 'mlb',
        });
        picks++;
      }
    }

    if (picks > 0) logger.info(`Expert picks (MLB): ${picks} picks generated`);
    return picks;
  }

  /** Generate expert picks for NHL games */
  private async generateNHLExpertPicks(today: string): Promise<number> {
    const { getAllExperts } = await import('@shared/expert-panel');
    const { generateExpertPicks: genPicks } = await import('./openai');
    const { fetchNHLGames, fetchNHLOdds } = await import('../sports/nhl/api-client');
    const { getNHLTeamName } = await import('../sports/nhl/teams');

    const [games, oddsMap] = await Promise.all([
      fetchNHLGames(today),
      fetchNHLOdds(today),
    ]);

    if (games.length === 0) {
      logger.info('Expert picks (NHL): no games today');
      return 0;
    }

    const gameData = games.map((g: any) => {
      const odds = oddsMap[g.gameID];
      const dk = odds?.draftkings;
      return {
        gameId: `${g.away}@${g.home}`,
        away: getNHLTeamName(g.away),
        home: getNHLTeamName(g.home),
        gameTime: g.gameTime || '',
        moneyline: dk ? { away: parseInt(dk.awayTeamML || '0'), home: parseInt(dk.homeTeamML || '0') } : undefined,
        total: dk?.totalOver ? { line: dk.totalOver } : undefined,
        puckLine: dk?.awayTeamPuckLine ? { away: dk.awayTeamPuckLine, home: dk.homeTeamPuckLine } : undefined,
      };
    });

    let picks = 0;
    for (const expert of getAllExperts()) {
      const expertPicks = await genPicks({ expert, games: gameData, sport: 'nhl' });
      for (const pick of expertPicks) {
        await storage.createExpertPick({
          expertId: expert.id,
          gameId: pick.gameId,
          gameDate: today,
          pickType: pick.pickType === 'puckline' ? 'puckline' : pick.pickType,
          selection: pick.selection,
          odds: pick.odds,
          confidence: pick.confidence,
          rationale: pick.rationale,
          units: String(pick.units || 1),
          result: 'pending',
          gradedAt: null,
          sport: 'nhl',
        });
        picks++;
      }
    }

    if (picks > 0) logger.info(`Expert picks (NHL): ${picks} picks generated`);
    return picks;
  }

  /**
   * Auto-grade expert picks by checking completed games (MLB + NHL).
   */
  public async gradeExpertPicks() {
    try {
      const pending = await storage.getPendingExpertPicks();
      if (pending.length === 0) return;

      let graded = 0;

      // Grade MLB picks
      const mlbPicks = pending.filter(p => (p as any).sport !== 'nhl');
      if (mlbPicks.length > 0) graded += await this.gradeMLBExpertPicks(mlbPicks);

      // Grade NHL picks
      const nhlPicks = pending.filter(p => (p as any).sport === 'nhl');
      if (nhlPicks.length > 0) graded += await this.gradeNHLExpertPicks(nhlPicks);

      if (graded > 0) logger.info(`Expert pick grading: graded ${graded} picks`);
    } catch (error) {
      logger.error('Expert pick grading error: ' + error);
    }
  }

  /** Generate a concise post-game note explaining why a pick won or lost */
  private async generatePostGameNote(pick: any, result: string, scoreContext: string): Promise<string> {
    try {
      const { getExpert } = await import('@shared/expert-panel');
      const expert = getExpert(pick.expertId);
      const expertName = expert?.name || pick.expertId;

      const openai = (await import('openai')).default;
      const client = new openai({ apiKey: process.env.OPENAI_API_KEY });

      const resp = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `An expert sports analyst "${expertName}" made this pick:
Pick: ${pick.selection} (${pick.pickType}) at ${pick.odds > 0 ? '+' : ''}${pick.odds}
Rationale: ${pick.rationale}
Result: ${result.toUpperCase()}
Final score: ${scoreContext}

Write ONE sentence (max 20 words) explaining why this pick ${result === 'win' ? 'hit' : result === 'loss' ? 'missed' : 'pushed'}. Be specific — reference the score or what happened. No fluff.`
        }],
        max_tokens: 60,
        temperature: 0.7,
      });

      return resp.choices[0].message.content?.trim() || '';
    } catch (err) {
      logger.warn('Failed to generate post-game note: ' + err);
      return '';
    }
  }

  /** Grade MLB expert picks against final scores */
  private async gradeMLBExpertPicks(picks: any[]): Promise<number> {
    const { fetchTank01Scores } = await import('./tank01-mlb');
    const dates = [...new Set(picks.map(p => p.gameDate))];
    let graded = 0;

    for (const date of dates) {
      const scores = await fetchTank01Scores(date);
      const datePicks = picks.filter(p => p.gameDate === date);

      for (const pick of datePicks) {
        const gameKey = Object.keys(scores).find(k => {
          const parts = k.split('_');
          const teams = parts[1] || '';
          return teams === pick.gameId || teams.replace('@', ' @ ') === pick.gameId;
        });

        if (!gameKey) continue;
        const game = scores[gameKey];
        if (game.gameStatusCode !== '2' && game.gameStatus !== 'Completed') continue;

        const awayScore = parseInt(game.lineScore?.away?.R || '0');
        const homeScore = parseInt(game.lineScore?.home?.R || '0');
        const totalRuns = awayScore + homeScore;
        const awayCode = game.away;
        const homeCode = game.home;

        let result: string | null = null;
        const sel = pick.selection.toLowerCase();
        const pickType = pick.pickType.toLowerCase();

        if (pickType === 'moneyline') {
          if (sel.includes(awayCode.toLowerCase()) || sel.includes('away')) {
            result = awayScore > homeScore ? 'win' : 'loss';
          } else if (sel.includes(homeCode.toLowerCase()) || sel.includes('home')) {
            result = homeScore > awayScore ? 'win' : 'loss';
          }
        } else if (pickType === 'total') {
          const lineMatch = sel.match(/(over|under)\s*([\d.]+)/i);
          if (lineMatch) {
            const direction = lineMatch[1].toLowerCase();
            const line = parseFloat(lineMatch[2]);
            if (direction === 'over') result = totalRuns > line ? 'win' : totalRuns === line ? 'push' : 'loss';
            else result = totalRuns < line ? 'win' : totalRuns === line ? 'push' : 'loss';
          }
        } else if (pickType === 'runline') {
          const rlMatch = sel.match(/([A-Z]{2,3})\s*([+-][\d.]+)/i);
          if (rlMatch) {
            const team = rlMatch[1].toUpperCase();
            const spread = parseFloat(rlMatch[2]);
            const teamScore = team === awayCode ? awayScore : homeScore;
            const oppScore = team === awayCode ? homeScore : awayScore;
            const adjusted = teamScore + spread;
            result = adjusted > oppScore ? 'win' : adjusted === oppScore ? 'push' : 'loss';
          }
        }

        if (result) {
          const scoreCtx = `${awayCode} ${awayScore} - ${homeCode} ${homeScore} (Total: ${totalRuns})`;
          const note = await this.generatePostGameNote(pick, result, scoreCtx);
          await storage.gradeExpertPick(pick.id, result, note || undefined);
          graded++;
        }
      }
    }

    return graded;
  }

  /** Grade NHL expert picks against final scores */
  private async gradeNHLExpertPicks(picks: any[]): Promise<number> {
    const { fetchNHLScoreboard } = await import('../sports/nhl/api-client');
    const dates = [...new Set(picks.map(p => p.gameDate))];
    let graded = 0;

    for (const date of dates) {
      const scores = await fetchNHLScoreboard(date);
      const datePicks = picks.filter(p => p.gameDate === date);

      for (const pick of datePicks) {
        // Match game: pick.gameId is "BOS@TOR", scores have awayTeamCode/homeTeamCode
        const game = scores.find(g => {
          const pickTeams = pick.gameId.split('@');
          return g.awayTeamCode === pickTeams[0] && g.homeTeamCode === pickTeams[1];
        });

        if (!game || game.status !== 'final') continue;

        const awayScore = game.awayScore || 0;
        const homeScore = game.homeScore || 0;
        const totalGoals = awayScore + homeScore;
        const awayCode = game.awayTeamCode || '';
        const homeCode = game.homeTeamCode || '';

        let result: string | null = null;
        const sel = pick.selection.toLowerCase();
        const pickType = pick.pickType.toLowerCase();

        if (pickType === 'moneyline') {
          if (sel.includes(awayCode.toLowerCase()) || sel.includes('away')) {
            result = awayScore > homeScore ? 'win' : 'loss';
          } else if (sel.includes(homeCode.toLowerCase()) || sel.includes('home')) {
            result = homeScore > awayScore ? 'win' : 'loss';
          }
        } else if (pickType === 'total') {
          const lineMatch = sel.match(/(over|under)\s*([\d.]+)/i);
          if (lineMatch) {
            const direction = lineMatch[1].toLowerCase();
            const line = parseFloat(lineMatch[2]);
            if (direction === 'over') result = totalGoals > line ? 'win' : totalGoals === line ? 'push' : 'loss';
            else result = totalGoals < line ? 'win' : totalGoals === line ? 'push' : 'loss';
          }
        } else if (pickType === 'puckline') {
          const plMatch = sel.match(/([A-Z]{2,3})\s*([+-][\d.]+)/i);
          if (plMatch) {
            const team = plMatch[1].toUpperCase();
            const spread = parseFloat(plMatch[2]);
            const teamScore = team === awayCode ? awayScore : homeScore;
            const oppScore = team === awayCode ? homeScore : awayScore;
            const adjusted = teamScore + spread;
            result = adjusted > oppScore ? 'win' : adjusted === oppScore ? 'push' : 'loss';
          }
        }

        if (result) {
          const scoreCtx = `${awayCode} ${awayScore} - ${homeCode} ${homeScore} (Total: ${totalGoals})`;
          const note = await this.generatePostGameNote(pick, result, scoreCtx);
          await storage.gradeExpertPick(pick.id, result, note || undefined);
          graded++;
        }
      }
    }

    return graded;
  }

  /**
   * Auto Morning Roast — checks yesterday's completed games (MLB + NHL),
   * finds ones without reviews, assigns the beat writer, generates the recap.
   */
  public async autoGenerateMorningRoast() {
    try {
      let totalGenerated = 0;

      // Generate MLB recaps
      totalGenerated += await this.generateMLBMorningRoast();

      // Generate NHL recaps
      totalGenerated += await this.generateNHLMorningRoast();

      if (totalGenerated > 0) logger.info(`Auto Morning Roast: ${totalGenerated} total new recaps published`);
    } catch (error) {
      logger.error('Auto Morning Roast scheduler error: ' + error);
    }
  }

  /** Generate Morning Roast recaps for completed MLB games */
  private async generateMLBMorningRoast(): Promise<number> {
    const { fetchTank01Scores, getTeamFullName, fetchTank01Player } = await import('./tank01-mlb');
    const { getBeatWriterForGame } = await import('@shared/beat-writers');
    const { generateSarcasticGameReview } = await import('./openai');
    const { trackedFetch } = await import('../lib/api-tracker');

    const today = new Date().toISOString().split('T')[0];
    const d = new Date(); d.setDate(d.getDate() - 1);
    const yesterday = d.toISOString().split('T')[0];

    const [todayReviews, yesterdayReviews] = await Promise.all([
      storage.getBlogReviewsByDate(today),
      storage.getBlogReviewsByDate(yesterday),
    ]);
    const reviewedGameIds = new Set([...todayReviews, ...yesterdayReviews].map(r => r.gameId));

    const [todayScores, yesterdayScores] = await Promise.all([
      fetchTank01Scores(today),
      fetchTank01Scores(yesterday),
    ]);

    const allCompleted: Array<[string, any, string]> = [];
    Object.entries(todayScores)
      .filter(([, g]) => g.gameStatusCode === '2' || g.gameStatus === 'Completed')
      .forEach(([id, g]) => allCompleted.push([id, g, today]));
    Object.entries(yesterdayScores)
      .filter(([, g]) => g.gameStatusCode === '2' || g.gameStatus === 'Completed')
      .forEach(([id, g]) => allCompleted.push([id, g, yesterday]));

    const toGenerate = allCompleted.filter(([id]) => !reviewedGameIds.has(id));
    if (toGenerate.length === 0) return 0;

    logger.info(`Auto Morning Roast (MLB): ${toGenerate.length} completed games need reviews`);

    let generated = 0;
    for (const [gameID, , gameDate] of toGenerate) {
      try {
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
        const writer = getBeatWriterForGame(homeCode, awayCode);

        const playerStats = boxData.playerStats || {};
        const highlights: string[] = [];

        const hitters = Object.values(playerStats)
          .filter((p: any) => p.Hitting && parseInt(p.Hitting.H || '0') > 0)
          .sort((a: any, b: any) => {
            const aS = parseInt(a.Hitting.HR || '0') * 5 + parseInt(a.Hitting.H || '0') + parseInt(a.Hitting.RBI || '0') * 2;
            const bS = parseInt(b.Hitting.HR || '0') * 5 + parseInt(b.Hitting.H || '0') + parseInt(b.Hitting.RBI || '0') * 2;
            return bS - aS;
          }).slice(0, 4) as any[];

        for (const h of hitters) {
          const info = await fetchTank01Player(h.playerID, false);
          const name = info?.longName || `#${h.playerID}`;
          const hit = h.Hitting;
          highlights.push(`${name} (${h.team}): ${hit.H}-${hit.AB}${parseInt(hit.HR||'0') > 0 ? `, ${hit.HR} HR` : ''}${parseInt(hit.RBI||'0') > 0 ? `, ${hit.RBI} RBI` : ''}`);
        }

        for (const dec of (boxData.decisions || [])) {
          const info = await fetchTank01Player(dec.playerID, false);
          const name = info?.longName || `#${dec.playerID}`;
          const pitcher = Object.values(playerStats).find((p: any) => p.playerID === dec.playerID) as any;
          if (pitcher?.Pitching) highlights.push(`${name} (${dec.team}, ${dec.decision}): ${pitcher.Pitching.InningsPitched} IP, ${pitcher.Pitching.ER} ER, ${pitcher.Pitching.SO} K`);
        }

        const review = await generateSarcasticGameReview({
          gameId: gameID, awayTeam: getTeamFullName(awayCode), homeTeam: getTeamFullName(homeCode),
          awayScore, homeScore, venue: boxData.Venue || '', weather: boxData.Weather || '',
          attendance: boxData.Attendance || '', wind: boxData.Wind || '',
          lineScore: boxData.lineScore, decisions: boxData.decisions || [],
          playerHighlights: highlights.join('\n'), sport: 'mlb',
        });

        let heroImage: string | undefined;
        try {
          const espnResp = await fetch(`https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${gameDate.replace(/-/g, '')}`);
          if (espnResp.ok) {
            const espnData = await espnResp.json() as any;
            const match = espnData.events?.find((ev: any) => ev.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away' && c.team?.abbreviation === awayCode));
            heroImage = match?.competitions?.[0]?.headlines?.[0]?.video?.[0]?.thumbnail;
          }
        } catch {}

        const slug = `${gameDate.replace(/-/g, '')}-${awayCode.toLowerCase()}-vs-${homeCode.toLowerCase()}-${Date.now()}`;

        await storage.createBlogReview({
          gameId: gameID, gameDate,
          awayTeam: getTeamFullName(awayCode), homeTeam: getTeamFullName(homeCode),
          awayScore, homeScore,
          title: review.title, content: review.content, slug,
          author: writer.name, authorMood: writer.mood,
          venue: boxData.Venue, weather: boxData.Weather, attendance: boxData.Attendance,
          heroImage, awayLogo: `https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/${awayCode.toLowerCase()}.png`,
          homeLogo: `https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/${homeCode.toLowerCase()}.png`,
          espnRecap: undefined, boxScoreData: boxData, sport: 'mlb',
        });

        generated++;
        logger.info(`Auto Morning Roast (MLB): ${writer.name} filed recap for ${awayCode}@${homeCode} (${awayScore}-${homeScore})`);
      } catch (err) {
        logger.error(`Auto Morning Roast (MLB): failed for ${gameID}: ${err}`);
      }
    }

    return generated;
  }

  /** Generate Morning Roast recaps for completed NHL games */
  private async generateNHLMorningRoast(): Promise<number> {
    const { fetchNHLScoreboard, fetchNHLBoxScore } = await import('../sports/nhl/api-client');
    const { getNHLTeamName, getNHLTeamLogo } = await import('../sports/nhl/teams');
    const { getRandomBeatWriter } = await import('@shared/beat-writers');
    const { generateSarcasticGameReview } = await import('./openai');

    const today = new Date().toISOString().split('T')[0];
    const d = new Date(); d.setDate(d.getDate() - 1);
    const yesterday = d.toISOString().split('T')[0];

    const [todayReviews, yesterdayReviews] = await Promise.all([
      storage.getBlogReviewsByDate(today),
      storage.getBlogReviewsByDate(yesterday),
    ]);
    const reviewedGameIds = new Set([...todayReviews, ...yesterdayReviews].map(r => r.gameId));

    const [todayScores, yesterdayScores] = await Promise.all([
      fetchNHLScoreboard(today),
      fetchNHLScoreboard(yesterday),
    ]);

    const allCompleted = [...todayScores, ...yesterdayScores]
      .filter(g => g.status === 'final' && !reviewedGameIds.has(g.gameId));

    if (allCompleted.length === 0) return 0;

    logger.info(`Auto Morning Roast (NHL): ${allCompleted.length} completed games need reviews`);

    let generated = 0;
    for (const game of allCompleted) {
      try {
        // Fetch box score for player stats
        const boxData = await fetchNHLBoxScore(game.gameId);
        const awayCode = game.awayTeamCode || '';
        const homeCode = game.homeTeamCode || '';
        const gameDate = game.gameId.split('_')[0] || today;

        // Build NHL player highlights from box score
        const highlights: string[] = [];
        if (boxData) {
          const playerStats = boxData.playerStats || boxData.body?.playerStats || {};
          const skaters = Object.values(playerStats) as any[];

          // Top goal scorers
          const scorers = skaters
            .filter((p: any) => parseInt(p.goals || p.Goals || '0') > 0)
            .sort((a: any, b: any) => {
              const aS = parseInt(b.goals || b.Goals || '0') * 3 + parseInt(b.assists || b.Assists || '0');
              const bS = parseInt(a.goals || a.Goals || '0') * 3 + parseInt(a.assists || a.Assists || '0');
              return aS - bS;
            }).slice(0, 5);

          for (const p of scorers) {
            const name = p.longName || p.playerName || `#${p.playerID || ''}`;
            const goals = p.goals || p.Goals || '0';
            const assists = p.assists || p.Assists || '0';
            const plusMinus = p.plusMinus || p.PlusMinus || '';
            highlights.push(`${name} (${p.team || ''}): ${goals}G, ${assists}A${plusMinus ? `, ${plusMinus}` : ''}`);
          }

          // Goalies
          const goalies = skaters
            .filter((p: any) => parseInt(p.saves || p.Saves || '0') > 0)
            .sort((a: any, b: any) => parseInt(b.saves || b.Saves || '0') - parseInt(a.saves || a.Saves || '0'));

          for (const g of goalies.slice(0, 2)) {
            const name = g.longName || g.playerName || `#${g.playerID || ''}`;
            const saves = g.saves || g.Saves || '0';
            const ga = g.goalsAgainst || g.GoalsAgainst || '';
            highlights.push(`${name} (${g.team || ''}, G): ${saves} saves${ga ? `, ${ga} GA` : ''}`);
          }
        }

        const writer = getRandomBeatWriter();

        const review = await generateSarcasticGameReview({
          gameId: game.gameId,
          awayTeam: game.awayTeam,
          homeTeam: game.homeTeam,
          awayScore: game.awayScore || 0,
          homeScore: game.homeScore || 0,
          venue: boxData?.Venue || boxData?.body?.Venue || '',
          weather: '',
          attendance: boxData?.Attendance || boxData?.body?.Attendance || '',
          wind: '',
          lineScore: game.metadata?.lineScore || {},
          decisions: [],
          playerHighlights: highlights.length > 0 ? highlights.join('\n') : 'No detailed stats available',
          sport: 'nhl',
        });

        // ESPN NHL hero image
        let heroImage: string | undefined;
        try {
          const espnResp = await fetch(`https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard?dates=${gameDate.replace(/-/g, '')}`);
          if (espnResp.ok) {
            const espnData = await espnResp.json() as any;
            const match = espnData.events?.find((ev: any) =>
              ev.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away' && c.team?.abbreviation === awayCode)
            );
            heroImage = match?.competitions?.[0]?.headlines?.[0]?.video?.[0]?.thumbnail;
          }
        } catch {}

        const slug = `nhl-${gameDate.replace(/-/g, '')}-${awayCode.toLowerCase()}-vs-${homeCode.toLowerCase()}-${Date.now()}`;

        await storage.createBlogReview({
          gameId: game.gameId, gameDate,
          awayTeam: game.awayTeam, homeTeam: game.homeTeam,
          awayScore: game.awayScore || 0, homeScore: game.homeScore || 0,
          title: review.title, content: review.content, slug,
          author: writer.name, authorMood: writer.mood,
          venue: boxData?.Venue || boxData?.body?.Venue || '',
          weather: '', attendance: boxData?.Attendance || boxData?.body?.Attendance || '',
          heroImage,
          awayLogo: getNHLTeamLogo(awayCode),
          homeLogo: getNHLTeamLogo(homeCode),
          espnRecap: undefined, boxScoreData: boxData, sport: 'nhl',
        });

        generated++;
        logger.info(`Auto Morning Roast (NHL): ${writer.name} filed recap for ${awayCode}@${homeCode} (${game.awayScore}-${game.homeScore})`);
      } catch (err) {
        logger.error(`Auto Morning Roast (NHL): failed for ${game.gameId}: ${err}`);
      }
    }

    return generated;
  }
}

// Create singleton instance
export const schedulerService = new SchedulerService();