import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Medal, Award, TrendingUp, DollarSign, Target, Calendar, Users } from "lucide-react";
import { format, startOfWeek, addWeeks, subWeeks } from "date-fns";

interface LeaderboardEntry {
  id: number;
  userId: number;
  weekStart: Date;
  weekEnd: Date;
  totalBets: number;
  wonBets: number;
  lostBets: number;
  winRate: string;
  totalStaked: string;
  totalWinnings: string;
  netProfit: string;
  profitMargin: string;
  rank: number;
  points: number;
  user: {
    id: number;
    username: string;
    email: string;
    subscriptionTier: string;
  };
}

interface UserWeeklyStats {
  totalBets: number;
  wonBets: number;
  lostBets: number;
  winRate: string;
  totalStaked: string;
  totalWinnings: string;
  netProfit: string;
  profitMargin: string;
  rank: number;
  points: number;
}

export default function WeeklyLeaderboard() {
  const [selectedWeek, setSelectedWeek] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const { data: leaderboard = [], isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/weekly-leaderboard", selectedWeek.toISOString()],
    queryFn: async () => {
      const response = await fetch(`/api/weekly-leaderboard/${selectedWeek.toISOString()}`);
      if (!response.ok) throw new Error("Failed to fetch leaderboard");
      return response.json();
    },
  });

  const { data: currentWeekStats } = useQuery<UserWeeklyStats>({
    queryKey: ["/api/user/1/weekly-stats"], // Using user ID 1 for demo
    queryFn: async () => {
      const response = await fetch("/api/user/1/weekly-stats");
      if (!response.ok) throw new Error("Failed to fetch user stats");
      return response.json();
    },
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'elite':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'pro':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedWeek(subWeeks(selectedWeek, 1));
    } else {
      setSelectedWeek(addWeeks(selectedWeek, 1));
    }
  };

  const isCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 1 }).getTime() === selectedWeek.getTime();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Weekly Leaderboard</h1>
          <p className="text-muted-foreground">
            Compete with other users in virtual betting challenges. Leaderboard resets every Monday.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
            Previous Week
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
            Current Week
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
            Next Week
          </Button>
        </div>
      </div>

      {/* Week Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>
              {format(selectedWeek, 'MMM d')} - {format(addWeeks(selectedWeek, 1), 'MMM d, yyyy')}
              {isCurrentWeek && <Badge className="ml-2">Current Week</Badge>}
            </span>
          </CardTitle>
          <CardDescription>
            Weekly betting competition with virtual money. Win points by making successful bets.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="leaderboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="stats">My Stats</TabsTrigger>
          <TabsTrigger value="rules">How It Works</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading leaderboard...</p>
                </div>
              </CardContent>
            </Card>
          ) : leaderboard.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No competitors yet</h3>
                  <p className="text-muted-foreground">Be the first to make picks this week!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <Card key={entry.id} className={`transition-all ${entry.rank <= 3 ? 'ring-2 ring-primary/20' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {getRankIcon(entry.rank)}
                        </div>
                        <Avatar>
                          <AvatarFallback>
                            {entry.user.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{entry.user.username}</h3>
                            <Badge className={getTierBadgeColor(entry.user.subscriptionTier)}>
                              {entry.user.subscriptionTier}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {entry.totalBets} bets • {parseFloat(entry.winRate || '0').toFixed(1)}% win rate
                          </p>
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className="text-lg font-bold text-primary">{entry.points || 0}</div>
                            <div className="text-xs text-muted-foreground">Points</div>
                          </div>
                          <div className="text-center">
                            <div className={`text-lg font-bold ${parseFloat(entry.netProfit || '0') >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              ${parseFloat(entry.netProfit || '0').toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">Net P&L</div>
                          </div>
                          <div className="text-center">
                            <div className={`text-lg font-bold ${parseFloat(entry.profitMargin || '0') >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {parseFloat(entry.profitMargin || '0').toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">ROI</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          {currentWeekStats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Your Rank</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">#{currentWeekStats.rank || 'Unranked'}</div>
                  <p className="text-xs text-muted-foreground">
                    {currentWeekStats.points} points
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{parseFloat(currentWeekStats.winRate || '0').toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    {currentWeekStats.wonBets}W / {currentWeekStats.lostBets}L
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${parseFloat(currentWeekStats.netProfit || '0') >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${parseFloat(currentWeekStats.netProfit || '0').toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ${parseFloat(currentWeekStats.totalStaked || '0').toFixed(2)} staked
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">ROI</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${parseFloat(currentWeekStats.profitMargin || '0') >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {parseFloat(currentWeekStats.profitMargin || '0').toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Return on investment
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>How the Weekly Leaderboard Works</CardTitle>
              <CardDescription>
                Compete with other users in virtual betting challenges
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Scoring System</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li><strong>Winning Bets:</strong> 3 points per win</li>
                  <li><strong>Losing Bets:</strong> 0 points</li>
                  <li><strong>Ranking:</strong> Sorted by total points, then by net profit</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Competition Schedule</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li><strong>Weekly Reset:</strong> Every Monday at midnight</li>
                  <li><strong>Competition Period:</strong> Monday to Sunday</li>
                  <li><strong>Virtual Money:</strong> All betting is done with virtual funds</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Metrics Tracked</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li><strong>Points:</strong> Total points earned from winning bets</li>
                  <li><strong>Win Rate:</strong> Percentage of bets won</li>
                  <li><strong>Net Profit:</strong> Total winnings minus total stakes</li>
                  <li><strong>ROI:</strong> Return on investment percentage</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Getting Started</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Visit the Prediction Game to make picks</li>
                  <li>All users start with $1,000 virtual balance</li>
                  <li>Make smart betting decisions to climb the leaderboard</li>
                  <li>Check back weekly to see your ranking improve</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}