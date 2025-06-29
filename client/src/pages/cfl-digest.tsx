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
  FileText,
  ArrowRight,
  Users,
  BarChart3,
  Activity
} from "lucide-react";
import { format } from "date-fns";

interface DigestSection {
  title: string;
  content: string;
  confidence: number;
  category: "games" | "weather" | "injuries" | "trends" | "betting";
}

interface CFLDigest {
  id: number;
  date: string;
  title: string;
  summary: string;
  sections: DigestSection[];
  keyGames: Array<{
    id: string;
    matchup: string;
    time: string;
    spotlight: string;
  }>;
  trendingTopics: Array<{
    topic: string;
    impact: "high" | "medium" | "low";
    description: string;
  }>;
  weatherAlerts: Array<{
    city: string;
    conditions: string;
    impact: string;
  }>;
}

function DigestSectionCard({ section }: { section: DigestSection }) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "games": return <Trophy className="h-4 w-4" />;
      case "weather": return <Activity className="h-4 w-4" />;
      case "injuries": return <Users className="h-4 w-4" />;
      case "trends": return <TrendingUp className="h-4 w-4" />;
      case "betting": return <Target className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "games": return "text-blue-600 bg-blue-50 border-blue-200";
      case "weather": return "text-green-600 bg-green-50 border-green-200";
      case "injuries": return "text-red-600 bg-red-50 border-red-200";
      case "trends": return "text-purple-600 bg-purple-50 border-purple-200";
      case "betting": return "text-orange-600 bg-orange-50 border-orange-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${getCategoryColor(section.category)}`}>
              {getCategoryIcon(section.category)}
            </div>
            <CardTitle className="text-lg text-foreground">{section.title}</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {section.confidence}% Confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {section.content}
        </p>
      </CardContent>
    </Card>
  );
}

export default function CFLDigest() {
  const today = format(new Date(), "yyyy-MM-dd");

  // Mock CFL digest data - in production this would come from an API
  const { data: digest, isLoading } = useQuery({
    queryKey: ['/api/cfl/digest', today],
    queryFn: () => Promise.resolve({
      id: 1,
      date: today,
      title: "CFL Week 1 Spotlight: Season Openers Set the Stage",
      summary: "The 2025 CFL season kicks off with compelling matchups across Canada. Key storylines include Calgary's revamped offense, Toronto's new defensive coordinator impact, and weather concerns in several markets that could significantly affect betting lines.",
      sections: [
        {
          title: "Featured Game: Stampeders @ Argonauts",
          content: "Calgary travels to Toronto in what promises to be a high-scoring affair. The Stampeders' new offensive coordinator has implemented a more aggressive passing game, while Toronto's defense showed vulnerabilities in the preseason. The total has moved from 47.5 to 49.5, indicating sharp money on the over. Weather conditions are ideal with dome environment.",
          confidence: 85,
          category: "games"
        },
        {
          title: "Weather Impact: Saskatchewan Home Opener",
          content: "Strong winds (25+ mph) and potential rain showers expected in Regina for the Roughriders' home opener against BC. Historical data shows under bets have hit 73% of the time in similar conditions at Mosaic Stadium. Both teams struggled with passing games in windy conditions during 2024 season.",
          confidence: 78,
          category: "weather"
        },
        {
          title: "Injury Report: Key Players to Monitor",
          content: "Edmonton's starting quarterback remains questionable with a minor shoulder issue, while Winnipeg's top receiver is dealing with a hamstring concern. Both situations could significantly impact spreads if players are ruled out closer to game time. Manitoba's offensive line depth will be tested early.",
          confidence: 72,
          category: "injuries"
        },
        {
          title: "Betting Trends: Sharp Money Movement",
          content: "Professional bettors are showing strong interest in road underdogs this week, with 67% of sharp money on away teams getting points. Historical analysis shows Week 1 often provides value on underdogs as public perception hasn't adjusted to offseason changes. Line movement suggests respected money on Calgary +3.5.",
          confidence: 81,
          category: "betting"
        }
      ],
      keyGames: [
        {
          id: "cfl_1",
          matchup: "Calgary @ Toronto",
          time: "7:30 PM ET",
          spotlight: "High-powered offenses clash in season opener"
        },
        {
          id: "cfl_2",
          matchup: "BC @ Saskatchewan",
          time: "9:00 PM ET",
          spotlight: "Weather will be a major factor"
        },
        {
          id: "cfl_3",
          matchup: "Edmonton @ Winnipeg",
          time: "8:00 PM ET",
          spotlight: "Injury concerns for both teams"
        }
      ],
      trendingTopics: [
        {
          topic: "New CFL Rules Impact",
          impact: "high",
          description: "Several rule changes could affect scoring and betting totals"
        },
        {
          topic: "Roster Turnover",
          impact: "medium",
          description: "High player movement between teams creates uncertainty"
        },
        {
          topic: "Stadium Renovations",
          impact: "low",
          description: "Minor field changes at select venues"
        }
      ],
      weatherAlerts: [
        {
          city: "Regina",
          conditions: "Windy, 25+ mph",
          impact: "Passing games affected, favor under bets"
        },
        {
          city: "Calgary",
          conditions: "Clear, 72°F",
          impact: "Ideal conditions for high-scoring game"
        }
      ]
    } as CFLDigest)
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!digest) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Digest Available</h3>
          <p className="text-muted-foreground text-center">
            The daily CFL digest hasn't been generated yet. Check back later for comprehensive analysis.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CFL Daily Digest</h1>
          <p className="text-muted-foreground">Comprehensive analysis and insights for today's action</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </span>
        </div>
      </div>

      {/* Main Digest */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl text-foreground">{digest.title}</CardTitle>
          <p className="text-muted-foreground">{digest.summary}</p>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Trophy className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Key Games</p>
                <p className="text-xl font-bold text-foreground">{digest.keyGames.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Activity className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Weather Alerts</p>
                <p className="text-xl font-bold text-foreground">{digest.weatherAlerts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trending Topics</p>
                <p className="text-xl font-bold text-foreground">{digest.trendingTopics.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Sections */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Detailed Analysis</h2>
        <div className="grid gap-4">
          {digest.sections.map((section, index) => (
            <DigestSectionCard key={index} section={section} />
          ))}
        </div>
      </div>

      {/* Key Games */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Today's Key Games</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {digest.keyGames.map(game => (
              <div key={game.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-semibold text-foreground">{game.matchup}</p>
                  <p className="text-sm text-muted-foreground">{game.spotlight}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{game.time}</p>
                  <Button variant="ghost" size="sm" className="text-xs">
                    View Analysis
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trending Topics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Trending Topics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {digest.trendingTopics.map((topic, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge 
                    variant="outline" 
                    className={
                      topic.impact === "high" 
                        ? "border-red-200 text-red-600"
                        : topic.impact === "medium"
                          ? "border-yellow-200 text-yellow-600"
                          : "border-green-200 text-green-600"
                    }
                  >
                    {topic.impact}
                  </Badge>
                  <div>
                    <p className="font-medium text-foreground">{topic.topic}</p>
                    <p className="text-sm text-muted-foreground">{topic.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon Notice */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 text-center">
          <Zap className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Enhanced CFL Intelligence Coming Soon</h3>
          <p className="text-muted-foreground mb-4">
            We're developing comprehensive CFL analysis including advanced metrics, 
            historical performance data, and real-time injury tracking for the 2025 season.
          </p>
          <Button>
            Upgrade for Full Access
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}