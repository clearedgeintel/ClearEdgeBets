import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, AlertCircle, Brain, BarChart3, DollarSign, Clock } from "lucide-react";

interface BettingPick {
  bet: string;
  odds: string;
  confidence: number;
  reasoning: string;
  expectedValue: string;
}

interface EnhancedPicksResult {
  topPicks: BettingPick[];
  overallConfidence: number;
  analysisMetadata: {
    oddsAnalyzed: string[];
    keyFactors: string[];
    riskAssessment: string;
  };
}

interface GameWithPicks {
  gameId: string;
  awayTeam: string;
  homeTeam: string;
  venue: string;
  gameTime: string;
  awayPitcher: string;
  homePitcher: string;
  enhancedPicks: EnhancedPicksResult;
  baseAnalysis: {
    summary: string;
    confidence: number;
  };
}

export default function EnhancedPicks() {
  // Fetch all games with enhanced picks
  const { data: allEnhancedPicks, isLoading } = useQuery<GameWithPicks[]>({
    queryKey: ["/api/enhanced-picks/all"],
  });

  const formatOdds = (odds: string): string => {
    const numOdds = parseInt(odds);
    return numOdds > 0 ? `+${numOdds}` : `${numOdds}`;
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return "bg-blue-500";
    if (confidence >= 65) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getConfidenceBadgeColor = (confidence: number): string => {
    if (confidence >= 80) return "bg-blue-100 text-blue-800";
    if (confidence >= 65) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  // Sort all picks by confidence level
  const sortedPicks = allEnhancedPicks?.flatMap(game => 
    game.enhancedPicks.topPicks.map(pick => ({
      ...pick,
      gameInfo: {
        gameId: game.gameId,
        awayTeam: game.awayTeam,
        homeTeam: game.homeTeam,
        venue: game.venue,
        gameTime: game.gameTime,
        awayPitcher: game.awayPitcher,
        homePitcher: game.homePitcher
      }
    }))
  ).sort((a, b) => b.confidence - a.confidence) || [];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Brain className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Enhanced Picks</h1>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            AI-Powered Analysis
          </Badge>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-300">Loading AI-powered enhanced picks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Brain className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Enhanced Picks</h1>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            AI-Powered Analysis
          </Badge>
        </div>
        <div className="text-sm text-gray-300">
          {sortedPicks.length} picks from {allEnhancedPicks?.length || 0} games
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <div className="ml-2">
                <p className="text-2xl font-bold">{sortedPicks.filter(p => p.confidence >= 80).length}</p>
                <p className="text-xs text-muted-foreground">High Confidence (80%+)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Target className="h-4 w-4 text-yellow-600" />
              <div className="ml-2">
                <p className="text-2xl font-bold">{sortedPicks.filter(p => p.confidence >= 65 && p.confidence < 80).length}</p>
                <p className="text-xs text-muted-foreground">Medium Confidence (65-79%)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <div className="ml-2">
                <p className="text-2xl font-bold">{sortedPicks.filter(p => p.confidence < 65).length}</p>
                <p className="text-xs text-muted-foreground">Lower Confidence (&lt;65%)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div className="ml-2">
                <p className="text-2xl font-bold">
                  {Math.round(sortedPicks.reduce((sum, pick) => sum + pick.confidence, 0) / sortedPicks.length) || 0}%
                </p>
                <p className="text-xs text-muted-foreground">Average Confidence</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Enhanced Picks Sorted by Confidence */}
      <div className="space-y-4">
        {sortedPicks.map((pick, index) => (
          <Card key={`${pick.gameInfo.gameId}-${index}`} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold">
                      {pick.gameInfo.awayTeam} @ {pick.gameInfo.homeTeam}
                    </h3>
                    <Badge className={getConfidenceBadgeColor(pick.confidence)}>
                      {pick.confidence}% Confidence
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-300 mb-3">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(pick.gameInfo.gameTime).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                    <span>•</span>
                    <span>{pick.gameInfo.venue}</span>
                    <span>•</span>
                    <span>{pick.gameInfo.awayPitcher} vs {pick.gameInfo.homePitcher}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {formatOdds(pick.odds)}
                  </div>
                  <Badge variant="outline" className="text-green-700 border-green-200">
                    {pick.expectedValue} EV
                  </Badge>
                </div>
              </div>

              <div className="border-l-4 border-blue-200 pl-4 mb-4">
                <div className="font-medium text-blue-300 mb-2">
                  {pick.bet}
                </div>
                <p className="text-sm text-gray-200 leading-relaxed">
                  {pick.reasoning}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center space-x-4">
                  <span>Game ID: {pick.gameInfo.gameId}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${getConfidenceColor(pick.confidence)}`}></div>
                  <span>
                    {pick.confidence >= 80 ? 'High' : pick.confidence >= 65 ? 'Medium' : 'Lower'} Confidence
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sortedPicks.length === 0 && (
        <Card className="h-64 flex items-center justify-center">
          <div className="text-center">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Enhanced Picks Available
            </h3>
            <p className="text-gray-300">
              AI-powered enhanced picks will appear here when games have analysis available
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}