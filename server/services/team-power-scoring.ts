import { BaseballReferenceStats, BaseballReferencePitchingStats } from '@shared/schema';
import { normalizeTeamCode, getTeamName } from '@shared/team-lookup';

export interface TeamPowerScore {
  team: string;
  advBattingScore: number;
  pitchingScore: number;
  teamPowerScore: number;
  lastUpdated: string;
}

export class TeamPowerScoringService {
  
  /**
   * Calculate advanced batting score based on weighted offensive metrics
   * Factors: OPS (40%), Runs/Game (25%), HR (15%), BA (10%), Walks (10%)
   */
  calculateAdvancedBattingScore(battingStats: BaseballReferenceStats): number {
    if (!battingStats || battingStats.games === 0) return 0;
    
    const ops = parseFloat(battingStats.ops?.toString() || '0');
    const runsPerGame = parseFloat(battingStats.runsPerGame?.toString() || '0');
    const homeRuns = battingStats.homeRuns || 0;
    const battingAverage = parseFloat(battingStats.battingAverage?.toString() || '0');
    const walks = battingStats.walks || 0;
    const games = battingStats.games || 1;
    
    // Normalize metrics to 0-100 scale
    const opsScore = Math.min(ops * 100, 100); // OPS typically 0.6-1.0
    const runsScore = Math.min(runsPerGame * 15, 100); // ~6-7 runs/game is excellent
    const hrScore = Math.min((homeRuns / games) * 500, 100); // ~1.5 HR/game is excellent
    const baScore = Math.min(battingAverage * 400, 100); // .300+ is excellent
    const walkScore = Math.min((walks / games) * 25, 100); // ~4 walks/game is good
    
    // Weighted scoring
    const advBattingScore = Math.round(
      (opsScore * 0.40) +
      (runsScore * 0.25) +
      (hrScore * 0.15) +
      (baScore * 0.10) +
      (walkScore * 0.10)
    );
    
    return Math.min(advBattingScore, 100);
  }
  
  /**
   * Calculate pitching score based on weighted defensive metrics
   * Factors: ERA (35%), WHIP (25%), K/9 (20%), Saves (10%), Complete Games (10%)
   */
  calculatePitchingScore(pitchingStats: BaseballReferencePitchingStats): number {
    if (!pitchingStats || pitchingStats.games === 0) return 0;
    
    const era = parseFloat(pitchingStats.era?.toString() || '9.00');
    const whip = parseFloat(pitchingStats.whip?.toString() || '2.00');
    const so9 = parseFloat(pitchingStats.so9?.toString() || '0');
    const saves = pitchingStats.saves || 0;
    const completeGames = pitchingStats.completeGames || 0;
    const games = pitchingStats.games || 1;
    
    // Inverse scoring for ERA and WHIP (lower is better)
    const eraScore = Math.min(Math.max((6.0 - era) * 25, 0), 100); // 2.00 ERA = 100pts
    const whipScore = Math.min(Math.max((2.0 - whip) * 80, 0), 100); // 0.80 WHIP = 100pts
    const strikeoutScore = Math.min(so9 * 10, 100); // 10 K/9 = 100pts
    const saveScore = Math.min((saves / games) * 200, 100); // 0.5 saves/game = 100pts
    const cgScore = Math.min((completeGames / games) * 1000, 100); // 0.1 CG/game = 100pts
    
    // Weighted scoring
    const pitchingScore = Math.round(
      (eraScore * 0.35) +
      (whipScore * 0.25) +
      (strikeoutScore * 0.20) +
      (saveScore * 0.10) +
      (cgScore * 0.10)
    );
    
    return Math.min(pitchingScore, 100);
  }
  
  /**
   * Calculate team power score combining batting and pitching
   */
  calculateTeamPowerScore(
    battingStats: BaseballReferenceStats,
    pitchingStats: BaseballReferencePitchingStats
  ): TeamPowerScore {
    const advBattingScore = this.calculateAdvancedBattingScore(battingStats);
    const pitchingScore = this.calculatePitchingScore(pitchingStats);
    const teamPowerScore = advBattingScore + pitchingScore;
    
    return {
      team: battingStats.team || pitchingStats.team,
      advBattingScore,
      pitchingScore,
      teamPowerScore,
      lastUpdated: new Date().toISOString()
    };
  }
  
  /**
   * Calculate power scores for all teams with available data
   */
  calculateAllTeamPowerScores(
    battingStats: BaseballReferenceStats[],
    pitchingStats: BaseballReferencePitchingStats[]
  ): TeamPowerScore[] {
    const teamScores: TeamPowerScore[] = [];
    
    // Create a map of pitching stats by team for quick lookup
    const pitchingMap = new Map<string, BaseballReferencePitchingStats>();
    pitchingStats.forEach(stats => {
      pitchingMap.set(stats.team, stats);
    });
    
    // Calculate scores for each team with batting data
    battingStats.forEach(batting => {
      const pitching = pitchingMap.get(batting.team);
      if (pitching) {
        const teamScore = this.calculateTeamPowerScore(batting, pitching);
        teamScores.push(teamScore);
      }
    });
    
    // Sort by team power score (highest first)
    return teamScores.sort((a, b) => b.teamPowerScore - a.teamPowerScore);
  }
  
