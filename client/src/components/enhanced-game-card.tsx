import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Brain, User, Target, TrendingUp, DollarSign } from "lucide-react";
import { useBettingSlip } from "@/contexts/betting-slip-context";
import { LiveScore } from "@/components/live-score";

interface Game {
  id: number;
  gameId: string;
  awayTeam: string;
  homeTeam: string;
  awayTeamCode: string;
  homeTeamCode: string;
  gameTime: string;
  venue: string;
  awayPitcher?: string;
  homePitcher?: string;
  awayPitcherStats?: string;
  homePitcherStats?: string;
  status: string;
  awayScore?: number;
  homeScore?: number;
  odds: Array<{
    id: number;
    gameId: string;
    bookmaker: string;
    market: string;
    awayOdds?: number;
    homeOdds?: number;
    overOdds?: number;
    underOdds?: number;
    total?: string;
    awaySpread?: string;
    homeSpread?: string;
    awaySpreadOdds?: number;
    homeSpreadOdds?: number;
  }>;
  aiSummary?: {
    id: number;
    gameId: string;
    summary: string;
    confidence: number;
    valuePlays: Array<{
      type: string;
      selection: string;
      reasoning: string;
      expectedValue: number;
    }>;
  };
}

interface AIPickData {
  id: number;
  team: string;
  selection: string;
  pickType: string;
  confidence: number;
  reasoning: string;
  odds: string;
}

interface ExpertPickData {
  id: string;
  selection: string;
  pickType: string;
  confidence: number;
  reasoning: string;
  odds: string;
  value: number;
}

interface EnhancedGameCardProps {
  game: Game;
}

