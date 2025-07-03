import cron from 'node-cron';
import { storage } from '../storage';
import { generateAITicket } from './openai';
import { settlePendingBets, settleVirtualBets, syncLiveGameData } from './bet-settlement';

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
    // Daily AI ticket submission at 9 AM Central Time
    // Cron expression: 0 9 * * * (second, minute, hour, day, month, day-of-week)
    // Central Time = UTC-6 (standard) or UTC-5 (daylight)
    // Using 14:00 UTC which is 9:00 AM Central during daylight saving time
    this.addTask('daily-ai-ticket', '0 0 14 * * *', this.generateDailyAITicket.bind(this));
    
    // Optional: Weekly summary ticket every Monday at 9 AM Central
    this.addTask('weekly-summary', '0 0 14 * * 1', this.generateWeeklySummaryTicket.bind(this));
    
    // Automatic bet settlement every 15 minutes
    this.addTask('auto-bet-settlement', '0 */15 * * * *', this.runAutomaticBetSettlement.bind(this));
    
    console.log('✓ Scheduler service initialized with automated AI ticket generation and bet settlement');
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
          console.log(`[${new Date().toISOString()}] Starting scheduled task: ${name}`);
          await taskFunction();
          console.log(`[${new Date().toISOString()}] Completed scheduled task: ${name}`);
        } catch (error) {
          console.error(`[${new Date().toISOString()}] Error in scheduled task ${name}:`, error);
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

  // Manual trigger for testing
  public async triggerDailyTicket() {
    console.log('Manually triggering daily AI ticket generation...');
    await this.generateDailyAITicket();
  }

  public async triggerWeeklyTicket() {
    console.log('Manually triggering weekly summary ticket generation...');
    await this.generateWeeklySummaryTicket();
  }
}

// Create singleton instance
export const schedulerService = new SchedulerService();