  /**
   * Get team power score rankings with percentile rankings
   */
  getTeamPowerRankings(teamScores: TeamPowerScore[]): (TeamPowerScore & {
    rank: number;
    percentile: number;
    battingRank: number;
    pitchingRank: number;
  })[] {
    const totalTeams = teamScores.length;
    
    // Sort by different metrics for rankings
    const battingRanked = [...teamScores].sort((a, b) => b.advBattingScore - a.advBattingScore);
    const pitchingRanked = [...teamScores].sort((a, b) => b.pitchingScore - a.pitchingScore);
    
    return teamScores.map((team, index) => {
      const battingRank = battingRanked.findIndex(t => t.team === team.team) + 1;
      const pitchingRank = pitchingRanked.findIndex(t => t.team === team.team) + 1;
      const percentile = Math.round(((totalTeams - index) / totalTeams) * 100);
      
      return {
        ...team,
        rank: index + 1,
        percentile,
        battingRank,
        pitchingRank
      };
    });
  }

  /**
   * Get team power data for specific team codes (useful for linking with odds data)
   */
  getTeamPowerData(teamScores: (TeamPowerScore & {
    rank: number;
    percentile: number;
    battingRank: number;
    pitchingRank: number;
  })[], teamCodes: string[]): Record<string, any> {
    const powerData: Record<string, any> = {};
    
    teamCodes.forEach(code => {
      const normalizedCode = normalizeTeamCode(code);
      const teamData = teamScores.find(team => 
        normalizeTeamCode(team.team) === normalizedCode
      );
      
      if (teamData) {
        powerData[normalizedCode] = {
          ...teamData,
          fullName: getTeamName(normalizedCode)
        };
      }
    });
    
    return powerData;
  }

  /**
   * Find team power score by team code (handles various code formats)
   */
  findTeamPowerScore(teamScores: (TeamPowerScore & {
    rank: number;
    percentile: number;
    battingRank: number;
    pitchingRank: number;
  })[], teamCode: string): (TeamPowerScore & {
    rank: number;
    percentile: number;
    battingRank: number;
    pitchingRank: number;
    fullName: string;
  }) | null {
    const normalizedCode = normalizeTeamCode(teamCode);
    const teamData = teamScores.find(team => 
      normalizeTeamCode(team.team) === normalizedCode
    );
    
    if (teamData) {
      return {
        ...teamData,
        fullName: getTeamName(normalizedCode)
      };
    }
    
    return null;
  }

  /**
   * Calculate team advantage between two teams based on power scores
   */
  calculateTeamAdvantage(
    teamScores: (TeamPowerScore & {
      rank: number;
      percentile: number;
      battingRank: number;
      pitchingRank: number;
    })[],
    homeTeam: string,
    awayTeam: string
  ): {
    homeTeamData: any;
    awayTeamData: any;
    powerDifference: number;
    favoredTeam: 'home' | 'away' | 'even';
    confidenceLevel: 'low' | 'medium' | 'high';
    matchupAnalysis: string;
  } | null {
    const homeData = this.findTeamPowerScore(teamScores, homeTeam);
    const awayData = this.findTeamPowerScore(teamScores, awayTeam);
    
    if (!homeData || !awayData) {
      return null;
    }
    
    const powerDifference = homeData.teamPowerScore - awayData.teamPowerScore;
    const absPowerDiff = Math.abs(powerDifference);
    
    let favoredTeam: 'home' | 'away' | 'even';
    let confidenceLevel: 'low' | 'medium' | 'high';
    let matchupAnalysis: string;
    
    if (absPowerDiff <= 3) {
      favoredTeam = 'even';
      confidenceLevel = 'low';
      matchupAnalysis = `Evenly matched teams with ${homeData.fullName} (${homeData.teamPowerScore} power, rank #${homeData.rank}) vs ${awayData.fullName} (${awayData.teamPowerScore} power, rank #${awayData.rank})`;
    } else if (absPowerDiff <= 8) {
      favoredTeam = powerDifference > 0 ? 'home' : 'away';
      confidenceLevel = 'medium';
      const favored = powerDifference > 0 ? homeData : awayData;
      matchupAnalysis = `${favored.fullName} holds a ${absPowerDiff}-point team power advantage (rank #${favored.rank} vs #${powerDifference > 0 ? awayData.rank : homeData.rank})`;
    } else {
      favoredTeam = powerDifference > 0 ? 'home' : 'away';
      confidenceLevel = 'high';
      const favored = powerDifference > 0 ? homeData : awayData;
      const underdog = powerDifference > 0 ? awayData : homeData;
      matchupAnalysis = `${favored.fullName} significantly favored with ${absPowerDiff}-point power advantage primarily driven by ${favored.battingRank < favored.pitchingRank ? 'superior offensive capabilities' : 'superior pitching staff'} (rank #${favored.rank} vs #${underdog.rank})`;
    }
    
    return {
      homeTeamData: homeData,
      awayTeamData: awayData,
      powerDifference,
      favoredTeam,
      confidenceLevel,
      matchupAnalysis
    };
  }
}

export const teamPowerScoringService = new TeamPowerScoringService();