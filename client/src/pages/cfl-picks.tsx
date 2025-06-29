import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  TrendingUp, 
  Target, 
  Clock, 
  Star,
  Trophy,
  Zap,
  Users,
  ArrowRight,
  Bell
} from "lucide-react";
import { format } from "date-fns";

interface CFLPick {
  id: number;
  date: string;
  gameId: string;
  pickType: string;
  selection: string;
  odds: number;
  reasoning: string;
  confidence: number;
  expectedValue: number;
  awayTeam: string;
  homeTeam: string;
  gameTime: string;
  status: "pending" | "won" | "lost";
}

function PickCard({ pick }: { pick: CFLPick }) {
  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (confidence >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "won": return "bg-green-100 text-green-800 border-green-200";
      case "lost": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {pick.gameTime}
            </div>
            <Badge variant="outline" className={getStatusColor(pick.status)}>
              {pick.status.charAt(0).toUpperCase() + pick.status.slice(1)}
            </Badge>
          </div>
          <Badge variant="outline" className={getConfidenceColor(pick.confidence)}>
            {pick.confidence}% Confidence
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-foreground">
            {pick.awayTeam} @ {pick.homeTeam}
          </CardTitle>
          <div className="text-right">
            <div className="text-sm text-muted-foreground uppercase tracking-wide">
              {pick.pickType}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Pick Details */}
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">Pick</span>
              </div>
              <span className="font-mono text-sm text-muted-foreground">
                {formatOdds(pick.odds)}
              </span>
            </div>
            <p className="text-lg font-semibold text-foreground">
              {pick.selection}
            </p>
          </div>

          {/* Analysis */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">AI Analysis</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {pick.reasoning}
            </p>
          </div>

          {/* Expected Value */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-foreground">Expected Value</span>
            </div>
            <span className={`text-sm font-semibold ${
              pick.expectedValue > 0 ? "text-green-600" : "text-red-600"
            }`}>
              {pick.expectedValue > 0 ? "+" : ""}{pick.expectedValue.toFixed(1)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CFLPicks() {
  const today = format(new Date(), "yyyy-MM-dd");

  // Mock CFL picks data - in production this would come from an API
  const { data: picks = [], isLoading } = useQuery({
    queryKey: ['/api/cfl/daily-picks', today],
    queryFn: () => Promise.resolve([
      {
        id: 1,
        date: today,
        gameId: "cfl_1",
        pickType: "moneyline",
        selection: "Calgary Stampeders",
        odds: 150,
        reasoning: "Calgary's strong rushing attack should dominate against Toronto's weak run defense. The Stampeders have averaged 142 rushing yards per game this season while the Argonauts allow 156 yards on the ground. Weather conditions favor the ground game, and Calgary's offensive line is healthier with key players returning from injury.",
        confidence: 78,
        expectedValue: 12.3,
        awayTeam: "Calgary Stampeders",
        homeTeam: "Toronto Argonauts",
        gameTime: "7:30 PM ET",
        status: "pending"
      },
      {
        id: 2,
        date: today,
        gameId: "cfl_2",
        pickType: "total",
        selection: "Under 52.0",
        odds: -115,
        reasoning: "Expect a defensive battle in Saskatchewan with strong winds forecasted. Both teams have struggled offensively in recent weeks, and the Roughriders' home field advantage is significant in late-season games. BC's passing game has been inconsistent on the road, while Saskatchewan's defense is allowing just 18.2 points per game at home.",
        confidence: 65,
        expectedValue: 8.7,
        awayTeam: "BC Lions",
        homeTeam: "Saskatchewan Roughriders",
        gameTime: "9:00 PM ET",
        status: "pending"
      },
      {
        id: 3,
        date: today,
        gameId: "cfl_3",
        pickType: "spread",
        selection: "Edmonton Elks +7.5",
        odds: -110,
        reasoning: "Edmonton has been competitive as road underdogs this season, covering 4 of their last 6 games when getting more than a touchdown. Winnipeg tends to play down to competition at home, and this large spread creates value. The Elks' defense has improved significantly over the past month.",
        confidence: 82,
        expectedValue: 15.2,
        awayTeam: "Edmonton Elks",
        homeTeam: "Winnipeg Blue Bombers",
        gameTime: "8:00 PM ET",
        status: "pending"
      }
    ] as CFLPick[])
  });

  const highConfidencePicks = picks.filter(pick => pick.confidence >= 75);
  const avgConfidence = picks.length > 0 
    ? picks.reduce((sum, pick) => sum + pick.confidence, 0) / picks.length 
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
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
          <h1 className="text-2xl font-bold text-foreground">CFL Daily Picks</h1>
          <p className="text-muted-foreground">AI-powered betting recommendations for today's games</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Picks</p>
                <p className="text-xl font-bold text-foreground">{picks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Star className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">High Confidence</p>
                <p className="text-xl font-bold text-foreground">{highConfidencePicks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Confidence</p>
                <p className="text-xl font-bold text-foreground">{avgConfidence.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Trophy className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Season Record</p>
                <p className="text-xl font-bold text-foreground">--</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Picks List */}
      <div className="space-y-4">
        {picks.length > 0 ? (
          picks.map(pick => (
            <PickCard key={pick.id} pick={pick} />
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Picks Available</h3>
              <p className="text-muted-foreground text-center mb-4">
                No CFL picks have been generated for today. Check back later for AI analysis.
              </p>
              <Button variant="outline">
                View Previous Picks
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Coming Soon Notice */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 text-center">
          <Trophy className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Enhanced CFL Analysis Coming Soon</h3>
          <p className="text-muted-foreground mb-4">
            We're developing advanced CFL betting models including weather analysis, 
            injury reports, and historical performance tracking for the 2025 season.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline">
              <Bell className="h-4 w-4 mr-2" />
              Get Notified
            </Button>
            <Button>
              Upgrade for Full Access
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}