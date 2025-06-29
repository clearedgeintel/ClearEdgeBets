import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Brain, Users, Plus, Lock } from "lucide-react";
import { useBettingSlip } from "@/contexts/betting-slip-context";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

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
    publicPercentage?: any;
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

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  const [aiSummaryOpen, setAiSummaryOpen] = useState(false);
  const [propsOpen, setPropsOpen] = useState(false);
  const { addBet } = useBettingSlip();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const generateAnalysisMutation = useMutation({
    mutationFn: async (gameId: string) => {
      const response = await apiRequest("POST", `/api/games/${gameId}/analyze`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
    },
  });

  const getOddsByMarket = (market: string) => {
    return game.odds.find(o => o.market === market);
  };

  const moneylineOdds = getOddsByMarket("moneyline");
  const totalOdds = getOddsByMarket("totals");
  const spreadOdds = getOddsByMarket("spreads");

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const handleAddBet = (betType: string, selection: string, odds: number) => {
    addBet({
      gameId: game.gameId,
      betType,
      selection,
      odds,
      stake: 0,
      potentialWin: 0
    });
  };

  const handleGenerateAnalysis = () => {
    generateAnalysisMutation.mutate(game.gameId);
  };

  const getPublicPercentage = (market: string, side: string) => {
    const odds = getOddsByMarket(market);
    if (!odds?.publicPercentage) return null;
    
    try {
      const percentages = odds.publicPercentage;
      if (market === "moneyline") {
        return percentages.moneyline?.[side] || Math.floor(Math.random() * 40) + 30;
      }
      if (market === "totals") {
        return percentages.total?.[side] || Math.floor(Math.random() * 30) + 40;
      }
    } catch {
      return Math.floor(Math.random() * 40) + 30;
    }
  };

  // Mock props data
  const mockProps = [
    {
      player: game.awayTeam.split(' ').pop() + " Player",
      propType: "Hits",
      line: "2+ Hits",
      odds: 165,
      description: "Season avg: .298"
    },
    {
      player: game.homePitcher || "Starting Pitcher",
      propType: "Strikeouts",
      line: "8+ Strikeouts",
      odds: 125,
      description: "Season avg: 9.2 K/9"
    },
    {
      player: game.homeTeam.split(' ').pop() + " Player",
      propType: "Home Run",
      line: "To Hit HR",
      odds: 280,
      description: "5 HR in last 8 games"
    },
    {
      player: "Game Special",
      propType: "Extra Innings",
      line: "Goes to Extras",
      odds: 450,
      description: "Both teams 2-1 in extras"
    }
  ];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        {/* Game Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{game.awayTeamCode}</span>
                </div>
                <span className="font-semibold text-foreground">{game.awayTeam}</span>
              </div>
              <span className="text-muted-foreground">@</span>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{game.homeTeamCode}</span>
                </div>
                <span className="font-semibold text-foreground">{game.homeTeam}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">{game.gameTime}</p>
            <p className="text-xs text-gray-500">{game.venue}</p>
          </div>
        </div>

        {/* Pitching Matchup */}
        {(game.awayPitcher || game.homePitcher) && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex justify-between items-center text-sm">
              <div className="text-center">
                <p className="font-medium text-gray-900">{game.awayPitcher || "TBD"}</p>
                <p className="text-xs text-gray-600">{game.awayPitcherStats || "No stats"}</p>
              </div>
              <div className="text-gray-400">
                <span className="text-lg">⚾</span>
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-900">{game.homePitcher || "TBD"}</p>
                <p className="text-xs text-gray-600">{game.homePitcherStats || "No stats"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Betting Lines */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Moneyline */}
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Moneyline</p>
            <div className="space-y-1">
              {moneylineOdds?.awayOdds && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full hover:bg-primary hover:text-white"
                  onClick={() => handleAddBet("moneyline", `${game.awayTeam} ML`, moneylineOdds.awayOdds!)}
                >
                  {game.awayTeamCode} <span className="float-right">{formatOdds(moneylineOdds.awayOdds)}</span>
                </Button>
              )}
              {moneylineOdds?.homeOdds && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full hover:bg-primary hover:text-white"
                  onClick={() => handleAddBet("moneyline", `${game.homeTeam} ML`, moneylineOdds.homeOdds!)}
                >
                  {game.homeTeamCode} <span className="float-right">{formatOdds(moneylineOdds.homeOdds)}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Run Line */}
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Run Line</p>
            <div className="space-y-1">
              {spreadOdds?.awaySpread && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full hover:bg-primary hover:text-white"
                  onClick={() => handleAddBet("spread", `${game.awayTeam} ${spreadOdds.awaySpread}`, spreadOdds.awaySpreadOdds!)}
                >
                  {game.awayTeamCode} {spreadOdds.awaySpread} <span className="float-right">{formatOdds(spreadOdds.awaySpreadOdds!)}</span>
                </Button>
              )}
              {spreadOdds?.homeSpread && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full hover:bg-primary hover:text-white"
                  onClick={() => handleAddBet("spread", `${game.homeTeam} ${spreadOdds.homeSpread}`, spreadOdds.homeSpreadOdds!)}
                >
                  {game.homeTeamCode} {spreadOdds.homeSpread} <span className="float-right">{formatOdds(spreadOdds.homeSpreadOdds!)}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Total Runs */}
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Total Runs</p>
            <div className="space-y-1">
              {totalOdds?.total && totalOdds?.overOdds && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full hover:bg-primary hover:text-white"
                  onClick={() => handleAddBet("total", `Over ${totalOdds.total}`, totalOdds.overOdds!)}
                >
                  O {totalOdds.total} <span className="float-right">{formatOdds(totalOdds.overOdds)}</span>
                </Button>
              )}
              {totalOdds?.total && totalOdds?.underOdds && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full hover:bg-primary hover:text-white"
                  onClick={() => handleAddBet("total", `Under ${totalOdds.total}`, totalOdds.underOdds!)}
                >
                  U {totalOdds.total} <span className="float-right">{formatOdds(totalOdds.underOdds)}</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Public Betting Info */}
        <div className="bg-muted rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Public Betting</span>
            <span className="text-xs text-muted-foreground">
              <Users className="h-3 w-3 inline mr-1" />
              Updated 10 min ago
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-muted-foreground">Moneyline</span>
                <span className="font-medium text-foreground">{getPublicPercentage("moneyline", "away")}% {game.awayTeamCode}</span>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${getPublicPercentage("moneyline", "away")}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium text-foreground">{getPublicPercentage("totals", "over")}% Over</span>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div 
                  className="bg-secondary h-2 rounded-full" 
                  style={{ width: `${getPublicPercentage("totals", "over")}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        <div className="border-t border-gray-200 pt-4">
          <Collapsible open={aiSummaryOpen} onOpenChange={setAiSummaryOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
              <div className="flex items-center space-x-2">
                <Brain className="h-4 w-4 text-primary" />
                <span className="font-medium text-gray-900">AI Game Analysis</span>
                {!user && (
                  <Badge variant="outline" className="border-orange-200 text-orange-600">
                    <Lock className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                )}
                {user && game.aiSummary && (
                  <Badge variant="secondary" className="bg-secondary text-white">
                    {game.aiSummary.confidence > 75 ? "High Value" : "Moderate"}
                  </Badge>
                )}
              </div>
              {aiSummaryOpen ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-3">
              {(!user && !game.aiSummary) ? (
                <div className="relative bg-gray-50 rounded-lg p-4">
                  <div className="blur-sm select-none pointer-events-none">
                    <p className="text-gray-700 text-sm leading-relaxed mb-3">
                      This matchup features strong pitching on both sides with the home starter showing excellent command in recent outings. The visiting team's recent offensive struggles against similar pitching styles suggest value on the under. Key factors include weather conditions favoring pitchers and both bullpens well-rested.
                    </p>
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Confidence Level</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div className="bg-secondary h-1.5 rounded-full" style={{ width: '78%' }}></div>
                          </div>
                          <span className="font-medium text-secondary">78%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-lg">
                    <div className="text-center p-4">
                      <Lock className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                      <h3 className="font-semibold text-gray-900 mb-2">Premium AI Analysis</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Get detailed game breakdowns, value plays, and confidence ratings
                      </p>
                      <div className="space-y-2">
                        <Link href="/subscribe">
                          <Button className="w-full bg-primary hover:bg-primary/90">
                            Sign Up for Free
                          </Button>
                        </Link>
                        <Link href="/subscribe">
                          <Button variant="outline" size="sm" className="w-full">
                            Learn More
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ) : game.aiSummary ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 text-sm leading-relaxed mb-3">
                    {game.aiSummary.summary}
                  </p>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Confidence Level</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-secondary h-1.5 rounded-full" 
                            style={{ width: `${game.aiSummary.confidence}%` }}
                          ></div>
                        </div>
                        <span className="font-medium text-secondary">{game.aiSummary.confidence}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-gray-600 text-sm mb-3">
                    AI analysis not yet available for this game.
                  </p>
                  <Button 
                    size="sm" 
                    onClick={handleGenerateAnalysis}
                    disabled={generateAnalysisMutation.isPending}
                  >
                    {generateAnalysisMutation.isPending ? "Generating..." : "Generate Analysis"}
                  </Button>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Public Sentiment Section */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="mb-3">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Public Betting Sentiment
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Moneyline Public</span>
                  <span className="font-medium">62% • 38%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '62%' }}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{game.awayTeamCode}</span>
                  <span>{game.homeTeamCode}</span>
                </div>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Total Public</span>
                  <span className="font-medium">58% • 42%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '58%' }}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Over</span>
                  <span>Under</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Props Section */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Collapsible open={propsOpen} onOpenChange={setPropsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-left mb-3">
              <span className="font-medium text-gray-900">Player Props & Specials</span>
              {propsOpen ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <Plus className="h-4 w-4 text-gray-400" />
              )}
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mockProps.map((prop, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="bg-gray-50 hover:bg-primary hover:text-white p-3 h-auto justify-between"
                    onClick={() => handleAddBet("prop", `${prop.player} ${prop.line}`, prop.odds)}
                  >
                    <div className="text-left">
                      <p className="font-medium text-sm">{prop.player} {prop.line}</p>
                      <p className="text-xs opacity-75">{prop.description}</p>
                    </div>
                    <span className="font-bold">{formatOdds(prop.odds)}</span>
                  </Button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
}
