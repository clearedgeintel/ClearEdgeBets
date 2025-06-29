import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Calendar, MapPin, DollarSign, Users, Star, Clock, Target, TrendingUp, Flag } from "lucide-react";

interface GolfTournament {
  id: string;
  name: string;
  venue: string;
  location: string;
  startDate: string;
  endDate: string;
  purse: number;
  field: number;
  status: 'upcoming' | 'in-progress' | 'completed';
  tour: 'PGA' | 'LIV' | 'European';
  major: boolean;
  cutLine?: number;
  featured?: boolean;
  odds?: {
    winner: Array<{
      player: string;
      odds: number;
      position?: number;
    }>;
  };
}

interface GolfOdds {
  tournamentId: string;
  player: string;
  toWin: number;
  top5: number;
  top10: number;
  top20: number;
  missedCut: number;
}

export default function GolfTournaments() {
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);

  const { data: tournaments, isLoading } = useQuery<GolfTournament[]>({
    queryKey: ['/api/golf/tournaments'],
  });

  const { data: odds } = useQuery<GolfOdds[]>({
    queryKey: ['/api/golf/odds', selectedTournament],
    enabled: !!selectedTournament,
  });

  // Mock data for demonstration - replace with real API calls
  const mockTournaments: GolfTournament[] = [
    {
      id: "genesis-invitational-2025",
      name: "Genesis Invitational",
      venue: "Riviera Country Club",
      location: "Pacific Palisades, CA",
      startDate: "2025-02-13",
      endDate: "2025-02-16",
      purse: 20000000,
      field: 120,
      status: 'upcoming',
      tour: 'PGA',
      major: false,
      featured: true,
      odds: {
        winner: [
          { player: "Scottie Scheffler", odds: 650, position: 1 },
          { player: "Xander Schauffele", odds: 1000, position: 2 },
          { player: "Jon Rahm", odds: 1200, position: 3 },
          { player: "Viktor Hovland", odds: 1400, position: 4 },
          { player: "Collin Morikawa", odds: 1600, position: 5 }
        ]
      }
    },
    {
      id: "wm-phoenix-open-2025",
      name: "WM Phoenix Open",
      venue: "TPC Scottsdale",
      location: "Scottsdale, AZ",
      startDate: "2025-01-30",
      endDate: "2025-02-02",
      purse: 9100000,
      field: 132,
      status: 'upcoming',
      tour: 'PGA',
      major: false,
      featured: true,
      odds: {
        winner: [
          { player: "Scottie Scheffler", odds: 700, position: 1 },
          { player: "Xander Schauffele", odds: 1100, position: 2 },
          { player: "Patrick Cantlay", odds: 1300, position: 3 },
          { player: "Tony Finau", odds: 1500, position: 4 },
          { player: "Sahith Theegala", odds: 1800, position: 5 }
        ]
      }
    },
    {
      id: "masters-2025",
      name: "The Masters Tournament",
      venue: "Augusta National Golf Club",
      location: "Augusta, GA",
      startDate: "2025-04-10",
      endDate: "2025-04-13",
      purse: 18000000,
      field: 90,
      status: 'upcoming',
      tour: 'PGA',
      major: true,
      featured: true,
      odds: {
        winner: [
          { player: "Scottie Scheffler", odds: 550, position: 1 },
          { player: "Jon Rahm", odds: 900, position: 2 },
          { player: "Viktor Hovland", odds: 1200, position: 3 },
          { player: "Xander Schauffele", odds: 1400, position: 4 },
          { player: "Collin Morikawa", odds: 1600, position: 5 }
        ]
      }
    },
    {
      id: "pga-championship-2025",
      name: "PGA Championship",
      venue: "Quail Hollow Club",
      location: "Charlotte, NC",
      startDate: "2025-05-15",
      endDate: "2025-05-18",
      purse: 18500000,
      field: 156,
      status: 'upcoming',
      tour: 'PGA',
      major: true,
      odds: {
        winner: [
          { player: "Scottie Scheffler", odds: 600, position: 1 },
          { player: "Xander Schauffele", odds: 1000, position: 2 },
          { player: "Jon Rahm", odds: 1100, position: 3 },
          { player: "Viktor Hovland", odds: 1300, position: 4 },
          { player: "Cameron Smith", odds: 1500, position: 5 }
        ]
      }
    },
    {
      id: "us-open-2025",
      name: "U.S. Open",
      venue: "Oakmont Country Club",
      location: "Oakmont, PA",
      startDate: "2025-06-12",
      endDate: "2025-06-15",
      purse: 21500000,
      field: 156,
      status: 'upcoming',
      tour: 'PGA',
      major: true,
      odds: {
        winner: [
          { player: "Scottie Scheffler", odds: 650, position: 1 },
          { player: "Jon Rahm", odds: 1000, position: 2 },
          { player: "Viktor Hovland", odds: 1200, position: 3 },
          { player: "Xander Schauffele", odds: 1400, position: 4 },
          { player: "Collin Morikawa", odds: 1600, position: 5 }
        ]
      }
    },
    {
      id: "open-championship-2025",
      name: "The Open Championship",
      venue: "Royal Portrush Golf Club",
      location: "Portrush, Northern Ireland",
      startDate: "2025-07-17",
      endDate: "2025-07-20",
      purse: 16500000,
      field: 156,
      status: 'upcoming',
      tour: 'PGA',
      major: true,
      odds: {
        winner: [
          { player: "Jon Rahm", odds: 700, position: 1 },
          { player: "Scottie Scheffler", odds: 800, position: 2 },
          { player: "Viktor Hovland", odds: 1100, position: 3 },
          { player: "Rory McIlroy", odds: 1200, position: 4 },
          { player: "Cameron Smith", odds: 1400, position: 5 }
        ]
      }
    }
  ];

  const displayTournaments = tournaments || mockTournaments;
  const featuredTournaments = displayTournaments.filter(t => t.featured);
  const majorTournaments = displayTournaments.filter(t => t.major);
  const upcomingTournaments = displayTournaments.filter(t => t.status === 'upcoming');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatPurse = (amount: number) => {
    return `$${(amount / 1000000).toFixed(1)}M`;
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'in-progress': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'completed': return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Flag className="h-10 w-10 text-accent" />
              <h1 className="text-4xl font-bold">Golf Tournaments</h1>
            </div>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              Complete PGA Tour coverage with live odds, tournament insights, and betting opportunities.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 -mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Trophy className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-lg font-bold text-foreground">{majorTournaments.length}</div>
              <div className="text-xs text-muted-foreground">Major Championships</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-secondary" />
              <div className="text-lg font-bold text-foreground">{upcomingTournaments.length}</div>
              <div className="text-xs text-muted-foreground">Upcoming Events</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <DollarSign className="h-6 w-6 mx-auto mb-2 text-accent" />
              <div className="text-lg font-bold text-foreground">
                ${Math.round(displayTournaments.reduce((sum, t) => sum + t.purse, 0) / 1000000)}M
              </div>
              <div className="text-xs text-muted-foreground">Total Purse</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-lg font-bold text-foreground">Live</div>
              <div className="text-xs text-muted-foreground">Betting Markets</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="featured" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="majors">Majors</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="odds">Odds</TabsTrigger>
          </TabsList>

          <TabsContent value="featured" className="space-y-6">
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-3xl font-bold text-foreground">Featured Tournaments</h2>
              <p className="text-muted-foreground">
                Highlighted events with the best betting opportunities and competitive fields.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {featuredTournaments.map((tournament) => (
                <Card key={tournament.id} className="bg-card border-border hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <CardTitle className="text-foreground">{tournament.name}</CardTitle>
                          {tournament.major && (
                            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                              <Trophy className="h-3 w-3 mr-1" />
                              Major
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {tournament.venue}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className={getStatusColor(tournament.status)}>
                        {tournament.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Dates</div>
                        <div className="font-medium text-foreground">
                          {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Purse</div>
                        <div className="font-medium text-foreground">{formatPurse(tournament.purse)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Field</div>
                        <div className="font-medium text-foreground">{tournament.field} players</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Location</div>
                        <div className="font-medium text-foreground">{tournament.location}</div>
                      </div>
                    </div>

                    {tournament.odds && (
                      <div className="space-y-3 pt-4 border-t border-border">
                        <div className="text-sm font-medium text-foreground">Tournament Winner Odds</div>
                        <div className="space-y-2">
                          {tournament.odds.winner.slice(0, 3).map((player, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                  {index + 1}
                                </div>
                                <span className="font-medium text-foreground">{player.player}</span>
                              </div>
                              <span className="font-mono text-foreground">{formatOdds(player.odds)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-2 pt-2">
                      <Button size="sm" className="flex-1">
                        <Target className="h-4 w-4 mr-2" />
                        View Odds
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Leaderboard
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="majors" className="space-y-6">
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-3xl font-bold text-foreground">Major Championships</h2>
              <p className="text-muted-foreground">
                The four most prestigious tournaments in professional golf.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {majorTournaments.map((tournament) => (
                <Card key={tournament.id} className="bg-card border-border border-yellow-500/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Trophy className="h-6 w-6 text-yellow-600" />
                        <CardTitle className="text-foreground">{tournament.name}</CardTitle>
                      </div>
                      <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                        Major
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Venue</div>
                        <div className="font-medium text-foreground">{tournament.venue}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Dates</div>
                        <div className="font-medium text-foreground">
                          {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Purse</div>
                        <div className="font-medium text-foreground">{formatPurse(tournament.purse)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Field</div>
                        <div className="font-medium text-foreground">{tournament.field} players</div>
                      </div>
                    </div>

                    {tournament.odds && (
                      <div className="space-y-2 pt-4 border-t border-border">
                        <div className="text-sm font-medium text-foreground">Favorites</div>
                        {tournament.odds.winner.slice(0, 2).map((player, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="font-medium text-foreground">{player.player}</span>
                            <span className="font-mono text-foreground">{formatOdds(player.odds)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-6">
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-3xl font-bold text-foreground">Upcoming Tournaments</h2>
              <p className="text-muted-foreground">
                All scheduled PGA Tour events with dates, venues, and early betting lines.
              </p>
            </div>

            <div className="space-y-4">
              {upcomingTournaments.map((tournament) => (
                <Card key={tournament.id} className="bg-card border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-foreground">
                            {new Date(tournament.startDate).getDate()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(tournament.startDate).toLocaleDateString('en-US', { month: 'short' })}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-foreground">{tournament.name}</h3>
                            {tournament.major && (
                              <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                                <Trophy className="h-3 w-3 mr-1" />
                                Major
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {tournament.venue}, {tournament.location}
                            </div>
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-1" />
                              {formatPurse(tournament.purse)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={getStatusColor(tournament.status)}>
                          {tournament.status}
                        </Badge>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="odds" className="space-y-6">
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-3xl font-bold text-foreground">Tournament Odds</h2>
              <p className="text-muted-foreground">
                Live betting odds for tournament winners, top finishes, and special markets.
              </p>
            </div>

            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Live Odds Coming Soon</h3>
                <p className="text-muted-foreground mb-6">
                  Real-time golf betting odds and markets will be available here.
                </p>
                <Badge variant="secondary">Feature in Development</Badge>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}