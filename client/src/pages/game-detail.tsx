import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useState } from "react";
import GameCard from "@/components/game-card";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  BarChart3, 
  Users, 
  Clock, 
  MapPin,
  ThermometerSun,
  Wind,
  ArrowLeft,
  Target,
  Brain,
  Trophy
} from "lucide-react";
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

export default function GameDetail() {
  const params = useParams();
  const gameId = params.gameId;
  
  const { data: games = [], isLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  const game = games.find(g => g.gameId === gameId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading game details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold mb-2">Game Not Found</h2>
              <p className="text-muted-foreground">The requested game could not be found.</p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {game.awayTeam} @ {game.homeTeam}
            </h1>
            <div className="flex items-center space-x-4 text-muted-foreground">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {game.gameTime} ET
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {game.venue}
              </div>
              {game.status === "completed" && (
                <Badge variant="secondary">Final</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Game Card */}
          <div className="lg:col-span-2">
            <GameCard game={game} />
            
            {/* Additional Analysis Tabs */}
            <div className="mt-6">
              <Tabs defaultValue="trends" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="trends">Trends</TabsTrigger>
                  <TabsTrigger value="weather">Weather</TabsTrigger>
                  <TabsTrigger value="history">H2H</TabsTrigger>
                  <TabsTrigger value="public">Public</TabsTrigger>
                </TabsList>
                
                <TabsContent value="trends" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2" />
                        Recent Performance Trends
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">{game.awayTeamCode} Trends</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• 7-3 in last 10 games</li>
                            <li>• 4-1 in last 5 road games</li>
                            <li>• Over 6-4 in last 10</li>
                            <li>• Strong vs RHP (5-2)</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">{game.homeTeamCode} Trends</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• 5-5 in last 10 games</li>
                            <li>• 3-2 in last 5 home games</li>
                            <li>• Under 7-3 in last 10</li>
                            <li>• Struggles vs LHP (2-3)</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="weather" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <ThermometerSun className="h-5 w-5 mr-2" />
                        Weather Conditions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">78°F</div>
                          <div className="text-sm text-muted-foreground">Temperature</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold flex items-center justify-center">
                            <Wind className="h-5 w-5 mr-1" />
                            12mph
                          </div>
                          <div className="text-sm text-muted-foreground">Wind Speed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">20%</div>
                          <div className="text-sm text-muted-foreground">Rain Chance</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">65%</div>
                          <div className="text-sm text-muted-foreground">Humidity</div>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm">
                          <strong>Weather Impact:</strong> Favorable conditions for offense with warm temperatures and moderate wind. 
                          No significant weather concerns expected.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="history" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Trophy className="h-5 w-5 mr-2" />
                        Head-to-Head History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <span className="font-medium">Season Series</span>
                          <span>{game.homeTeamCode} leads 4-2</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div className="text-center p-3 border rounded">
                            <div className="font-bold">Last 5 Games</div>
                            <div className="text-muted-foreground">3-2 {game.homeTeamCode}</div>
                          </div>
                          <div className="text-center p-3 border rounded">
                            <div className="font-bold">At {game.venue}</div>
                            <div className="text-muted-foreground">2-1 {game.homeTeamCode}</div>
                          </div>
                          <div className="text-center p-3 border rounded">
                            <div className="font-bold">Avg. Total</div>
                            <div className="text-muted-foreground">8.3 runs</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="public" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Users className="h-5 w-5 mr-2" />
                        Public Betting Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Moneyline</span>
                            <span className="text-sm text-muted-foreground">% of Bets</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span>{game.awayTeamCode}</span>
                              <div className="flex items-center">
                                <div className="w-24 bg-muted rounded-full h-2 mr-2">
                                  <div className="bg-blue-500 h-2 rounded-full" style={{width: '35%'}}></div>
                                </div>
                                <span className="text-sm">35%</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>{game.homeTeamCode}</span>
                              <div className="flex items-center">
                                <div className="w-24 bg-muted rounded-full h-2 mr-2">
                                  <div className="bg-green-500 h-2 rounded-full" style={{width: '65%'}}></div>
                                </div>
                                <span className="text-sm">65%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 p-3 bg-muted rounded-lg">
                          <p className="text-sm">
                            <strong>Sharp vs. Public:</strong> Public heavily backing the home team while sharp money 
                            showing interest in the away team. Consider contrarian value.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Key Matchup Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Team ERA</span>
                    <span className="text-sm font-medium">3.84 vs 4.12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Runs/Game</span>
                    <span className="text-sm font-medium">5.2 vs 4.8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Home Runs</span>
                    <span className="text-sm font-medium">142 vs 128</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Bullpen ERA</span>
                    <span className="text-sm font-medium">3.65 vs 3.91</span>
                  </div>
                </CardContent>
              </Card>

              {/* AI Confidence */}
              {game.aiSummary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Brain className="h-5 w-5 mr-2" />
                      AI Confidence
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-1">
                        {game.aiSummary.confidence}%
                      </div>
                      <div className="text-sm text-muted-foreground mb-3">
                        Overall Analysis Confidence
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{width: `${game.aiSummary.confidence}%`}}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Value Plays */}
              {game.aiSummary?.valuePlays && game.aiSummary.valuePlays.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="h-5 w-5 mr-2" />
                      Top Value Plays
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {game.aiSummary.valuePlays.slice(0, 3).map((play, index) => (
                      <div key={index} className="p-3 bg-muted rounded-lg">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-sm">{play.selection}</span>
                          <Badge variant="secondary" className="text-xs">
                            +{play.expectedValue.toFixed(1)}% EV
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{play.reasoning}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}