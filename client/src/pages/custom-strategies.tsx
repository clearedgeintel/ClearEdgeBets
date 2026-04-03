import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Award, 
  TrendingUp, 
  Target, 
  Settings, 
  Plus,
  Edit,
  Trash2,
  BarChart3,
  Brain
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

interface BettingStrategy {
  id: string;
  name: string;
  description: string;
  conditions: {
    sport: string;
    market: string;
    minOdds: number;
    maxOdds: number;
    confidenceThreshold: number;
    bankrollPercentage: number;
  };
  performance: {
    totalBets: number;
    winRate: number;
    profit: number;
    roi: number;
  };
  isActive: boolean;
  createdAt: string;
}

export default function CustomStrategies() {
  const { user, hasAccess } = useAuth();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<BettingStrategy | null>(null);

  // Mock strategies for demonstration
  const [strategies, setStrategies] = useState<BettingStrategy[]>([
    {
      id: "1",
      name: "Conservative Favorites",
      description: "Focus on favorites with high confidence and low risk",
      conditions: {
        sport: "MLB",
        market: "Moneyline",
        minOdds: 1.20,
        maxOdds: 1.80,
        confidenceThreshold: 85,
        bankrollPercentage: 2
      },
      performance: {
        totalBets: 45,
        winRate: 73.3,
        profit: 287.50,
        roi: 8.9
      },
      isActive: true,
      createdAt: "2025-05-15"
    },
    {
      id: "2", 
      name: "Value Hunter",
      description: "Target undervalued teams with strong AI confidence",
      conditions: {
        sport: "MLB",
        market: "Spread",
        minOdds: 1.85,
        maxOdds: 2.50,
        confidenceThreshold: 75,
        bankrollPercentage: 3
      },
      performance: {
        totalBets: 32,
        winRate: 65.6,
        profit: 156.25,
        roi: 12.4
      },
      isActive: true,
      createdAt: "2025-04-20"
    },
    {
      id: "3",
      name: "Totals Specialist", 
      description: "Focus on over/under bets with specific weather conditions",
      conditions: {
        sport: "MLB",
        market: "Total",
        minOdds: 1.80,
        maxOdds: 2.20,
        confidenceThreshold: 80,
        bankrollPercentage: 2.5
      },
      performance: {
        totalBets: 28,
        winRate: 60.7,
        profit: 89.75,
        roi: 6.8
      },
      isActive: false,
      createdAt: "2025-03-10"
    }
  ]);

  if (!hasAccess('elite')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Award className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
            <h2 className="text-2xl font-bold mb-2">Elite Feature</h2>
            <p className="text-muted-foreground mb-4">
              Custom Betting Strategies is an Elite tier feature. Create personalized betting strategies with advanced AI criteria and performance tracking.
            </p>
            <Badge className="bg-yellow-600 text-white">
              <Award className="h-3 w-3 mr-1" />
              Elite Only
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreateStrategy = () => {
    toast({
      title: "Strategy created",
      description: "Your custom prediction strategy has been saved successfully.",
    });
    setShowCreateDialog(false);
  };

  const toggleStrategy = (id: string) => {
    setStrategies(prev => 
      prev.map(strategy => 
        strategy.id === id 
          ? { ...strategy, isActive: !strategy.isActive }
          : strategy
      )
    );
    
    const strategy = strategies.find(s => s.id === id);
    toast({
      title: `Strategy ${strategy?.isActive ? 'deactivated' : 'activated'}`,
      description: `${strategy?.name} is now ${strategy?.isActive ? 'inactive' : 'active'}.`,
    });
  };

  const StrategyForm = ({ strategy }: { strategy?: BettingStrategy }) => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Strategy Name</Label>
          <Input
            id="name"
            placeholder="e.g., Conservative Favorites"
            defaultValue={strategy?.name}
          />
        </div>
        
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe your strategy approach..."
            defaultValue={strategy?.description}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="sport">Sport</Label>
          <Select defaultValue={strategy?.conditions.sport || "MLB"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MLB">MLB</SelectItem>
              <SelectItem value="CFL">CFL</SelectItem>
              <SelectItem value="NFL">NFL (Coming Soon)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="market">Market Type</Label>
          <Select defaultValue={strategy?.conditions.market || "Moneyline"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Moneyline">Moneyline</SelectItem>
              <SelectItem value="Spread">Spread</SelectItem>
              <SelectItem value="Total">Total</SelectItem>
              <SelectItem value="Props">Props</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="minOdds">Min Odds</Label>
          <Input
            id="minOdds"
            type="number"
            step="0.01"
            placeholder="1.20"
            defaultValue={strategy?.conditions.minOdds}
          />
        </div>

        <div>
          <Label htmlFor="maxOdds">Max Odds</Label>
          <Input
            id="maxOdds"
            type="number"
            step="0.01"
            placeholder="2.50"
            defaultValue={strategy?.conditions.maxOdds}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="confidence">Min AI Confidence (%)</Label>
          <Input
            id="confidence"
            type="number"
            min="1"
            max="100"
            placeholder="85"
            defaultValue={strategy?.conditions.confidenceThreshold}
          />
        </div>

        <div>
          <Label htmlFor="bankroll">Bankroll % per Bet</Label>
          <Input
            id="bankroll"
            type="number"
            step="0.1"
            min="0.1"
            max="10"
            placeholder="2.0"
            defaultValue={strategy?.conditions.bankrollPercentage}
          />
        </div>
      </div>

      <Button onClick={handleCreateStrategy} className="w-full">
        {strategy ? "Update Strategy" : "Create Strategy"}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Target className="h-8 w-8 text-yellow-600" />
              <h1 className="text-3xl font-bold text-foreground">Custom Betting Strategies</h1>
              <Badge className="bg-yellow-600 text-white">
                <Award className="h-3 w-3 mr-1" />
                Elite
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Create and manage personalized betting strategies with AI-driven criteria and automated execution.
            </p>
          </div>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-yellow-600 hover:bg-yellow-700">
                <Plus className="h-4 w-4 mr-2" />
                New Strategy
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Custom Strategy</DialogTitle>
              </DialogHeader>
              <StrategyForm />
            </DialogContent>
          </Dialog>
        </div>

        {/* Strategy Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Strategies</p>
                  <p className="text-2xl font-bold text-foreground">
                    {strategies.filter(s => s.isActive).length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Combined Profit</p>
                  <p className="text-2xl font-bold text-green-600">
                    +${strategies.reduce((sum, s) => sum + s.performance.profit, 0).toFixed(2)}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Win Rate</p>
                  <p className="text-2xl font-bold text-foreground">
                    {(strategies.reduce((sum, s) => sum + s.performance.winRate, 0) / strategies.length).toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Strategies List */}
        <div className="space-y-6">
          {strategies.map((strategy) => (
            <Card key={strategy.id} className={`border-2 ${strategy.isActive ? 'border-green-200 bg-green-50/50' : 'border-gray-200'}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-3">
                      <span>{strategy.name}</span>
                      <Badge variant={strategy.isActive ? "default" : "secondary"}>
                        {strategy.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </CardTitle>
                    <p className="text-muted-foreground mt-1">{strategy.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant={strategy.isActive ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleStrategy(strategy.id)}
                    >
                      {strategy.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <Tabs defaultValue="conditions">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="conditions">Strategy Conditions</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="conditions" className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Sport & Market</p>
                        <p className="font-medium">{strategy.conditions.sport} - {strategy.conditions.market}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Odds Range</p>
                        <p className="font-medium">{strategy.conditions.minOdds} - {strategy.conditions.maxOdds}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Min Confidence</p>
                        <p className="font-medium">{strategy.conditions.confidenceThreshold}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Bet Size</p>
                        <p className="font-medium">{strategy.conditions.bankrollPercentage}% of bankroll</p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="performance">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Bets</p>
                        <p className="text-2xl font-bold">{strategy.performance.totalBets}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Win Rate</p>
                        <p className="text-2xl font-bold text-green-600">{strategy.performance.winRate}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Profit</p>
                        <p className={`text-2xl font-bold ${strategy.performance.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {strategy.performance.profit >= 0 ? '+' : ''}${strategy.performance.profit.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">ROI</p>
                        <p className="text-2xl font-bold text-blue-600">{strategy.performance.roi}%</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Strategy Suggestions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5" />
              <span>AI Strategy Suggestions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Suggested: "Home Underdog Special"</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Based on your prediction history, consider targeting home underdogs with 70%+ AI confidence in day games.
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-blue-600">
                    Projected: 68% win rate, 14% ROI
                  </div>
                  <Button size="sm" variant="outline">
                    Create from Suggestion
                  </Button>
                </div>
              </div>
              
              <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Suggested: "Weather Totals"</h4>
                <p className="text-sm text-green-700 mb-3">
                  Target Over/Under bets when wind speed is below 8mph and AI confidence exceeds 80%.
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-green-600">
                    Projected: 72% win rate, 11% ROI
                  </div>
                  <Button size="sm" variant="outline">
                    Create from Suggestion
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}