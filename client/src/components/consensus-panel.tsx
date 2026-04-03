import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatPercentage } from "@/lib/utils";
import { TrendingUp, TrendingDown, Users, Zap, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConsensusData {
  id: number;
  gameId: string;
  market: string;
  publicPercentage: {
    side1: number;
    side2: number;
    side1Name: string;
    side2Name: string;
  };
  sharpMoney: {
    direction: string;
    confidence: number;
    reasoning: string;
  };
  lineMovement: {
    opening: number;
    current: number;
    direction: string;
    significance: number;
  };
  recommendation: {
    play: string;
    reasoning: string;
    confidence: number;
  };
  updatedAt: Date | null;
}

interface ConsensusPanelProps {
  gameId: string;
}

export default function ConsensusPanel({ gameId }: ConsensusPanelProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: consensus,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/consensus", gameId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/consensus/${gameId}`);
      return res.json();
    },
  });

  const generateConsensusMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/consensus/${gameId}/generate`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consensus", gameId] });
      toast({
        title: "Consensus data updated",
        description: "Latest market sentiment and market analysis generated.",
      });
    },
    onError: () => {
      toast({
        title: "Analysis failed",
        description: "Unable to generate consensus data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getMovementIcon = (direction: string) => {
    if (direction === "up") return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (direction === "down") return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <BarChart3 className="h-4 w-4 text-gray-500" />;
  };

  const getMovementColor = (direction: string) => {
    if (direction === "up") return "text-green-600";
    if (direction === "down") return "text-red-600";
    return "text-gray-600";
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-500";
    if (confidence >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Betting Consensus
          </CardTitle>
          <CardDescription>Loading market sentiment...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !consensus || !Array.isArray(consensus) || consensus.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Betting Consensus
          </CardTitle>
          <CardDescription>Public sentiment and sharp money analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No consensus data available</p>
            <Button 
              onClick={() => generateConsensusMutation.mutate()}
              disabled={generateConsensusMutation.isPending}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              {generateConsensusMutation.isPending ? "Analyzing..." : "Generate Analysis"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Betting Consensus</h3>
        </div>
        <Button 
          onClick={() => generateConsensusMutation.mutate()}
          disabled={generateConsensusMutation.isPending}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Zap className="h-3 w-3" />
          {generateConsensusMutation.isPending ? "Updating..." : "Refresh"}
        </Button>
      </div>

      {consensus.map((data: ConsensusData) => (
        <Card key={data.id} className="border-l-4 border-l-purple-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base capitalize">{data.market} Market</CardTitle>
              <Badge variant="outline">
                Live Data
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Public Percentage */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Public Betting</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{data.publicPercentage.side1Name}</span>
                  <span className="font-medium">{formatPercentage(data.publicPercentage.side1)}</span>
                </div>
                <Progress value={data.publicPercentage.side1} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span>{data.publicPercentage.side2Name}</span>
                  <span className="font-medium">{formatPercentage(data.publicPercentage.side2)}</span>
                </div>
                <Progress value={data.publicPercentage.side2} className="h-2" />
              </div>
            </div>

            {/* Sharp Money */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">Sharp Money</span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Direction: {data.sharpMoney.direction}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-2 bg-gray-200 rounded-full">
                      <div 
                        className={`h-2 rounded-full ${getConfidenceColor(data.sharpMoney.confidence)}`}
                        style={{ width: `${data.sharpMoney.confidence}%` }}
                      ></div>
                    </div>
                    <span className="text-xs">{data.sharpMoney.confidence}%</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {data.sharpMoney.reasoning}
                </p>
              </div>
            </div>

            {/* Line Movement */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {getMovementIcon(data.lineMovement.direction)}
                <span className="font-medium">Line Movement</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Opening</span>
                  <p className="font-medium">{data.lineMovement.opening}</p>
                </div>
                <div>
                  <span className="text-gray-500">Current</span>
                  <p className="font-medium">{data.lineMovement.current}</p>
                </div>
                <div>
                  <span className="text-gray-500">Movement</span>
                  <p className={`font-medium ${getMovementColor(data.lineMovement.direction)}`}>
                    {data.lineMovement.direction === "up" ? "+" : ""}
                    {(data.lineMovement.current - data.lineMovement.opening).toFixed(1)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Significance:</span>
                <Badge variant={data.lineMovement.significance >= 7 ? "default" : "secondary"}>
                  {data.lineMovement.significance >= 7 ? "High" : data.lineMovement.significance >= 4 ? "Medium" : "Low"}
                </Badge>
              </div>
            </div>

            {/* Recommendation */}
            <div className="space-y-3 bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Recommendation</span>
                </div>
                <Badge variant="outline" className="bg-white dark:bg-gray-800">
                  {data.recommendation.confidence}% Confidence
                </Badge>
              </div>
              <div>
                <p className="font-medium text-blue-700 dark:text-blue-300 mb-2">
                  {data.recommendation.play}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {data.recommendation.reasoning}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}