export default function EnhancedGameCard({ game }: EnhancedGameCardProps) {
  const [expanded, setExpanded] = useState(true); // Default to expanded
  const { addBet } = useBettingSlip();

  // Fetch all daily picks, AI suggested bets, and game evaluations
  const { data: allAIPicks = [] } = useQuery<any[]>({
    queryKey: ['/api/daily-picks']
  });

  const { data: aiSuggestedBets = [] } = useQuery<any[]>({
    queryKey: ['/api/ai-suggested-bets']
  });

  const { data: gameEvaluations = [] } = useQuery<any[]>({
    queryKey: ['/api/game-evaluations']
  });

  // No expert picks API - removed to maintain authentic data only

  // Get AI pick that matches this specific game 
  const aiPick = allAIPicks.find(pick => {
    if (!pick.gameId) return false;
    
    // Exact gameId match - picks now use same format as games: "2025-07-21_BAL @ CLE"
    return pick.gameId === game.gameId;
  }) || null;

  // Get evaluation data for this game
  const gameEvaluation = gameEvaluations.find(evaluation => evaluation.gameId === game.gameId);
  
  // No expert picks available - removed to maintain authentic data integrity

  const getOddsByMarket = (market: string) => {
    return game.odds.find(o => o.market === market);
  };

  const moneylineOdds = getOddsByMarket("moneyline");
  const totalOdds = getOddsByMarket("totals");
  const spreadOdds = getOddsByMarket("spreads");

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const getPickIcon = (pickType: string) => {
    switch (pickType.toLowerCase()) {
      case 'moneyline':
        return <Target className="h-4 w-4" />;
      case 'spread':
      case 'runline':
        return <TrendingUp className="h-4 w-4" />;
      case 'total':
      case 'over':
      case 'under':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return { variant: "default" as const, label: "High", color: "bg-green-100 text-green-800" };
    if (confidence >= 65) return { variant: "secondary" as const, label: "Med", color: "bg-yellow-100 text-yellow-800" };
    return { variant: "outline" as const, label: "Low", color: "bg-gray-100 text-gray-800" };
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <CardTitle className="text-lg">
                {game.awayTeam} @ {game.homeTeam}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {game.gameTime} • {game.venue}
              </p>
            </div>
            {game.status === "final" && (
              <LiveScore 
                awayTeam={game.awayTeam}
                homeTeam={game.homeTeam}
                awayScore={game.awayScore || 0}
                homeScore={game.homeScore || 0}
                inning="Final"
                status="final"
              />
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* Starting Pitchers */}
        {(game.awayPitcher || game.homePitcher) && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              <strong>{game.awayPitcher}</strong>
              {game.awayPitcherStats && <span className="ml-1">({game.awayPitcherStats})</span>}
            </div>
            <div className="text-right">
              <strong>{game.homePitcher}</strong>
              {game.homePitcherStats && <span className="ml-1">({game.homePitcherStats})</span>}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Quick Odds Display */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {moneylineOdds && (
            <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700 font-medium mb-2">Moneyline</p>
              <div className="space-y-1">
                <Badge 
                  className="bg-blue-100 text-blue-800 text-xs cursor-pointer hover:bg-blue-200 transition-colors"
                  onClick={() => addBet({
                    gameId: game.gameId,
                    betType: 'moneyline',
                    selection: game.awayTeamCode,
                    odds: moneylineOdds.awayOdds || 0,
                    stake: 10,
                    potentialWin: 0
                  })}
                >
                  {game.awayTeamCode} {formatOdds(moneylineOdds.awayOdds || 0)}
                </Badge>
                <Badge 
                  className="bg-blue-100 text-blue-800 text-xs cursor-pointer hover:bg-blue-200 transition-colors"
                  onClick={() => addBet({
                    gameId: game.gameId,
                    betType: 'moneyline',
                    selection: game.homeTeamCode,
                    odds: moneylineOdds.homeOdds || 0,
                    stake: 10,
                    potentialWin: 0
                  })}
                >
                  {game.homeTeamCode} {formatOdds(moneylineOdds.homeOdds || 0)}
                </Badge>
              </div>
            </div>
          )}
          
          {spreadOdds && (
            <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-700 font-medium mb-2">Run Line</p>
              <div className="space-y-1">
                <Badge 
                  className="bg-green-100 text-green-800 text-xs cursor-pointer hover:bg-green-200 transition-colors"
                  onClick={() => addBet({
                    gameId: game.gameId,
                    betType: 'spread',
                    selection: `${game.awayTeamCode} ${spreadOdds.awaySpread}`,
                    odds: spreadOdds.awayOdds || -110,
                    stake: 10,
                    potentialWin: 0
                  })}
                >
                  {game.awayTeamCode} {spreadOdds.awaySpread}
                </Badge>
                <Badge 
                  className="bg-green-100 text-green-800 text-xs cursor-pointer hover:bg-green-200 transition-colors"
                  onClick={() => addBet({
                    gameId: game.gameId,
                    betType: 'spread',
                    selection: `${game.homeTeamCode} ${spreadOdds.homeSpread}`,
                    odds: spreadOdds.homeOdds || -110,
                    stake: 10,
                    potentialWin: 0
                  })}
                >
                  {game.homeTeamCode} {spreadOdds.homeSpread}
                </Badge>
              </div>
            </div>
          )}

          {totalOdds && (
            <div className="text-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-xs text-orange-700 font-medium mb-2">Total</p>
              <div className="space-y-1">
                <Badge 
                  className="bg-orange-100 text-orange-800 text-xs cursor-pointer hover:bg-orange-200 transition-colors"
                  onClick={() => addBet({
                    gameId: game.gameId,
                    betType: 'total',
                    selection: `Over ${totalOdds.total}`,
                    odds: totalOdds.overOdds || -110,
                    stake: 10,
                    potentialWin: 0
                  })}
                >
                  Over {totalOdds.total}
                </Badge>
                <Badge 
                  className="bg-orange-100 text-orange-800 text-xs cursor-pointer hover:bg-orange-200 transition-colors"
                  onClick={() => addBet({
                    gameId: game.gameId,
                    betType: 'total',
                    selection: `Under ${totalOdds.total}`,
                    odds: totalOdds.underOdds || -110,
                    stake: 10,
                    potentialWin: 0
                  })}
                >
                  Under {totalOdds.total}
                </Badge>
              </div>
            </div>
          )}
        </div>

        {expanded && (
          <>
            <div className="border-t border-gradient-to-r from-blue-200 via-purple-200 to-orange-200 my-4"></div>
            
            {/* AI Game Analysis */}
            {game.aiSummary && (
              <div className="mb-4 p-3 bg-white/80 border border-slate-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Brain className="h-4 w-4 text-slate-600" />
                  <h4 className="text-sm font-medium text-slate-800">AI Game Analysis</h4>
                  <Badge variant="outline" className="text-xs border-slate-300 text-slate-700">
                    {game.aiSummary.confidence}% Confidence
                  </Badge>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {game.aiSummary.summary}
                </p>
              </div>
            )}

            {/* Pick Suggestions */}
            <div className="space-y-4">
              {/* AI Pick */}
              {aiPick && (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-300 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Brain className="h-5 w-5 text-purple-600" />
                      <h5 className="text-sm font-semibold text-purple-800">AI Suggestion</h5>
                      <Badge className="bg-purple-100 text-purple-800 font-medium">
                        {aiPick.confidence}%
                      </Badge>
                    </div>
                    <Badge className="bg-indigo-100 text-indigo-800">{aiPick.odds || "N/A"}</Badge>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="text-purple-600">{getPickIcon(aiPick.pickType)}</div>
                    <span className="text-sm font-semibold text-indigo-800">{aiPick.selection}</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {aiPick.reasoning}
                  </p>
                </div>
              )}

              {/* Expert picks removed - no authentic expert picks API available */}

              {/* AI Suggested Bets - Show for all games */}
              {!aiPick && (() => {
                const gameSuggestions = aiSuggestedBets.find(bet => bet.gameId === game.gameId);
                
                if (gameSuggestions?.suggestions?.length > 0) {
                  return (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-300 rounded-lg shadow-sm">
                      <div className="flex items-center space-x-2 mb-3">
                        <Brain className="h-5 w-5 text-blue-600" />
                        <h5 className="text-sm font-semibold text-blue-800">AI Suggested Bets</h5>
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          {gameSuggestions.suggestions.length} Options
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {gameSuggestions.suggestions.map((suggestion: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white/60 rounded border border-blue-200">
                            <div className="flex items-center space-x-2">
                              <div className="text-blue-600">{getPickIcon(suggestion.betType)}</div>
                              <div>
                                <span className="text-sm font-medium text-blue-900">
                                  {suggestion.betType === 'moneyline' ? `${suggestion.team} ML` :
                                   suggestion.betType === 'total' ? `${suggestion.selection.toUpperCase()} ${suggestion.line}` :
                                   suggestion.betType === 'spread' ? `${suggestion.team} ${suggestion.line}` :
                                   suggestion.selection}
                                </span>
                                <p className="text-xs text-slate-600">{suggestion.reasoning}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={getConfidenceBadge(suggestion.confidence).color + " text-xs mb-1"}>
                                {suggestion.confidence}%
                              </Badge>
                              <p className="text-xs text-slate-700">{formatOdds(suggestion.odds)}</p>
                              <p className="text-xs text-green-600">EV: {suggestion.expectedValue}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                // Fallback for games without suggestions
                return (
                  <div className="text-center py-6 bg-gradient-to-br from-slate-50 to-gray-100 border border-slate-200 rounded-lg">
                    <Brain className="h-10 w-10 mx-auto mb-3 text-slate-400" />
                    {gameEvaluation ? (
                      <>
                        <p className="text-sm text-slate-700 font-medium mb-2">
                          {gameEvaluation.evaluationStatus === 'evaluated' ? 'Game Evaluated - No Pick Warranted' : 
                           gameEvaluation.evaluationStatus === 'no_value' ? 'No Betting Value Found' :
                           'Insufficient Data for Analysis'}
                        </p>
                        <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto mb-3">
                          {gameEvaluation.reasoning || 
                           'Our AI analyzed this matchup but didn\'t find sufficient edge for a recommended bet. Factors like balanced odds, unclear pitching advantage, or insufficient value may have influenced this decision.'}
                        </p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {gameEvaluation.evaluationStatus === 'evaluated' ? 'Analysis Complete' :
                           gameEvaluation.evaluationStatus === 'no_value' ? 'No Value Found' :
                           'Data Incomplete'}
                        </Badge>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-slate-700 font-medium mb-2">Analysis Pending</p>
                        <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                          This game hasn't been evaluated yet. Check back later for AI analysis and potential picks.
                        </p>
                        <Badge variant="secondary" className="mt-3 text-xs">
                          Awaiting Analysis
                        </Badge>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}