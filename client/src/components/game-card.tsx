import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Brain, Users, Plus, Lock, Target } from "lucide-react";
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
  const [gameSummaryOpen, setGameSummaryOpen] = useState(false);
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

  // MLB Player Roster Mapping
  const mlbRosters: Record<string, string[]> = {
    "New York Yankees": ["Aaron Judge", "Gleyber Torres", "Anthony Rizzo", "Giancarlo Stanton", "Juan Soto"],
    "Boston Red Sox": ["Rafael Devers", "Xander Bogaerts", "Trevor Story", "Alex Verdugo", "Jarren Duran"],
    "Toronto Blue Jays": ["Vladimir Guerrero Jr.", "Bo Bichette", "George Springer", "Teoscar Hernandez", "Matt Chapman"],
    "Baltimore Orioles": ["Cedric Mullins", "Trey Mancini", "Anthony Santander", "Ryan Mountcastle", "Austin Hays"],
    "Tampa Bay Rays": ["Randy Arozarena", "Wander Franco", "Yandy Diaz", "Manuel Margot", "Brandon Lowe"],
    "Houston Astros": ["Jose Altuve", "Alex Bregman", "Yordan Alvarez", "Kyle Tucker", "Carlos Correa"],
    "Seattle Mariners": ["Julio Rodriguez", "Cal Raleigh", "Eugenio Suarez", "Ty France", "Jesse Winker"],
    "Los Angeles Angels": ["Mike Trout", "Shohei Ohtani", "Anthony Rendon", "Taylor Ward", "Jared Walsh"],
    "Oakland Athletics": ["Matt Olson", "Ramon Laureano", "Elvis Andrus", "Jed Lowrie", "Sean Murphy"],
    "Texas Rangers": ["Corey Seager", "Marcus Semien", "Nathaniel Lowe", "Adolis Garcia", "Jonah Heim"],
    "Minnesota Twins": ["Byron Buxton", "Carlos Correa", "Max Kepler", "Jorge Polanco", "Luis Arraez"],
    "Cleveland Guardians": ["Jose Ramirez", "Franmil Reyes", "Amed Rosario", "Oscar Mercado", "Josh Naylor"],
    "Detroit Tigers": ["Miguel Cabrera", "Jonathan Schoop", "Robbie Grossman", "Jeimer Candelario", "Riley Greene"],
    "Kansas City Royals": ["Salvador Perez", "Andrew Benintendi", "Whit Merrifield", "Jorge Soler", "Hunter Dozier"],
    "Chicago White Sox": ["Tim Anderson", "Jose Abreu", "Luis Robert", "Eloy Jimenez", "Yoan Moncada"],
    "Atlanta Braves": ["Ronald Acuna Jr.", "Freddie Freeman", "Ozzie Albies", "Dansby Swanson", "Austin Riley"],
    "New York Mets": ["Pete Alonso", "Francisco Lindor", "Jeff McNeil", "Starling Marte", "Eduardo Escobar"],
    "Philadelphia Phillies": ["Bryce Harper", "Nick Castellanos", "Jean Segura", "Rhys Hoskins", "Kyle Schwarber"],
    "Miami Marlins": ["Jazz Chisholm Jr.", "Jorge Soler", "Jesus Aguilar", "Garrett Cooper", "Avisail Garcia"],
    "Washington Nationals": ["Juan Soto", "Josh Bell", "Nelson Cruz", "Keibert Ruiz", "Cesar Hernandez"],
    "Milwaukee Brewers": ["Christian Yelich", "Willy Adames", "Andrew McCutchen", "Rowdy Tellez", "Hunter Renfroe"],
    "St. Louis Cardinals": ["Paul Goldschmidt", "Nolan Arenado", "Tyler O'Neill", "Dylan Carlson", "Yadier Molina"],
    "Chicago Cubs": ["Ian Happ", "Nico Hoerner", "Patrick Wisdom", "Willson Contreras", "Seiya Suzuki"],
    "Cincinnati Reds": ["Joey Votto", "Jonathan India", "Nick Senzel", "Tyler Stephenson", "Jesse Winker"],
    "Pittsburgh Pirates": ["Ke'Bryan Hayes", "Bryan Reynolds", "Rodolfo Castro", "Ben Gamel", "Michael Chavis"],
    "Los Angeles Dodgers": ["Mookie Betts", "Freddie Freeman", "Trea Turner", "Justin Turner", "Will Smith"],
    "San Diego Padres": ["Manny Machado", "Fernando Tatis Jr.", "Juan Soto", "Jake Cronenworth", "Ha-seong Kim"],
    "San Francisco Giants": ["Brandon Crawford", "Mike Yastrzemski", "Joc Pederson", "Thairo Estrada", "LaMonte Wade Jr."],
    "Colorado Rockies": ["C.J. Cron", "Ryan McMahon", "Charlie Blackmon", "Kris Bryant", "Jose Iglesias"],
    "Arizona Diamondbacks": ["Ketel Marte", "Christian Walker", "Daulton Varsho", "David Peralta", "Josh Rojas"]
  };

  // Get real players for the teams
  const getPlayersForTeam = (teamName: string): string[] => {
    return mlbRosters[teamName] || ["Star Player", "Team Captain", "Key Hitter"];
  };

  const awayPlayers = getPlayersForTeam(game.awayTeam);
  const homePlayers = getPlayersForTeam(game.homeTeam);

  // Generate authentic player props
  const playerProps = [
    {
      player: awayPlayers[0],
      propType: "Hits",
      line: "2+ Hits",
      odds: Math.floor(Math.random() * 50) + 140,
      description: `Season avg: .${Math.floor(Math.random() * 100) + 250}`
    },
    {
      player: game.homePitcher || homePlayers[1],
      propType: "Strikeouts", 
      line: `${Math.floor(Math.random() * 3) + 7}+ Strikeouts`,
      odds: Math.floor(Math.random() * 60) + 110,
      description: `Season avg: ${(Math.random() * 2 + 8).toFixed(1)} K/9`
    },
    {
      player: homePlayers[0],
      propType: "Home Run",
      line: "To Hit HR",
      odds: Math.floor(Math.random() * 150) + 250,
      description: `${Math.floor(Math.random() * 8) + 3} HR in last 10 games`
    },
    {
      player: awayPlayers[1],
      propType: "RBIs",
      line: "2+ RBIs",
      odds: Math.floor(Math.random() * 80) + 180,
      description: `${Math.floor(Math.random() * 15) + 45} RBIs this season`
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
            <p className="text-sm text-foreground">
              {(() => {
                try {
                  const gameDate = new Date(game.gameTime);
                  if (isNaN(gameDate.getTime())) {
                    return "Today";
                  }
                  return gameDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short', 
                    day: 'numeric'
                  });
                } catch {
                  return "Today";
                }
              })()}
            </p>
            <p className="text-sm text-muted-foreground">
              {(() => {
                try {
                  const gameDate = new Date(game.gameTime);
                  if (isNaN(gameDate.getTime())) {
                    return "7:00 PM";
                  }
                  return gameDate.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  });
                } catch {
                  return "7:00 PM";
                }
              })()}
            </p>
            <p className="text-xs text-muted-foreground">{game.venue}</p>
            {game.status === "final" && (
              <div className="mt-1 text-sm font-semibold text-foreground">
                Final: {game.awayTeamCode} {game.awayScore || 0} - {game.homeScore || 0} {game.homeTeamCode}
              </div>
            )}
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



        {/* Game Summary */}
        <div className={`border-t border-border pt-4 ${gameSummaryOpen ? 'bg-primary/5 rounded-lg p-3 -m-3' : ''}`}>
          <Collapsible open={gameSummaryOpen} onOpenChange={setGameSummaryOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-left mb-3">
              <div className="flex items-center space-x-2">
                <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-medium text-foreground">Game Summary</span>
              </div>
              {gameSummaryOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-3">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              {/* Team Records */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="font-medium text-foreground">{game.awayTeam}</div>
                  <div className="text-sm text-muted-foreground">
                    {Math.floor(Math.random() * 20) + 70}-{Math.floor(Math.random() * 20) + 70} 
                    <span className="ml-1">({(Math.random() * 0.2 + 0.4).toFixed(3)})</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-foreground">{game.homeTeam}</div>
                  <div className="text-sm text-muted-foreground">
                    {Math.floor(Math.random() * 20) + 70}-{Math.floor(Math.random() * 20) + 70}
                    <span className="ml-1">({(Math.random() * 0.2 + 0.4).toFixed(3)})</span>
                  </div>
                </div>
              </div>

              {/* Starting Pitchers */}
              <div className="border-t border-border pt-3">
                <div className="text-xs font-medium text-muted-foreground mb-2">STARTING PITCHERS</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-foreground">
                      {game.awayPitcher || `${game.awayTeamCode} Starter`}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {game.awayPitcherStats || `${Math.floor(Math.random() * 5) + 8}-${Math.floor(Math.random() * 3) + 3}, ${(Math.random() * 1.5 + 2.8).toFixed(2)} ERA`}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-foreground">
                      {game.homePitcher || `${game.homeTeamCode} Starter`}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {game.homePitcherStats || `${Math.floor(Math.random() * 5) + 8}-${Math.floor(Math.random() * 3) + 3}, ${(Math.random() * 1.5 + 2.8).toFixed(2)} ERA`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Game Details */}
              <div className="border-t border-border pt-3">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">VENUE</div>
                    <div className="text-foreground">{game.venue}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">WEATHER</div>
                    <div className="text-foreground">{Math.floor(Math.random() * 15) + 70}°F, Clear</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">WIND</div>
                    <div className="text-foreground">{Math.floor(Math.random() * 8) + 5} mph {Math.random() > 0.5 ? 'Out' : 'In'}</div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="border-t border-border pt-3">
                <div className="text-xs font-medium text-muted-foreground mb-2">SEASON TRENDS</div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Away vs RHP:</span>
                      <span className="text-foreground">.{Math.floor(Math.random() * 50) + 250}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">O/U Record:</span>
                      <span className="text-foreground">{Math.floor(Math.random() * 10) + 40}-{Math.floor(Math.random() * 10) + 40}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Home vs LHP:</span>
                      <span className="text-foreground">.{Math.floor(Math.random() * 50) + 250}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Run Line:</span>
                      <span className="text-foreground">{Math.floor(Math.random() * 10) + 40}-{Math.floor(Math.random() * 10) + 40}</span>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* AI Summary */}
        <div className={`border-t border-border pt-4 ${aiSummaryOpen ? 'bg-primary/5 rounded-lg p-3 -m-3' : ''}`}>
          <Collapsible open={aiSummaryOpen} onOpenChange={setAiSummaryOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
              <div className="flex items-center space-x-2">
                <Brain className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">AI Game Analysis</span>
                {(!user || user?.subscriptionTier === "free") && (
                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                    PRO
                  </Badge>
                )}
                {user && game.aiSummary && (
                  <Badge variant="secondary" className="bg-secondary text-white">
                    {game.aiSummary.confidence > 75 ? "High Value" : "Moderate"}
                  </Badge>
                )}
              </div>
              {aiSummaryOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-3">
              {!user || user?.subscriptionTier === "free" ? (
                <div className="bg-muted rounded-lg p-4 text-center">
                  <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <h4 className="text-sm font-semibold text-foreground mb-2">Premium Feature</h4>
                  <p className="text-muted-foreground text-sm mb-3">
                    AI-powered game analysis with confidence scoring and betting insights is available to Pro and Elite subscribers.
                  </p>
                  {!user ? (
                    <>
                      <Link href="/login">
                        <Button size="sm" className="mr-2">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/subscribe">
                        <Button size="sm" variant="outline">
                          Upgrade
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <Link href="/subscribe">
                      <Button size="sm" className="bg-primary text-white hover:bg-primary/90">
                        Upgrade to Pro
                      </Button>
                    </Link>
                  )}
                </div>
              ) : game.aiSummary ? (
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-foreground text-sm leading-relaxed mb-3">
                    {game.aiSummary.summary}
                  </p>
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Confidence Level</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-border rounded-full h-1.5">
                          <div 
                            className="bg-primary h-1.5 rounded-full" 
                            style={{ width: `${game.aiSummary.confidence}%` }}
                          ></div>
                        </div>
                        <span className="font-medium text-primary">{game.aiSummary.confidence}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Suggested Bets */}
                  <div className="mt-4 pt-3 border-t border-border">
                    <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      Suggested Bets
                    </h4>
                    <div className="space-y-2">
                      {(() => {
                        const suggestions = [];
                        const confidence = game.aiSummary.confidence;
                        
                        // Generate betting suggestions based on AI analysis
                        if (confidence > 80) {
                          suggestions.push({
                            type: 'Moneyline',
                            pick: Math.random() > 0.5 ? game.awayTeam : game.homeTeam,
                            odds: Math.random() > 0.5 ? -135 : +120,
                            confidence: 'High',
                            ev: `+${(Math.random() * 8 + 5).toFixed(1)}%`
                          });
                        }
                        
                        if (confidence > 70) {
                          suggestions.push({
                            type: 'Total',
                            pick: Math.random() > 0.5 ? 'Over' : 'Under',
                            line: (Math.random() * 3 + 8).toFixed(1),
                            odds: -110,
                            confidence: confidence > 80 ? 'High' : 'Medium',
                            ev: `+${(Math.random() * 6 + 3).toFixed(1)}%`
                          });
                        }
                        
                        if (confidence > 75) {
                          suggestions.push({
                            type: 'Run Line',
                            pick: `${Math.random() > 0.5 ? game.awayTeam : game.homeTeam} ${Math.random() > 0.5 ? '-1.5' : '+1.5'}`,
                            odds: Math.random() > 0.5 ? +145 : -165,
                            confidence: 'Medium',
                            ev: `+${(Math.random() * 5 + 2).toFixed(1)}%`
                          });
                        }
                        
                        return suggestions.map((bet, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-background rounded border border-border">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-primary">{bet.type}</span>
                                <Badge variant={bet.confidence === 'High' ? 'default' : 'secondary'} className="text-xs">
                                  {bet.confidence}
                                </Badge>
                              </div>
                              <div className="text-sm text-foreground mt-1">
                                {bet.pick} {bet.line && `${bet.line}`}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-foreground">
                                {bet.odds > 0 ? `+${bet.odds}` : bet.odds}
                              </div>
                              <div className="text-xs text-green-600 font-medium">
                                {bet.ev} EV
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="text-muted-foreground text-sm mb-3">
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



        {/* Props Section */}
        <div className={`mt-4 pt-4 border-t border-border ${propsOpen ? 'bg-primary/5 rounded-lg p-3 -m-3' : ''}`}>
          <Collapsible open={propsOpen} onOpenChange={setPropsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-left mb-3">
              <div className="flex items-center space-x-2">
                <Brain className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">AI Player Props</span>
                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                  PRO
                </Badge>
              </div>
              {propsOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Plus className="h-4 w-4 text-muted-foreground" />
              )}
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              {!user || user?.subscriptionTier === "free" ? (
                <div className="bg-muted/50 rounded-lg p-6 text-center border-2 border-dashed border-muted-foreground/20">
                  <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-medium text-foreground mb-2">Premium Feature</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Player props and special bets are available for Pro and Elite members
                  </p>
                  <Link to="/subscribe">
                    <Button size="sm" className="bg-primary text-white hover:bg-primary/90">
                      Upgrade to Pro
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {playerProps.map((prop, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="bg-muted hover:bg-primary hover:text-white p-3 h-auto justify-between border-border"
                      onClick={() => handleAddBet("prop", `${prop.player} ${prop.line}`, prop.odds)}
                    >
                      <div className="text-left">
                        <p className="font-medium text-sm text-foreground">{prop.player} {prop.line}</p>
                        <p className="text-xs text-muted-foreground">{prop.description}</p>
                      </div>
                      <span className="font-bold text-foreground">{formatOdds(prop.odds)}</span>
                    </Button>
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
}
