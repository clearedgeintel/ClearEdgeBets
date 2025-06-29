import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Trophy, TrendingUp, Target, CheckCircle, XCircle, Minus, RefreshCw, BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, addDays, subDays } from "date-fns";

interface DailyPerformance {
  date: string;
  totalPicks: number;
  resolvedPicks: number;
  winningPicks: number;
  losingPicks: number;
  accuracy: number;
  picks: Array<{
    id: number;
    gameId: string;
    pickType: string;
    selection: string;
    odds: number;
    reasoning: string;
    confidence: number;
    result: string | null;
    game: {
      awayTeam: string;
      homeTeam: string;
      gameTime: string;
    } | null;
  }>;
}

interface MonthlyPerformance {
  month: number;
  year: number;
  totalGames: number;
  winnerAccuracy: number;
  totalAccuracy: number;
  spreadAccuracy: number;
  avgConfidence: number;
  pitchingAccuracy: number;
  monthlyBreakdown: Array<{
    month: string;
    games: number;
    accuracy: number;
  }>;
}

export default function PerformanceTracking() {
  // Get today's date in local timezone to avoid date picker offset issues
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Convert date to string for API calls
  const dateString = format(selectedDate, 'yyyy-MM-dd');

  const { data: dailyPerformance, isLoading: dailyLoading } = useQuery<DailyPerformance>({
    queryKey: ['/api/performance/daily', dateString],
  });

  const { data: monthlyPerformance, isLoading: monthlyLoading } = useQuery<MonthlyPerformance>({
    queryKey: ['/api/performance/monthly'],
  });

  const autoReconcileMutation = useMutation({
    mutationFn: (date: string) => apiRequest('POST', '/api/performance/auto-reconcile', { date, force: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/performance/daily'] });
      toast({
        title: "Reconciliation Complete",
        description: "Daily picks have been automatically reconciled with results.",
      });
    },
    onError: () => {
      toast({
        title: "Reconciliation Failed",
        description: "Failed to auto-reconcile picks. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateHistoricalMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/performance/generate-historical', { days: 14 }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/performance/daily'] });
      queryClient.invalidateQueries({ queryKey: ['/api/performance/monthly'] });
      toast({
        title: "Historical Data Generated",
        description: "Created sample historical betting data for the past 2 weeks.",
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate historical data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const manualReconcileMutation = useMutation({
    mutationFn: ({ pickId, result }: { pickId: number; result: string }) => 
      apiRequest('POST', '/api/performance/reconcile', { pickId, result }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/performance/daily'] });
      toast({
        title: "Pick Updated",
        description: "Pick result has been updated successfully.",
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

  const resetResultsMutation = useMutation({
    mutationFn: (date: string) => 
      apiRequest('POST', '/api/performance/reset-results', { date }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/performance/daily'] });
      toast({
        title: "Results Reset",
        description: "All pick results have been cleared and can now be re-reconciled.",
      });
    },
    onError: () => {
      toast({
        title: "Reset Failed",
        description: "Failed to reset results. Please try again.",
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

  const getResultIcon = (result: string | null) => {
    switch (result) {
      case 'win': return <CheckCircle className="h-4 w-4" />;
      case 'loss': return <XCircle className="h-4 w-4" />;
      case 'push': return <Minus className="h-4 w-4" />;
      default: return <RefreshCw className="h-4 w-4" />;
    }
  };

  if (dailyLoading && monthlyLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <BarChart3 className="h-10 w-10 text-accent" />
              <h1 className="text-4xl font-bold">Performance Tracking</h1>
            </div>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              Track daily picks performance, reconcile results, and analyze betting accuracy over time.
            </p>
          </div>
        </div>
      </div>

      {/* Date Selector */}
      <div className="max-w-7xl mx-auto px-4 -mt-6">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <div className="flex items-center space-x-3">
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
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(new Date())}
                  >
                    Today
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={() => autoReconcileMutation.mutate(dateString)}
                  disabled={autoReconcileMutation.isPending}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className={`h-4 w-4 ${autoReconcileMutation.isPending ? 'animate-spin' : ''}`} />
                  <span>Auto Reconcile</span>
                </Button>
                <Button 
                  onClick={() => generateHistoricalMutation.mutate()}
                  disabled={generateHistoricalMutation.isPending}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <BarChart3 className={`h-4 w-4 ${generateHistoricalMutation.isPending ? 'animate-spin' : ''}`} />
                  <span>Generate Sample Data</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Stats */}
      {dailyPerformance && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold text-foreground">{dailyPerformance.totalPicks}</div>
                <div className="text-xs text-muted-foreground">Total Picks</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold text-foreground">{dailyPerformance.winningPicks}</div>
                <div className="text-xs text-muted-foreground">Wins</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <XCircle className="h-6 w-6 mx-auto mb-2 text-red-600" />
                <div className="text-2xl font-bold text-foreground">{dailyPerformance.losingPicks}</div>
                <div className="text-xs text-muted-foreground">Losses</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-secondary" />
                <div className="text-2xl font-bold text-foreground">
                  {dailyPerformance?.accuracy?.toFixed(1) || '0.0'}%
                </div>
                <div className="text-xs text-muted-foreground">Accuracy</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <RefreshCw className="h-6 w-6 mx-auto mb-2 text-accent" />
                <div className="text-2xl font-bold text-foreground">{dailyPerformance.resolvedPicks}</div>
                <div className="text-xs text-muted-foreground">Resolved</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="daily" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="daily">Daily Picks</TabsTrigger>
              <TabsTrigger value="monthly">Monthly Summary</TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="space-y-6">
              <div className="text-center space-y-4 mb-8">
                <h2 className="text-3xl font-bold text-foreground">
                  Daily Picks - {format(selectedDate, "MMMM d, yyyy")}
                </h2>
                <p className="text-muted-foreground">
                  Review and reconcile today's AI-generated betting picks with actual game results.
                </p>
                
                {/* Action Buttons */}
                <div className="flex justify-center space-x-4 pt-4">
                  <Button
                    onClick={() => autoReconcileMutation.mutate(dateString)}
                    disabled={autoReconcileMutation.isPending}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {autoReconcileMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Auto Reconciling...
                      </>
                    ) : (
                      <>
                        <Target className="mr-2 h-4 w-4" />
                        Auto Reconcile
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => resetResultsMutation.mutate(dateString)}
                    disabled={resetResultsMutation.isPending}
                    variant="outline"
                    className="border-red-500/20 text-red-600 hover:bg-red-500/10"
                  >
                    {resetResultsMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        Reset Results
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => generateHistoricalMutation.mutate()}
                    disabled={generateHistoricalMutation.isPending}
                    variant="outline"
                    className="border-secondary/20 text-secondary hover:bg-secondary/10"
                  >
                    {generateHistoricalMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Generate Sample Data
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {dailyPerformance.picks.map((pick) => (
                  <Card key={pick.id} className="bg-card border-border">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center space-x-4">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-3">
                                <h3 className="font-semibold text-foreground">
                                  {pick.game ? `${pick.game.awayTeam} @ ${pick.game.homeTeam}` : pick.gameId}
                                </h3>
                                {pick.result && (
                                  <div className="flex items-center space-x-1">
                                    {getResultIcon(pick.result)}
                                    <span className={`text-sm font-medium ${
                                      pick.result === 'win' ? 'text-green-600' : 
                                      pick.result === 'loss' ? 'text-red-600' : 
                                      'text-yellow-600'
                                    }`}>
                                      {pick.result.toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <Badge variant="outline">{pick.pickType}</Badge>
                                <span>•</span>
                                <span>{pick.selection}</span>
                                <span>•</span>
                                <span className="font-mono">
                                  {pick.odds > 0 ? `+${pick.odds}` : `${pick.odds}`}
                                </span>
                                {pick.result && (
                                  <>
                                    <span>•</span>
                                    <Badge 
                                      variant="outline" 
                                      className={pick.result === 'win' ? 'text-green-600 border-green-500/20' : 
                                                pick.result === 'loss' ? 'text-red-600 border-red-500/20' : 
                                                'text-yellow-600 border-yellow-500/20'}
                                    >
                                      {pick.result.toUpperCase()}
                                    </Badge>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">
                              <strong>Reasoning:</strong> {pick.reasoning}
                            </div>
                            <div className="flex items-center space-x-4 text-sm">
                              <div className="flex items-center space-x-2">
                                <span className="text-muted-foreground">Confidence:</span>
                                <Badge variant="secondary">{pick.confidence}%</Badge>
                              </div>
                              {pick.game && (
                                <div className="text-muted-foreground">
                                  {new Date(pick.game.gameTime).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className={getResultColor(pick.result)}>
                            <div className="flex items-center space-x-1">
                              {getResultIcon(pick.result)}
                              <span>{pick.result || 'Pending'}</span>
                            </div>
                          </Badge>

                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-500/20 hover:bg-green-500/10"
                              onClick={() => manualReconcileMutation.mutate({ pickId: pick.id, result: 'win' })}
                              disabled={manualReconcileMutation.isPending}
                            >
                              Win
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-500/20 hover:bg-red-500/10"
                              onClick={() => manualReconcileMutation.mutate({ pickId: pick.id, result: 'loss' })}
                              disabled={manualReconcileMutation.isPending}
                            >
                              Loss
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/10"
                              onClick={() => manualReconcileMutation.mutate({ pickId: pick.id, result: 'push' })}
                              disabled={manualReconcileMutation.isPending}
                            >
                              Push
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {dailyPerformance.picks.length === 0 && (
                  <Card className="bg-card border-border">
                    <CardContent className="p-8 text-center">
                      <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-xl font-semibold text-foreground mb-2">No Picks for This Date</h3>
                      <p className="text-muted-foreground">
                        No daily picks were generated for {format(selectedDate, "MMMM d, yyyy")}.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="monthly" className="space-y-6">
              <div className="text-center space-y-4 mb-8">
                <h2 className="text-3xl font-bold text-foreground">Monthly Performance Summary</h2>
                <p className="text-muted-foreground">
                  Overall performance metrics and trends for the current month.
                </p>
              </div>

              {monthlyPerformance ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center text-foreground">
                        <Trophy className="h-5 w-5 mr-2 text-primary" />
                        Overall Accuracy
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground mb-2">
                        {monthlyPerformance?.totalAccuracy?.toFixed(1) || '0.0'}%
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Across {monthlyPerformance?.totalGames || 0} games
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center text-foreground">
                        <Target className="h-5 w-5 mr-2 text-secondary" />
                        Spread Accuracy
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground mb-2">
                        {monthlyPerformance?.spreadAccuracy?.toFixed(1) || '0.0'}%
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Point spread predictions
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center text-foreground">
                        <TrendingUp className="h-5 w-5 mr-2 text-accent" />
                        Avg Confidence
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground mb-2">
                        {monthlyPerformance?.avgConfidence?.toFixed(1) || '0.0'}%
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Pick confidence rating
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="bg-card border-border">
                  <CardContent className="p-8 text-center">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">No Monthly Data Available</h3>
                    <p className="text-muted-foreground">
                      Monthly performance data will appear once picks are tracked and reconciled.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}