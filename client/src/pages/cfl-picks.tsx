import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
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
  Bell,
  Search,
  Filter,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import { useBettingSlip } from "@/contexts/betting-slip-context";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import Footer from "@/components/footer";

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
  awayTeamCode: string;
  homeTeamCode: string;
  gameTime: string;
  status: "pending" | "won" | "lost";
  result?: string | null;
}

function CFLPickCard({ pick, onUpdateResult }: { pick: CFLPick; onUpdateResult: (pickId: number, result: string) => void }) {
  const { addBet } = useBettingSlip();
  const { toast } = useToast();

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-400";
    if (confidence >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getConfidenceBg = (confidence: number) => {
    if (confidence >= 80) return "bg-green-500/10 border-green-500/20";
    if (confidence >= 60) return "bg-yellow-500/10 border-yellow-500/20";
    return "bg-red-500/10 border-red-500/20";
  };

  const getResultColor = (result: string | null) => {
    switch (result) {
      case 'win': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'loss': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'push': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const handleAddToBettingSlip = () => {
    try {
      addBet({
        gameId: pick.gameId,
        betType: pick.pickType,
        selection: pick.selection,
        odds: pick.odds,
        stake: 0,
        potentialWin: 0
      });
      
      toast({
        title: "Added to Pick Slip",
        description: `${pick.selection} at ${formatOdds(pick.odds)}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add bet",
        variant: "destructive",
      });
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
          {/* Game Teams */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center mb-1">
                  <span className="text-white text-xs font-bold">{pick.awayTeamCode}</span>
                </div>
                <p className="font-semibold text-sm text-foreground">{pick.awayTeam}</p>
                <p className="text-xs text-muted-foreground">Away</p>
              </div>
              <span className="text-muted-foreground text-lg">@</span>
              <div className="text-center">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mb-1">
                  <span className="text-white text-xs font-bold">{pick.homeTeamCode}</span>
                </div>
                <p className="font-semibold text-sm text-foreground">{pick.homeTeam}</p>
                <p className="text-xs text-muted-foreground">Home</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {new Date(pick.gameTime).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZoneName: 'short'
                })}
              </div>
            </div>
          </div>

          {/* Pick Details */}
          <div className={`rounded-lg p-4 border ${getConfidenceBg(pick.confidence)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">AI Pick</span>
                <Badge variant="secondary" className={getConfidenceColor(pick.confidence)}>
                  {pick.confidence}% Confidence
                </Badge>
              </div>
              <span className="font-mono text-lg font-bold text-foreground">
                {formatOdds(pick.odds)}
              </span>
            </div>
            <p className="text-lg font-bold text-foreground mb-2">
              {pick.selection}
            </p>
            <p className="text-sm text-muted-foreground uppercase tracking-wide">
              {pick.pickType.replace('_', ' ')}
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

          {/* Stats and Action */}
          <div className="space-y-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between">
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
            
            <div className="space-y-3">
              {/* Result Display and Management */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Result:</span>
                <Badge variant="outline" className={pick.result ? getResultColor(pick.result) : 'bg-gray-500/10 text-gray-600 border-gray-500/20'}>
                  {pick.result || 'Pending'}
                </Badge>
              </div>
              
              {/* Result Management Buttons */}
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-green-600 border-green-500/20 hover:bg-green-500/10"
                  onClick={() => onUpdateResult(pick.id, 'win')}
                >
                  Win
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-red-600 border-red-500/20 hover:bg-red-500/10"
                  onClick={() => onUpdateResult(pick.id, 'loss')}
                >
                  Loss
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/10"
                  onClick={() => onUpdateResult(pick.id, 'push')}
                >
                  Push
                </Button>
              </div>
              
              <Button 
                onClick={handleAddToBettingSlip}
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Pick Slip
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CFLPicks() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [sortBy, setSortBy] = useState("confidence");
  const today = format(new Date(), "yyyy-MM-dd");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch real CFL picks data from API
  const { data: picks = [], isLoading } = useQuery<CFLPick[]>({
    queryKey: ['/api/cfl/daily-picks', today],
    enabled: true
  });

  // Manual reconciliation mutation
  const manualReconcileMutation = useMutation({
    mutationFn: ({ pickId, result }: { pickId: number; result: string }) => 
      apiRequest('POST', '/api/performance/reconcile', { pickId, result }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cfl/daily-picks'] });
      toast({
        title: "Pick Updated",
        description: "CFL pick result has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update pick result. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Auto reconciliation mutation
  const autoReconcileMutation = useMutation({
    mutationFn: (date: string) => 
      apiRequest('POST', '/api/performance/auto-reconcile', { date }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cfl/daily-picks'] });
      toast({
        title: "Auto Reconcile Complete",
        description: "CFL picks have been automatically reconciled with mock results.",
      });
    },
    onError: () => {
      toast({
        title: "Auto Reconcile Failed",
        description: "Failed to auto reconcile picks. Please try again.",
        variant: "destructive",
      });
    },
  });



  const getResultColor = (result: string | null) => {
    switch (result) {
      case 'win': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'loss': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'push': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const handleUpdateResult = (pickId: number, result: string) => {
    manualReconcileMutation.mutate({ pickId, result });
  };

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

  // Filter and sort picks
  const filteredPicks = picks
    .filter(pick => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          pick.awayTeam.toLowerCase().includes(searchLower) ||
          pick.homeTeam.toLowerCase().includes(searchLower) ||
          pick.selection.toLowerCase().includes(searchLower) ||
          pick.pickType.toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
    .filter(pick => {
      if (filterBy === "high-confidence") return pick.confidence >= 75;
      if (filterBy === "positive-value") return pick.expectedValue > 0;
      if (filterBy === "moneyline") return pick.pickType === "moneyline";
      if (filterBy === "total") return pick.pickType === "total";
      if (filterBy === "spread") return pick.pickType === "spread";
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "confidence") return b.confidence - a.confidence;
      if (sortBy === "expected-value") return b.expectedValue - a.expectedValue;
      if (sortBy === "game-time") return new Date(a.gameTime).getTime() - new Date(b.gameTime).getTime();
      return 0;
    });

  const stats = {
    totalPicks: picks.length,
    highConfidence: highConfidencePicks.length,
    avgConfidence: avgConfidence,
    avgExpectedValue: picks.length > 0 ? picks.reduce((sum, pick) => sum + pick.expectedValue, 0) / picks.length : 0
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Page Header */}
      <div className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3">
                <Target className="h-8 w-8 text-primary" />
                <span>CFL Daily Picks</span>
              </h1>
              <p className="text-muted-foreground mt-2">
                AI-powered game predictions for today's CFL games
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="mt-6 lg:mt-0 lg:ml-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{stats.totalPicks}</div>
                  <div className="text-sm text-muted-foreground">Picks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">{stats.highConfidence}</div>
                  <div className="text-sm text-muted-foreground">High Confidence</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{Math.round(stats.avgConfidence)}%</div>
                  <div className="text-sm text-muted-foreground">Avg Confidence</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">+{stats.avgExpectedValue.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Avg EV</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search teams, picks, or bet types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confidence">Confidence</SelectItem>
                    <SelectItem value="expected-value">Expected Value</SelectItem>
                    <SelectItem value="game-time">Game Time</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Filter by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Picks</SelectItem>
                    <SelectItem value="high-confidence">High Confidence</SelectItem>
                    <SelectItem value="positive-value">Positive EV</SelectItem>
                    <SelectItem value="moneyline">Moneyline</SelectItem>
                    <SelectItem value="spread">Spread</SelectItem>
                    <SelectItem value="total">Total</SelectItem>
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

        {/* Action Buttons */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => autoReconcileMutation.mutate(today)}
                disabled={autoReconcileMutation.isPending}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${autoReconcileMutation.isPending ? 'animate-spin' : ''}`} />
                Auto-Reconcile Picks
              </Button>
              

            </div>
          </CardContent>
        </Card>

        {/* Picks Grid */}
        {filteredPicks.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No picks found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterBy !== "all" 
                  ? "Try adjusting your search or filters" 
                  : "No CFL picks available for today"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPicks.map((pick) => (
              <CFLPickCard key={pick.id} pick={pick} onUpdateResult={handleUpdateResult} />
            ))}
          </div>
        )}

        {/* Coming Soon Notice */}
        <Card className="border-primary/20 bg-primary/5 mt-8">
          <CardContent className="p-6 text-center">
            <Trophy className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Enhanced CFL Analytics Coming Soon</h3>
            <p className="text-muted-foreground mb-4">
              We're developing advanced CFL prediction models with player props, weather analysis, 
              and comprehensive team statistics for the 2025 season.
            </p>
            <Button variant="outline">
              <Bell className="h-4 w-4 mr-2" />
              Get Notified
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}