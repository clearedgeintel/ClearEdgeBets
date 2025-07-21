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
  const [expanded, setExpanded] = useState(false);
  const { addBet } = useBettingSlip();

  // Fetch AI picks for this game
  const { data: aiPicks = [] } = useQuery<AIPickData[]>({
    queryKey: ['/api/daily-picks'],
    select: (data) => data.filter((pick: any) => pick.gameId === game.gameId).slice(0, 1)
  });

  // Fetch expert picks for this game
  const { data: expertPicksData } = useQuery<any>({
    queryKey: ['/api/mlb/picks/authentic'],
    select: (data) => {
      const picks = data?.data?.picks || [];
      return picks.filter((pick: any) => pick.gameId === game.gameId).slice(0, 1);
    }
  });

  const expertPicks = expertPicksData || [];

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
                awayScore={game.awayScore}
                homeScore={game.homeScore}
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
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Moneyline</p>
              <div className="space-y-1">
                <Badge variant="outline" className="text-xs">
                  {game.awayTeamCode} {formatOdds(moneylineOdds.awayOdds || 0)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {game.homeTeamCode} {formatOdds(moneylineOdds.homeOdds || 0)}
                </Badge>
              </div>
            </div>
          )}
          
          {spreadOdds && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Run Line</p>
              <div className="space-y-1">
                <Badge variant="outline" className="text-xs">
                  {game.awayTeamCode} {spreadOdds.awaySpread}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {game.homeTeamCode} {spreadOdds.homeSpread}
                </Badge>
              </div>
            </div>
          )}

          {totalOdds && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Total</p>
              <div className="space-y-1">
                <Badge variant="outline" className="text-xs">
                  Over {totalOdds.total}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Under {totalOdds.total}
                </Badge>
              </div>
            </div>
          )}
        </div>

        {expanded && (
          <>
            <div className="border-t my-4"></div>
            
            {/* AI Game Analysis */}
            {game.aiSummary && (
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Brain className="h-4 w-4 text-purple-600" />
                  <h4 className="text-sm font-medium">AI Game Analysis</h4>
                  <Badge variant="outline" className="text-xs">
                    {game.aiSummary.confidence}% Confidence
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {game.aiSummary.summary}
                </p>
              </div>
            )}

            {/* Pick Suggestions */}
            <div className="space-y-4">
              {/* AI Pick */}
              {aiPicks.length > 0 && (
                <div className="p-3 bg-purple-50/30 border border-purple-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Brain className="h-4 w-4 text-purple-600" />
                      <h5 className="text-sm font-medium">AI Suggestion</h5>
                      <Badge className={getConfidenceBadge(aiPicks[0].confidence).color}>
                        {aiPicks[0].confidence}%
                      </Badge>
                    </div>
                    <Badge variant="outline">{aiPicks[0].odds}</Badge>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    {getPickIcon(aiPicks[0].pickType)}
                    <span className="text-sm font-medium">{aiPicks[0].selection}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {aiPicks[0].reasoning}
                  </p>
                </div>
              )}

              {/* Expert Pick */}
              {expertPicks.length > 0 && (
                <div className="p-3 bg-orange-50/30 border border-orange-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-orange-600" />
                      <h5 className="text-sm font-medium">Expert Suggestion</h5>
                      <Badge className={getConfidenceBadge(expertPicks[0].confidence).color}>
                        {expertPicks[0].confidence}%
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Badge variant="outline">{expertPicks[0].odds}</Badge>
                      {expertPicks[0].value > 0 && (
                        <Badge className="bg-green-100 text-green-800">
                          +{expertPicks[0].value}% EV
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    {getPickIcon(expertPicks[0].pickType)}
                    <span className="text-sm font-medium">{expertPicks[0].selection}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {expertPicks[0].reasoning}
                  </p>
                </div>
              )}

              {/* No picks available message */}
              {aiPicks.length === 0 && expertPicks.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No AI or expert picks available for this game</p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}