import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Filter, Search, Clock, MapPin, Users, Trophy, ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface CFLGame {
  id: number;
  gameId: string;
  awayTeam: string;
  homeTeam: string;
  awayTeamCode: string;
  homeTeamCode: string;
  gameTime: string;
  venue: string;
  status: string;
  week: number;
  season: string;
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
}

function CFLGameCard({ game }: { game: CFLGame }) {
  const moneylineOdds = game.odds.find(o => o.market === "h2h");
  const totalOdds = game.odds.find(o => o.market === "totals");
  const spreadOdds = game.odds.find(o => o.market === "spreads");

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const formatGameTime = (gameTime: string) => {
    const date = new Date(gameTime);
    const time = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      timeZoneName: 'short'
    });
    return time;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center mb-1">
                  <span className="text-white text-xs font-bold">{game.awayTeamCode}</span>
                </div>
                <p className="font-semibold text-sm text-foreground">{game.awayTeam}</p>
                <p className="text-xs text-muted-foreground">Away</p>
              </div>
              <span className="text-muted-foreground text-lg">@</span>
              <div className="text-center">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mb-1">
                  <span className="text-white text-xs font-bold">{game.homeTeamCode}</span>
                </div>
                <p className="font-semibold text-sm text-foreground">{game.homeTeam}</p>
                <p className="text-xs text-muted-foreground">Home</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm font-medium mb-1">
              <Clock className="h-3 w-3" />
              {formatGameTime(game.gameTime)}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <MapPin className="h-3 w-3" />
              {game.venue}
            </div>
            <Badge variant="outline" className="text-xs">
              Week {game.week}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Moneyline */}
          {moneylineOdds && (
            <div className="bg-muted/50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-center mb-2">Moneyline</h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between h-8"
                >
                  <span className="text-xs">{game.awayTeamCode}</span>
                  <span className="text-xs font-mono">
                    {moneylineOdds.awayOdds ? formatOdds(moneylineOdds.awayOdds) : 'N/A'}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between h-8"
                >
                  <span className="text-xs">{game.homeTeamCode}</span>
                  <span className="text-xs font-mono">
                    {moneylineOdds.homeOdds ? formatOdds(moneylineOdds.homeOdds) : 'N/A'}
                  </span>
                </Button>
              </div>
            </div>
          )}

          {/* Spread */}
          {spreadOdds && (
            <div className="bg-muted/50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-center mb-2">Point Spread</h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between h-8"
                >
                  <span className="text-xs">{spreadOdds.awaySpread || 'N/A'}</span>
                  <span className="text-xs font-mono">
                    {spreadOdds.awaySpreadOdds ? formatOdds(spreadOdds.awaySpreadOdds) : 'N/A'}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between h-8"
                >
                  <span className="text-xs">{spreadOdds.homeSpread || 'N/A'}</span>
                  <span className="text-xs font-mono">
                    {spreadOdds.homeSpreadOdds ? formatOdds(spreadOdds.homeSpreadOdds) : 'N/A'}
                  </span>
                </Button>
              </div>
            </div>
          )}

          {/* Total */}
          {totalOdds && (
            <div className="bg-muted/50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-center mb-2">Total Points</h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between h-8"
                >
                  <span className="text-xs">Over {totalOdds.total || 'N/A'}</span>
                  <span className="text-xs font-mono">
                    {totalOdds.overOdds ? formatOdds(totalOdds.overOdds) : 'N/A'}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between h-8"
                >
                  <span className="text-xs">Under {totalOdds.total || 'N/A'}</span>
                  <span className="text-xs font-mono">
                    {totalOdds.underOdds ? formatOdds(totalOdds.underOdds) : 'N/A'}
                  </span>
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              <Trophy className="h-3 w-3 mr-1" />
              CFL Analysis Coming Soon
            </Badge>
            <Button variant="ghost" size="sm" className="text-xs">
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CFLGames() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWeek, setSelectedWeek] = useState<string>("all");
  const [selectedDivision, setSelectedDivision] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Fetch real CFL games data from API
  const { data: games = [], isLoading } = useQuery<CFLGame[]>({
    queryKey: ['/api/cfl/games', selectedDate.toISOString().split('T')[0]],
    enabled: true
  });

  const filteredGames = games.filter(game => {
    const matchesSearch = game.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         game.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         game.venue.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesWeek = selectedWeek === "all" || game.week.toString() === selectedWeek;
    
    return matchesSearch && matchesWeek;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CFL Games</h1>
          <p className="text-muted-foreground">
            Canadian Football League matchups for {isSameDay(selectedDate, new Date()) ? "today" : format(selectedDate, "MMMM d")}
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
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teams, venues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Week" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Weeks</SelectItem>
                <SelectItem value="1">Week 1</SelectItem>
                <SelectItem value="2">Week 2</SelectItem>
                <SelectItem value="3">Week 3</SelectItem>
                <SelectItem value="4">Week 4</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedDivision} onValueChange={setSelectedDivision}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Division" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Divisions</SelectItem>
                <SelectItem value="east">East Division</SelectItem>
                <SelectItem value="west">West Division</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Games Grid */}
      <div className="grid gap-6">
        {filteredGames.length > 0 ? (
          filteredGames.map(game => (
            <CFLGameCard key={game.id} game={game} />
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Games Found</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm || selectedWeek !== "all" || selectedDivision !== "all"
                  ? "No CFL games match your current filters. Try adjusting your search criteria."
                  : `No CFL games are scheduled for ${format(selectedDate, "MMMM d, yyyy")}`}
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
        )}
      </div>

      {/* Coming Soon Notice */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 text-center">
          <Trophy className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Full CFL Coverage Coming Soon</h3>
          <p className="text-muted-foreground mb-4">
            We're working on comprehensive CFL betting intelligence with AI analysis, 
            player props, and advanced statistics for the 2025 season.
          </p>
          <Button variant="outline">
            Get Notified
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}