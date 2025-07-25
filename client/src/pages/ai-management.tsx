import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Brain, 
  RefreshCw, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface AIResponse {
  gameId: string;
  awayTeam: string;
  homeTeam: string;
  aiSummary?: {
    summary: string;
    confidence: number;
    lastUpdated: string;
  };
  gameTime: string;
  venue: string;
  status: string;
}

export default function AIManagement() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedGame, setExpandedGame] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch games with AI responses for the selected date
  const { data: games = [], isLoading } = useQuery<AIResponse[]>({
    queryKey: ['/api/games', selectedDate],
    queryFn: () => apiRequest(`/api/games?date=${selectedDate}`)
  });

  // Mutation to regenerate AI analysis for a specific game
  const regenerateAIMutation = useMutation({
    mutationFn: async (gameId: string) => {
      return apiRequest(`/api/games/${gameId}/regenerate-ai`, {
        method: 'POST'
      });
    },
    onSuccess: (data, gameId) => {
      toast({
        title: "AI Analysis Regenerated",
        description: `Successfully regenerated AI analysis for game ${gameId}`,
      });
      // Invalidate and refetch games data
      queryClient.invalidateQueries({ queryKey: ['/api/games', selectedDate] });
    },
    onError: (error) => {
      toast({
        title: "Regeneration Failed",
        description: "Failed to regenerate AI analysis. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation to regenerate all AI analyses for the date
  const regenerateAllAIMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/games/regenerate-all-ai`, {
        method: 'POST',
        body: JSON.stringify({ date: selectedDate })
      });
    },
    onSuccess: () => {
      toast({
        title: "All AI Analyses Regenerated",
        description: `Successfully regenerated AI analysis for all games on ${selectedDate}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/games', selectedDate] });
    },
    onError: (error) => {
      toast({
        title: "Bulk Regeneration Failed",
        description: "Failed to regenerate all AI analyses. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRegenerateAI = (gameId: string) => {
    regenerateAIMutation.mutate(gameId);
  };

  const handleRegenerateAll = () => {
    regenerateAllAIMutation.mutate();
  };

  const toggleGameExpansion = (gameId: string) => {
    setExpandedGame(expandedGame === gameId ? null : gameId);
  };

  const getConfidenceBadgeColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-100 text-green-800 border-green-300";
    if (confidence >= 65) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  const getStatusBadge = (game: AIResponse) => {
    if (game.aiSummary) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-300">
          <CheckCircle className="h-3 w-3 mr-1" />
          AI Complete
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-800 border-gray-300">
        <AlertCircle className="h-3 w-3 mr-1" />
        No AI Analysis
      </Badge>
    );
  };

  const gamesWithAI = games.filter(game => game.aiSummary);
  const gamesWithoutAI = games.filter(game => !game.aiSummary);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Management</h1>
            <p className="text-gray-600">Manage AI game analysis and regenerate responses</p>
          </div>
        </div>
        <Button 
          onClick={handleRegenerateAll}
          disabled={regenerateAllAIMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {regenerateAllAIMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Regenerate All AI
        </Button>
      </div>

      {/* Date Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Calendar className="h-5 w-5 text-gray-500" />
            <label htmlFor="date" className="text-sm font-medium text-gray-700">
              Select Date:
            </label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Games</p>
                <p className="text-2xl font-bold">{games.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">With AI Analysis</p>
                <p className="text-2xl font-bold">{gamesWithAI.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Missing AI</p>
                <p className="text-2xl font-bold">{gamesWithoutAI.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Avg Confidence</p>
                <p className="text-2xl font-bold">
                  {gamesWithAI.length > 0 
                    ? Math.round(gamesWithAI.reduce((sum, game) => sum + (game.aiSummary?.confidence || 0), 0) / gamesWithAI.length)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Games List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {games.map((game) => (
            <Card key={game.gameId} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <CardTitle className="text-lg">
                        {game.awayTeam} @ {game.homeTeam}
                      </CardTitle>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                        <Clock className="h-4 w-4" />
                        <span>{game.gameTime}</span>
                        <span>•</span>
                        <span>{game.venue}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(game)}
                    {game.aiSummary && (
                      <Badge className={getConfidenceBadgeColor(game.aiSummary.confidence)}>
                        {game.aiSummary.confidence}% Confidence
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleGameExpansion(game.gameId)}
                    >
                      {expandedGame === game.gameId ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRegenerateAI(game.gameId)}
                      disabled={regenerateAIMutation.isPending}
                    >
                      {regenerateAIMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {expandedGame === game.gameId && (
                <CardContent className="pt-0">
                  <div className="border-t pt-4">
                    {game.aiSummary ? (
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">AI Analysis</h4>
                          <Textarea
                            value={game.aiSummary.summary}
                            readOnly
                            className="min-h-[120px] bg-gray-50"
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>Confidence: {game.aiSummary.confidence}%</span>
                          <span>Last Updated: {new Date(game.aiSummary.lastUpdated).toLocaleString()}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-lg font-medium">No AI Analysis Available</p>
                        <p className="text-sm">Click the refresh button to generate AI analysis for this game</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {games.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Games Found</h3>
          <p className="text-gray-600">No games are scheduled for the selected date.</p>
        </div>
      )}
    </div>
  );
}