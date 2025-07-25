import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Target, TrendingUp, AlertCircle, Brain, BarChart3, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BettingRecommendation {
  betType: 'moneyline' | 'spread' | 'total';
  selection: string;
  odds: number;
  confidence: number;
  reasoning: string;
  expectedValue: string;
  stakeRecommendation: number;
}

interface EnhancedPicksResult {
  topPicks: BettingRecommendation[];
  overallConfidence: number;
  analysisMetadata: {
    oddsAnalyzed: string[];
    keyFactors: string[];
    riskAssessment: string;
  };
}

interface EnhancedPicksResponse {
  gameId: string;
  awayTeam: string;
  homeTeam: string;
  venue: string;
  gameTime: string;
  enhancedPicks: EnhancedPicksResult;
  baseAnalysis: {
    summary: string;
    confidence: number;
  };
}

export default function EnhancedPicks() {
  const { toast } = useToast();
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  // Fetch available games
  const { data: games, isLoading: gamesLoading } = useQuery({
    queryKey: ["/api/games"],
  });

  // Fetch enhanced picks for selected game
  const { data: enhancedPicks, isLoading: picksLoading, error } = useQuery<EnhancedPicksResponse>({
    queryKey: ["/api/games", selectedGameId, "enhanced-picks"],
    enabled: !!selectedGameId,
  });

  const handleGameSelect = (gameId: string) => {
    setSelectedGameId(gameId);
  };

  const formatOdds = (odds: number): string => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return "bg-green-500";
    if (confidence >= 65) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getConfidenceBadgeColor = (confidence: number): string => {
    if (confidence >= 80) return "bg-green-100 text-green-800";
    if (confidence >= 65) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getRiskColor = (risk: string): string => {
    switch (risk) {
      case 'low': return "bg-green-100 text-green-800";
      case 'medium': return "bg-yellow-100 text-yellow-800";
      case 'high': return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (gamesLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading games...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Brain className="h-8 w-8 text-blue-600" />
          Enhanced AI Betting Picks
        </h1>
        <p className="text-gray-600">
          AI-powered betting recommendations combining game analysis with real-time odds data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Game Selection Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Select Game
              </CardTitle>
              <CardDescription>
                Choose a game to get enhanced AI picks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(games as any)?.map((game: any) => (
                <div key={game.gameId}>
                  <Button
                    variant={selectedGameId === game.gameId ? "default" : "outline"}
                    className="w-full justify-start text-left"
                    onClick={() => handleGameSelect(game.gameId)}
                  >
                    <div className="flex flex-col items-start">
                      <div className="font-medium">
                        {game.awayTeam} @ {game.homeTeam}
                      </div>
                      <div className="text-xs text-gray-500">
                        {game.venue} • {game.gameTime}
                      </div>
                    </div>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Picks Display */}
        <div className="lg:col-span-2">
          {!selectedGameId ? (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Game</h3>
                <p className="text-gray-600">
                  Choose a game from the list to view enhanced AI betting recommendations
                </p>
              </CardContent>
            </Card>
          ) : picksLoading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Generating enhanced picks...</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Analysis Unavailable</h3>
                <p className="text-gray-600">
                  Enhanced picks are not available for this game. Please try another game or check back later.
                </p>
              </CardContent>
            </Card>
          ) : enhancedPicks ? (
            <div className="space-y-6">
              {/* Game Header */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{enhancedPicks?.awayTeam} @ {enhancedPicks?.homeTeam}</span>
                    <Badge className={getConfidenceBadgeColor(enhancedPicks?.enhancedPicks?.overallConfidence || 0)}>
                      {enhancedPicks?.enhancedPicks?.overallConfidence}% Confidence
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {enhancedPicks?.venue} • {enhancedPicks?.gameTime}
                  </CardDescription>
                </CardHeader>
              </Card>

              <Tabs defaultValue="picks" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="picks">Top Picks</TabsTrigger>
                  <TabsTrigger value="analysis">Base Analysis</TabsTrigger>
                  <TabsTrigger value="metadata">Analysis Metadata</TabsTrigger>
                </TabsList>

                <TabsContent value="picks" className="space-y-4">
                  {enhancedPicks?.enhancedPicks?.topPicks?.map((pick: any, index: number) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded">
                              #{index + 1}
                            </span>
                            {pick.bet}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">
                              {pick.odds}
                            </Badge>
                            <Badge className={getConfidenceBadgeColor(pick.confidence || 0)}>
                              {pick.confidence || 0}%
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            {pick.expectedValue} EV
                          </span>
                          {pick.stakeRecommendation && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {pick.stakeRecommendation}% stake
                            </span>
                          )}
                          {pick.betType && (
                            <span className="capitalize bg-gray-100 px-2 py-1 rounded">
                              {pick.betType}
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 leading-relaxed">{pick.reasoning}</p>
                        <div className="mt-3 flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getConfidenceColor(pick.confidence || 0)}`}
                              style={{ width: `${pick.confidence || 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{pick.confidence || 0}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="analysis">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Base AI Analysis
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getConfidenceBadgeColor(enhancedPicks?.baseAnalysis?.confidence || 0)}>
                          {enhancedPicks?.baseAnalysis?.confidence}% Confidence
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {enhancedPicks?.baseAnalysis?.summary}
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="metadata">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Analysis Metadata
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Odds Markets Analyzed</h4>
                        <div className="flex flex-wrap gap-2">
                          {enhancedPicks?.enhancedPicks?.analysisMetadata?.oddsAnalyzed?.map((market: string, index: number) => (
                            <Badge key={index} variant="outline" className="capitalize">
                              {market}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-medium mb-2">Key Factors</h4>
                        <div className="flex flex-wrap gap-2">
                          {enhancedPicks?.enhancedPicks?.analysisMetadata?.keyFactors?.map((factor: string, index: number) => (
                            <Badge key={index} variant="secondary">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-medium mb-2">Risk Assessment</h4>
                        <Badge className={getRiskColor(enhancedPicks?.enhancedPicks?.analysisMetadata?.riskAssessment || '')}>
                          {enhancedPicks?.enhancedPicks?.analysisMetadata?.riskAssessment?.toUpperCase()} RISK
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}