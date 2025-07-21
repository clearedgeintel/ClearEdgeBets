import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Target, TrendingUp, DollarSign, Brain, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface MLBPick {
  id: string;
  gameId: string;
  pickType: 'moneyline' | 'spread' | 'total';
  team?: string;
  selection: string;
  confidence: number;
  odds: string;
  reasoning: string;
  value: number;
}

interface DailyPick {
  id: number;
  date: string;
  gameId: string;
  team: string;
  pickType: string;
  selection: string;
  odds: string;
  confidence: number;
  reasoning: string;
  status: 'pending' | 'won' | 'lost' | 'push';
}

interface AuthenticPicksResponse {
  success: boolean;
  data: {
    picks: MLBPick[];
    date: string;
    totalPicks: number;
    averageConfidence: number;
  };
  source: string;
  lastUpdated: string;
}

export default function UnifiedPicks() {
  const { data: authenticPicks, isLoading: loadingAuthentic, refetch: refetchAuthentic } = useQuery<AuthenticPicksResponse>({
    queryKey: ['/api/mlb/picks/authentic'],
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: aiPicks, isLoading: loadingAI, refetch: refetchAI } = useQuery<DailyPick[]>({
    queryKey: ['/api/daily-picks'],
    refetchInterval: 5 * 60 * 1000,
  });

  const getPickTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'moneyline':
        return <Target className="h-4 w-4" />;
      case 'spread':
      case 'runline':
        return <TrendingUp className="h-4 w-4" />;
      case 'total':
      case 'over':
      case 'under':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return { variant: "default" as const, label: "High", color: "text-green-600" };
    if (confidence >= 60) return { variant: "secondary" as const, label: "Medium", color: "text-yellow-600" };
    return { variant: "outline" as const, label: "Low", color: "text-gray-600" };
  };

  const refreshAll = () => {
    refetchAuthentic();
    refetchAI();
  };

  const isLoading = loadingAuthentic || loadingAI;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-lg">Loading today's picks...</span>
        </div>
      </div>
    );
  }

  const authenticPicksData = authenticPicks?.data?.picks || [];
  const aiPicksData = aiPicks || [];
  const totalPicks = authenticPicksData.length + aiPicksData.length;
  const avgConfidence = totalPicks > 0 ? 
    Math.round((
      [...authenticPicksData.map(p => p.confidence), ...aiPicksData.map(p => p.confidence)]
        .reduce((sum, conf) => sum + conf, 0)
    ) / totalPicks) : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">MLB Betting Intelligence</h1>
          <p className="text-muted-foreground">
            Expert picks and AI analysis combined
          </p>
        </div>
        <Button onClick={refreshAll} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh All
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{totalPicks}</p>
                <p className="text-sm text-muted-foreground">Total Picks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{authenticPicksData.length}</p>
                <p className="text-sm text-muted-foreground">Expert Picks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{aiPicksData.length}</p>
                <p className="text-sm text-muted-foreground">AI Picks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{avgConfidence}%</p>
                <p className="text-sm text-muted-foreground">Avg Confidence</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Picks Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Picks ({totalPicks})</TabsTrigger>
          <TabsTrigger value="expert">Expert Picks ({authenticPicksData.length})</TabsTrigger>
          <TabsTrigger value="ai">AI Picks ({aiPicksData.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Combined Picks - Today's Best Opportunities</CardTitle>
              <CardDescription>Expert analysis and AI recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Expert Picks Section */}
                {authenticPicksData.length > 0 && (
                  <>
                    <div className="flex items-center space-x-2 mb-3">
                      <User className="h-5 w-5 text-orange-500" />
                      <h3 className="text-lg font-semibold">Expert Picks</h3>
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        {authenticPicks?.source}
                      </Badge>
                    </div>
                    {authenticPicksData.map((pick) => {
                      const confidenceBadge = getConfidenceBadge(pick.confidence);
                      return (
                        <div key={pick.id} className="p-4 border rounded-lg space-y-3 bg-orange-50/30 border-orange-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {getPickTypeIcon(pick.pickType)}
                              <div>
                                <h4 className="font-medium">{pick.selection}</h4>
                                <p className="text-sm text-muted-foreground capitalize">
                                  {pick.pickType} • {pick.gameId}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={confidenceBadge.variant}>
                                {confidenceBadge.label} ({pick.confidence}%)
                              </Badge>
                              <Badge variant="outline">{pick.odds}</Badge>
                              {pick.value > 0 && (
                                <Badge variant="default">+{pick.value}% EV</Badge>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">{pick.reasoning}</p>
                          </div>
                        </div>
                      );
                    })}
                    <Separator className="my-6" />
                  </>
                )}

                {/* AI Picks Section */}
                {aiPicksData.length > 0 && (
                  <>
                    <div className="flex items-center space-x-2 mb-3">
                      <Brain className="h-5 w-5 text-purple-500" />
                      <h3 className="text-lg font-semibold">AI Analysis Picks</h3>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        ClearEdge AI
                      </Badge>
                    </div>
                    {aiPicksData.slice(0, 6).map((pick) => {
                      const confidenceBadge = getConfidenceBadge(pick.confidence);
                      return (
                        <div key={`ai_${pick.id}`} className="p-4 border rounded-lg space-y-3 bg-purple-50/30 border-purple-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {getPickTypeIcon(pick.pickType)}
                              <div>
                                <h4 className="font-medium">{pick.team} {pick.selection}</h4>
                                <p className="text-sm text-muted-foreground capitalize">
                                  {pick.pickType} • {pick.gameId}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={confidenceBadge.variant}>
                                {confidenceBadge.label} ({pick.confidence}%)
                              </Badge>
                              <Badge variant="outline">{pick.odds}</Badge>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">{pick.reasoning}</p>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {totalPicks === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-4" />
                    <p>No picks available for today</p>
                    <p className="text-sm">Check back later for expert recommendations</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expert">
          <Card>
            <CardHeader>
              <CardTitle>Expert Picks</CardTitle>
              <CardDescription>Professional handicapper recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {authenticPicksData.map((pick) => {
                  const confidenceBadge = getConfidenceBadge(pick.confidence);
                  return (
                    <div key={pick.id} className="p-4 border rounded-lg space-y-3 bg-orange-50/30 border-orange-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getPickTypeIcon(pick.pickType)}
                          <div>
                            <h4 className="font-medium">{pick.selection}</h4>
                            <p className="text-sm text-muted-foreground capitalize">
                              {pick.pickType} • {pick.gameId}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={confidenceBadge.variant}>
                            {confidenceBadge.label} ({pick.confidence}%)
                          </Badge>
                          <Badge variant="outline">{pick.odds}</Badge>
                          {pick.value > 0 && (
                            <Badge variant="default">+{pick.value}% EV</Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{pick.reasoning}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>AI Generated Picks</CardTitle>
              <CardDescription>Machine learning analysis and recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiPicksData.slice(0, 6).map((pick) => {
                  const confidenceBadge = getConfidenceBadge(pick.confidence);
                  return (
                    <div key={`ai_${pick.id}`} className="p-4 border rounded-lg space-y-3 bg-purple-50/30 border-purple-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getPickTypeIcon(pick.pickType)}
                          <div>
                            <h4 className="font-medium">{pick.team} {pick.selection}</h4>
                            <p className="text-sm text-muted-foreground capitalize">
                              {pick.pickType} • {pick.gameId}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={confidenceBadge.variant}>
                            {confidenceBadge.label} ({pick.confidence}%)
                          </Badge>
                          <Badge variant="outline">{pick.odds}</Badge>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{pick.reasoning}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Data Source Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-orange-500" />
                <span>Expert: {authenticPicks?.source || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Brain className="h-4 w-4 text-purple-500" />
                <span>AI: ClearEdge Analytics</span>
              </div>
            </div>
            <div>
              Updated: {new Date().toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}