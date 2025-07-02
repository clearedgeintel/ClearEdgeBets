import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Flame, AlertTriangle, CheckCircle, Target } from "lucide-react";

interface HotTrend {
  id: string;
  title: string;
  description: string;
  percentage: number;
  games: number;
  category: "team" | "total" | "weather" | "venue" | "streak";
  trend: "hot" | "cold" | "neutral";
  confidence: number;
  roi: number;
  examples: Array<{text: string; date: string}>;
  lastUpdated: string;
}

export default function HotTrends() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: trends, isLoading } = useQuery({
    queryKey: ['/api/hot-trends', selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams({
        category: selectedCategory
      });
      const response = await fetch(`/api/hot-trends?${params}`);
      if (!response.ok) throw new Error('Failed to fetch hot trends');
      const data = await response.json();
      return data as HotTrend[];
    }
  });

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'hot': return <Flame className="h-4 w-4 text-red-500" />;
      case 'cold': return <TrendingDown className="h-4 w-4 text-blue-500" />;
      default: return <TrendingUp className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'hot': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'cold': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 80) return { label: "Very High", color: "text-green-600" };
    if (confidence >= 60) return { label: "High", color: "text-blue-600" };
    if (confidence >= 40) return { label: "Medium", color: "text-yellow-600" };
    return { label: "Low", color: "text-red-600" };
  };

  const filteredTrends = trends?.filter(trend => 
    selectedCategory === "all" || trend.category === selectedCategory
  ) || [];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Hot Trends</h1>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded mb-4"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Flame className="h-8 w-8 text-orange-500" />
            Hot Trends
          </h1>
          <p className="text-muted-foreground mt-2">
            Discover trending patterns and statistical edges in MLB betting
          </p>
        </div>
        <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
          Elite Feature
        </Badge>
      </div>

      {/* Category Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">All Trends</TabsTrigger>
              <TabsTrigger value="team">Team Trends</TabsTrigger>
              <TabsTrigger value="total">Total Trends</TabsTrigger>
              <TabsTrigger value="weather">Weather</TabsTrigger>
              <TabsTrigger value="venue">Venue</TabsTrigger>
              <TabsTrigger value="streak">Streaks</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Trends Grid */}
      <div className="grid gap-6">
        {filteredTrends.map((trend) => {
          const confidenceInfo = getConfidenceLevel(trend.confidence);
          
          return (
            <Card key={trend.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getTrendIcon(trend.trend)}
                    <div>
                      <CardTitle className="text-lg">{trend.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{trend.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={getTrendColor(trend.trend)}>
                      {trend.trend.toUpperCase()}
                    </Badge>
                    <span className={`text-sm font-medium ${confidenceInfo.color}`}>
                      {confidenceInfo.label} Confidence
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Statistics */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Success Rate</span>
                        <span className="text-lg font-bold">{trend.percentage}%</span>
                      </div>
                      <Progress value={trend.percentage} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Sample Size:</span>
                        <p className="font-medium">{trend.games} games</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">ROI:</span>
                        <p className={`font-medium ${trend.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {trend.roi >= 0 ? '+' : ''}{trend.roi.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Examples */}
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium mb-3">Recent Examples:</h4>
                    <div className="space-y-2">
                      {trend.examples.map((example, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                            <span>{typeof example === 'string' ? example : example.text}</span>
                          </div>
                          {typeof example === 'object' && example.date && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(example.date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Last updated: {new Date(trend.lastUpdated).toLocaleString('en-US', {
                            timeZone: 'America/New_York',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                            timeZoneName: 'short'
                          })}
                        </span>
                        <Button size="sm" variant="outline">
                          <Target className="h-3 w-3 mr-1" />
                          Find Similar Bets
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTrends.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Flame className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No trends found</h3>
            <p className="text-muted-foreground">
              Try selecting a different category to view trending patterns.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}