import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, TrendingUp, Target, Calculator, Plus, X, Search, DollarSign, Trophy, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PlayerProp {
  id: string;
  gameId: string;
  playerName: string;
  team: string;
  opponent: string;
  propType: string;
  line: number;
  overOdds: number;
  underOdds: number;
  bookmaker: string;
  projectedValue?: number;
  edge?: number;
  category: 'hitting' | 'pitching' | 'general';
}

interface PropSelection {
  propId: string;
  selection: 'over' | 'under';
  odds: number;
  playerName: string;
  propType: string;
  line: number;
  team: string;
}

interface ParlayAnalysis {
  totalOdds: number;
  impliedProbability: number;
  estimatedProbability: number;
  expectedValue: number;
  recommendation: 'strong_bet' | 'moderate_bet' | 'avoid' | 'analysis_needed';
  confidence: number;
}

export default function PlayerPropBuilder() {
  const { user, hasAccess } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedProps, setSelectedProps] = useState<PropSelection[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBookmaker, setSelectedBookmaker] = useState<string>("all");
  const [parlayStake, setParlayStake] = useState<number>(10);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Check Elite access
  const hasEliteAccess = hasAccess('elite');

  if (!hasEliteAccess) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-purple-100 rounded-full">
                <Trophy className="h-12 w-12 text-purple-600" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Player Prop Parlay Builder
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Build sophisticated player prop parlays with up to 6 picks, advanced analytics, and real-time odds from multiple sportsbooks.
              </p>
            </div>
            
            <Card className="max-w-md mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center space-x-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                  <span>Elite Feature</span>
                </CardTitle>
                <CardDescription>
                  This advanced DFS tool requires an Elite subscription
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Multi-sportsbook odds</span>
                    <span className="text-green-600">✓</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Up to 6-leg parlays</span>
                    <span className="text-green-600">✓</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Expected value calculations</span>
                    <span className="text-green-600">✓</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Player projections</span>
                    <span className="text-green-600">✓</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Kelly criterion sizing</span>
                    <span className="text-green-600">✓</span>
                  </div>
                </div>
                <Button className="w-full" asChild>
                  <a href="/subscribe">Upgrade to Elite - $40/month</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Fetch available player props
  const { data: playerProps = [], isLoading: propsLoading } = useQuery({
    queryKey: ['/api/player-props'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Calculate parlay analysis
  const calculateParlayAnalysis = (selections: PropSelection[]): ParlayAnalysis => {
    if (selections.length === 0) {
      return {
        totalOdds: 0,
        impliedProbability: 0,
        estimatedProbability: 0,
        expectedValue: 0,
        recommendation: 'analysis_needed',
        confidence: 0
      };
    }

    // Convert American odds to decimal and multiply
    const decimalOdds = selections.map(selection => {
      const odds = selection.odds;
      return odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1;
    });

    const combinedDecimalOdds = decimalOdds.reduce((acc, odds) => acc * odds, 1);
    const totalAmericanOdds = combinedDecimalOdds >= 2 ? 
      Math.round((combinedDecimalOdds - 1) * 100) : 
      Math.round(-100 / (combinedDecimalOdds - 1));

    const impliedProbability = 1 / combinedDecimalOdds;
    
    // Estimate true probability (simplified model)
    const individualProbs = selections.map(selection => {
      const odds = selection.odds;
      const impliedProb = odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100);
      // Add small edge adjustment for sharp vs public
      return impliedProb * 1.05; // 5% adjustment for estimation
    });
    
    const estimatedProbability = individualProbs.reduce((acc, prob) => acc * prob, 1);
    const expectedValue = (estimatedProbability * (combinedDecimalOdds - 1)) - (1 - estimatedProbability);
    
    let recommendation: 'strong_bet' | 'moderate_bet' | 'avoid' | 'analysis_needed' = 'analysis_needed';
    let confidence = 0;

    if (expectedValue > 0.15) {
      recommendation = 'strong_bet';
      confidence = 85;
    } else if (expectedValue > 0.05) {
      recommendation = 'moderate_bet';
      confidence = 65;
    } else if (expectedValue < -0.05) {
      recommendation = 'avoid';
      confidence = 75;
    }

    return {
      totalOdds: totalAmericanOdds,
      impliedProbability,
      estimatedProbability,
      expectedValue,
      recommendation,
      confidence
    };
  };

  const parlayAnalysis = calculateParlayAnalysis(selectedProps);

  const addPropToParlay = (prop: PlayerProp, selection: 'over' | 'under') => {
    if (selectedProps.length >= 6) {
      toast({
        title: "Maximum Props Reached",
        description: "You can add up to 6 props per parlay",
        variant: "destructive",
      });
      return;
    }

    const newSelection: PropSelection = {
      propId: prop.id,
      selection,
      odds: selection === 'over' ? prop.overOdds : prop.underOdds,
      playerName: prop.playerName,
      propType: prop.propType,
      line: prop.line,
      team: prop.team
    };

    setSelectedProps(prev => [...prev, newSelection]);
    setShowAnalysis(true);
  };

  const removePropFromParlay = (propId: string) => {
    setSelectedProps(prev => prev.filter(p => p.propId !== propId));
  };

  const clearParlay = () => {
    setSelectedProps([]);
    setShowAnalysis(false);
  };

  // Save parlay mutation
  const saveParlayMutation = useMutation({
    mutationFn: async (parlayData: any) => {
      return apiRequest('/api/player-prop-parlays', parlayData);
    },
    onSuccess: () => {
      toast({
        title: "Parlay Saved",
        description: "Your player prop parlay has been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/my-parlays'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save parlay",
        variant: "destructive",
      });
    }
  });

  const saveParlay = () => {
    if (selectedProps.length === 0) return;

    const parlayData = {
      selections: selectedProps,
      analysis: parlayAnalysis,
      stake: parlayStake,
      potentialPayout: parlayStake * (Math.abs(parlayAnalysis.totalOdds) / 100 + 1)
    };

    saveParlayMutation.mutate(parlayData);
  };

  // Filter props based on search and category
  const filteredProps = (playerProps as PlayerProp[]).filter((prop: PlayerProp) => {
    const matchesSearch = prop.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prop.propType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || prop.category === selectedCategory;
    const matchesBookmaker = selectedBookmaker === 'all' || prop.bookmaker === selectedBookmaker;
    
    return matchesSearch && matchesCategory && matchesBookmaker;
  });

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'strong_bet': return 'text-green-600 bg-green-50';
      case 'moderate_bet': return 'text-blue-600 bg-blue-50';
      case 'avoid': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case 'strong_bet': return 'Strong Bet';
      case 'moderate_bet': return 'Moderate Bet';
      case 'avoid': return 'Avoid';
      default: return 'Need Analysis';
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3">
              <Target className="h-8 w-8 text-purple-600" />
              <span>Player Prop Parlay Builder</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Build advanced player prop parlays with real-time odds and analytics
            </p>
          </div>
          <Badge className="bg-purple-600 text-white">
            <Zap className="h-4 w-4 mr-1" />
            Elite Feature
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Prop Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Find Player Props</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search players or props..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="hitting">Hitting Props</SelectItem>
                      <SelectItem value="pitching">Pitching Props</SelectItem>
                      <SelectItem value="general">General Props</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedBookmaker} onValueChange={setSelectedBookmaker}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sportsbook" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sportsbooks</SelectItem>
                      <SelectItem value="draftkings">DraftKings</SelectItem>
                      <SelectItem value="fanduel">FanDuel</SelectItem>
                      <SelectItem value="underdog">Underdog</SelectItem>
                      <SelectItem value="prizepicks">PrizePicks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Available Props */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Available Props</CardTitle>
                <CardDescription>
                  {filteredProps.length} props available • Live odds
                </CardDescription>
              </CardHeader>
              <CardContent>
                {propsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : filteredProps.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredProps.map((prop: PlayerProp) => (
                      <div key={prop.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{prop.playerName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {prop.team} vs {prop.opponent} • {prop.propType}
                            </p>
                          </div>
                          <Badge variant="outline">{prop.bookmaker}</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-center">
                            <div className="text-lg font-bold">{prop.line}</div>
                            <div className="text-xs text-muted-foreground">Line</div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addPropToParlay(prop, 'over')}
                              disabled={selectedProps.length >= 6}
                              className="hover:bg-green-50"
                            >
                              Over {prop.overOdds > 0 ? '+' : ''}{prop.overOdds}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addPropToParlay(prop, 'under')}
                              disabled={selectedProps.length >= 6}
                              className="hover:bg-red-50"
                            >
                              Under {prop.underOdds > 0 ? '+' : ''}{prop.underOdds}
                            </Button>
                          </div>
                        </div>
                        
                        {prop.edge && (
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600">
                              {prop.edge > 0 ? '+' : ''}{(prop.edge * 100).toFixed(1)}% edge
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No props found matching your criteria</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Parlay Builder */}
          <div className="space-y-6">
            {/* Current Parlay */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Your Parlay ({selectedProps.length}/6)</CardTitle>
                {selectedProps.length > 0 && (
                  <Button size="sm" variant="ghost" onClick={clearParlay}>
                    Clear All
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {selectedProps.length > 0 ? (
                  <div className="space-y-3">
                    {selectedProps.map((selection, index) => (
                      <div key={`${selection.propId}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{selection.playerName}</div>
                          <div className="text-xs text-muted-foreground">
                            {selection.propType} {selection.selection} {selection.line}
                          </div>
                          <div className="text-xs font-medium">
                            {selection.odds > 0 ? '+' : ''}{selection.odds}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removePropFromParlay(selection.propId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Plus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Add props to build your parlay</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Parlay Analysis */}
            {selectedProps.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Calculator className="h-5 w-5" />
                    <span>Parlay Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {parlayAnalysis.totalOdds > 0 ? '+' : ''}{parlayAnalysis.totalOdds}
                      </div>
                      <div className="text-xs text-muted-foreground">Total Odds</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {(parlayAnalysis.expectedValue * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Expected Value</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Implied Probability:</span>
                      <span>{(parlayAnalysis.impliedProbability * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Estimated Probability:</span>
                      <span>{(parlayAnalysis.estimatedProbability * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Confidence:</span>
                      <span>{parlayAnalysis.confidence}%</span>
                    </div>
                  </div>

                  <div className={`text-center p-3 rounded-lg ${getRecommendationColor(parlayAnalysis.recommendation)}`}>
                    <div className="font-semibold">
                      {getRecommendationText(parlayAnalysis.recommendation)}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Stake Amount</label>
                      <div className="relative mt-1">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          value={parlayStake}
                          onChange={(e) => setParlayStake(Number(e.target.value))}
                          className="pl-10"
                          min="1"
                          max="1000"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>Potential Payout:</span>
                      <span className="font-semibold">
                        ${(parlayStake * (Math.abs(parlayAnalysis.totalOdds) / 100 + 1)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={saveParlay}
                    disabled={saveParlayMutation.isPending}
                  >
                    {saveParlayMutation.isPending ? 'Saving...' : 'Save Parlay'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Alert about data sources */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Odds data aggregated from authorized APIs including DraftKings, FanDuel, Underdog, and PrizePicks. 
            Updated every 30 seconds. Always verify final odds on your chosen sportsbook before placing bets.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}