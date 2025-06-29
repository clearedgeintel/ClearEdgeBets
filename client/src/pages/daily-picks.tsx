import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatOdds, formatPercentage } from "@/lib/utils";
import { Sparkles, TrendingUp, Target, BarChart3 } from "lucide-react";
import { useBettingSlip } from "@/contexts/betting-slip-context";
import { useToast } from "@/hooks/use-toast";

interface DailyPick {
  id: number;
  date: string;
  gameId: string;
  pickType: string;
  selection: string;
  odds: number;
  confidence: number;
  reasoning: string;
  expectedValue: string;
  status: string;
  result?: string | null;
  createdAt: Date | null;
}

export default function DailyPicks() {
  const queryClient = useQueryClient();
  const { addBet } = useBettingSlip();
  const { toast } = useToast();

  const {
    data: picks,
    isLoading: picksLoading,
    error: picksError,
  } = useQuery<DailyPick[]>({
    queryKey: ["/api/daily-picks"],
  });

  const generatePicksMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/daily-picks/generate");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-picks"] });
      toast({
        title: "Daily picks generated",
        description: "AI has analyzed today's games and created new betting recommendations.",
      });
    },
    onError: () => {
      toast({
        title: "Generation failed",
        description: "Unable to generate daily picks. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddToBets = (pick: DailyPick) => {
    addBet({
      gameId: pick.gameId,
      betType: pick.pickType,
      selection: pick.selection,
      odds: pick.odds,
      stake: 0,
      potentialWin: 0,
    });
    toast({
      title: "Added to betting slip",
      description: `${pick.selection} has been added to your betting slip.`,
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-500";
    if (confidence >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getExpectedValueColor = (ev: string) => {
    const value = parseFloat(ev);
    if (value > 5) return "text-green-600";
    if (value > 0) return "text-green-500";
    return "text-red-500";
  };

  if (picksLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Target className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-foreground">Daily Expert Picks</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-5/6"></div>
                  <div className="h-10 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (picksError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Target className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-foreground">Daily Expert Picks</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Unable to load daily picks</p>
            <Button 
              onClick={() => generatePicksMutation.mutate()}
              disabled={generatePicksMutation.isPending}
            >
              {generatePicksMutation.isPending ? "Generating..." : "Generate New Picks"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Target className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Daily Expert Picks</h1>
            <p className="text-muted-foreground">AI-powered betting recommendations</p>
          </div>
        </div>
        <Button 
          onClick={() => generatePicksMutation.mutate()}
          disabled={generatePicksMutation.isPending}
          className="flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {generatePicksMutation.isPending ? "Generating..." : "Generate New Picks"}
        </Button>
      </div>

      {picks && Array.isArray(picks) && picks.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">No picks available</h3>
            <p className="text-muted-foreground mb-4">Generate AI-powered daily picks for today's games</p>
            <Button 
              onClick={() => generatePicksMutation.mutate()}
              disabled={generatePicksMutation.isPending}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {generatePicksMutation.isPending ? "Generating..." : "Generate Daily Picks"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {picks?.map((pick: DailyPick) => (
          <Card key={pick.id} className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{pick.selection}</CardTitle>
                <Badge variant="outline" className="capitalize">
                  {pick.pickType}
                </Badge>
              </div>
              <CardDescription className="flex items-center gap-2">
                <span className="font-mono">{formatOdds(pick.odds)}</span>
                <span className={getExpectedValueColor(pick.expectedValue)}>
                  {parseFloat(pick.expectedValue) > 0 ? '+' : ''}{formatPercentage(parseFloat(pick.expectedValue), 1)} EV
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Confidence</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-muted rounded-full">
                    <div 
                      className={`h-2 rounded-full ${getConfidenceColor(pick.confidence)}`}
                      style={{ width: `${pick.confidence}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{pick.confidence}%</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Analysis</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {pick.reasoning}
                </p>
              </div>

              {pick.status === "active" && (
                <Button 
                  onClick={() => handleAddToBets(pick)}
                  className="w-full flex items-center gap-2"
                  variant="outline"
                >
                  <TrendingUp className="h-4 w-4" />
                  Add to Betting Slip
                </Button>
              )}

              {pick.result && (
                <Badge 
                  variant={pick.result === "win" ? "default" : "destructive"}
                  className="w-full justify-center py-2"
                >
                  {pick.result === "win" ? "Won" : pick.result === "loss" ? "Lost" : "Push"}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}