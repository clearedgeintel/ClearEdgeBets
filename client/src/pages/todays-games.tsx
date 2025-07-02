import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import GameCard from "@/components/game-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Calendar, BarChart3, TrendingUp, Clock, ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

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

export default function TodaysGames() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("time");
  const [filterBy, setFilterBy] = useState("all");
  const [selectedDate, setSelectedDate] = useState(new Date());



  const { data: games = [], isLoading } = useQuery<Game[]>({
    queryKey: ["/api/games", format(selectedDate, "yyyy-MM-dd")],
    queryFn: async () => {
      const dateParam = format(selectedDate, "yyyy-MM-dd");
      const response = await fetch(`/api/games?date=${dateParam}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Filter and sort games
  const filteredGames = games
    .filter(game => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          game.awayTeam.toLowerCase().includes(searchLower) ||
          game.homeTeam.toLowerCase().includes(searchLower) ||
          game.awayTeamCode.toLowerCase().includes(searchLower) ||
          game.homeTeamCode.toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
    .filter(game => {
      if (filterBy === "analyzed") return game.aiSummary;
      if (filterBy === "high-confidence") return game.aiSummary && game.aiSummary.confidence >= 75;
      if (filterBy === "value-plays") return game.aiSummary && game.aiSummary.valuePlays.length > 0;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "time") {
        // Convert time strings like "7:10 PM" to comparable values for sorting
        const parseTime = (timeStr: string): number => {
          if (!timeStr) return 0;
          const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
          if (!match) return 0;
          let hours = parseInt(match[1]);
          const minutes = parseInt(match[2]);
          const period = match[3].toUpperCase();
          if (period === 'AM' && hours === 12) hours = 0;
          if (period === 'PM' && hours !== 12) hours += 12;
          return hours * 60 + minutes;
        };
        
        return parseTime(a.gameTime) - parseTime(b.gameTime);
      }
      if (sortBy === "confidence" && a.aiSummary && b.aiSummary) {
        return b.aiSummary.confidence - a.aiSummary.confidence;
      }
      return 0;
    });

  const stats = {
    totalGames: games.length,
    aiAnalyzed: games.filter(g => g.aiSummary).length,
    avgConfidence: games.filter(g => g.aiSummary).reduce((acc, g) => acc + (g.aiSummary?.confidence || 0), 0) / games.filter(g => g.aiSummary).length || 0,
    valuePlays: games.reduce((acc, g) => acc + (g.aiSummary?.valuePlays.length || 0), 0)
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-20 bg-muted rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Page Header */}
      <div className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3">
                <Calendar className="h-8 w-8 text-primary" />
                <span>MLB Games</span>
              </h1>
              <p className="text-muted-foreground mt-2">
                Live odds, AI analysis, and betting insights for {isSameDay(selectedDate, new Date()) ? "today's" : format(selectedDate, "MMMM d")} matchups
              </p>

              {/* Date Navigation */}
              <div className="flex items-center space-x-4 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                  className="flex items-center space-x-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </Button>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[280px] justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                  className="flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDate(new Date())}
                  className="text-primary"
                >
                  Today
                </Button>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="mt-6 lg:mt-0 lg:ml-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{stats.totalGames}</div>
                  <div className="text-sm text-muted-foreground">Games</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">{stats.aiAnalyzed}</div>
                  <div className="text-sm text-muted-foreground">AI Analyzed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{Math.round(stats.avgConfidence)}%</div>
                  <div className="text-sm text-muted-foreground">Avg Confidence</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">{stats.valuePlays}</div>
                  <div className="text-sm text-muted-foreground">Value Plays</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search teams..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time">Game Time</SelectItem>
                    <SelectItem value="confidence">Confidence</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Filter by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Games</SelectItem>
                    <SelectItem value="analyzed">AI Analyzed</SelectItem>
                    <SelectItem value="high-confidence">High Confidence</SelectItem>
                    <SelectItem value="value-plays">Value Plays</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Active Filters */}
            <div className="flex flex-wrap gap-2 mt-4">
              {searchTerm && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: "{searchTerm}"
                  <button onClick={() => setSearchTerm("")} className="ml-1 hover:text-destructive">×</button>
                </Badge>
              )}
              {filterBy !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Filter: {filterBy.replace("-", " ")}
                  <button onClick={() => setFilterBy("all")} className="ml-1 hover:text-destructive">×</button>
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Games Grid */}
        {filteredGames.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No games found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterBy !== "all" 
                  ? "Try adjusting your search or filters" 
                  : `No MLB games are scheduled for ${format(selectedDate, "MMMM d, yyyy")}`}
              </p>
              {!isSameDay(selectedDate, new Date()) && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setSelectedDate(new Date())}
                >
                  View Today's Games
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}