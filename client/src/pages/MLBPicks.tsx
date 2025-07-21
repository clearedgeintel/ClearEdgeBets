import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Target, TrendingUp, DollarSign, Brain } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface MLBPick {
  id: string;
  gameId: string;
  pickType: 'moneyline' | 'spread' | 'total';
  team?: string;
  selection: string;
  confidence: number;
  odds: number;
  reasoning: string;
  value: number;
}

interface MLBPicksResponse {
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

export default function MLBPicks() {
  const { data: picksData, isLoading, refetch, isError } = useQuery<MLBPicksResponse>({
    queryKey: ['/api/mlb/picks/authentic'],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const getPickTypeIcon = (type: string) => {
    switch (type) {
      case 'moneyline':
        return <Target className="h-4 w-4" />;
      case 'spread':
        return <TrendingUp className="h-4 w-4" />;
      case 'total':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return { variant: "default" as const, label: "High" };
    if (confidence >= 60) return { variant: "secondary" as const, label: "Medium" };
    return { variant: "outline" as const, label: "Low" };
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-lg">Loading authentic MLB picks...</span>
        </div>
      </div>
    );
  }

  if (isError || !picksData?.success) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Brain className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Unable to Load Picks</h3>
            <p className="text-muted-foreground text-center mb-4">
              The authentic MLB picks API is currently unavailable. This could be due to API limits or connectivity issues.
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data, source, lastUpdated } = picksData;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Authentic MLB Picks</h1>
          <p className="text-muted-foreground">
            Real betting picks powered by {source}
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{data.totalPicks}</p>
                <p className="text-sm text-muted-foreground">Total Picks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{Math.round(data.averageConfidence)}%</p>
                <p className="text-sm text-muted-foreground">Avg Confidence</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{data.picks.filter(p => p.confidence >= 75).length}</p>
                <p className="text-sm text-muted-foreground">High Confidence</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{data.picks.filter(p => p.value > 0).length}</p>
                <p className="text-sm text-muted-foreground">Positive EV</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Picks List */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Expert Picks</CardTitle>
          <CardDescription>
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.picks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4" />
              <p>No picks available for today</p>
              <p className="text-sm">Check back later for expert recommendations</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.picks.map((pick, index) => {
                const confidenceBadge = getConfidenceBadge(pick.confidence);
                return (
                  <div key={pick.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getPickTypeIcon(pick.pickType)}
                        <div>
                          <h3 className="font-medium">{pick.selection}</h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {pick.pickType} • Game ID: {pick.gameId}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={confidenceBadge.variant}>
                          {confidenceBadge.label} ({pick.confidence}%)
                        </Badge>
                        <Badge variant="outline">
                          {formatOdds(pick.odds)}
                        </Badge>
                        {pick.value > 0 && (
                          <Badge variant="default">
                            +{pick.value}% EV
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="text-sm font-medium mb-1">Expert Analysis</h4>
                      <p className="text-sm text-muted-foreground">{pick.reasoning}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Source Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span>Data provided by {source}</span>
            </div>
            <div>
              Updated: {new Date(lastUpdated).toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}