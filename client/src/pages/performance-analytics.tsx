import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  DollarSign, 
  BarChart3, 
  Calendar,
  Award,
  Activity,
  PieChart,
  LineChart
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface PerformanceMetrics {
  totalBets: number;
  winRate: number;
  totalProfit: number;
  roi: number;
  avgOdds: number;
  streakCount: number;
  streakType: 'win' | 'loss';
  bestSport: string;
  bestMarket: string;
  monthlyBreakdown: Array<{
    month: string;
    profit: number;
    bets: number;
    winRate: number;
  }>;
  marketBreakdown: Array<{
    market: string;
    bets: number;
    winRate: number;
    profit: number;
  }>;
}

export default function PerformanceAnalytics() {
  const { user, hasAccess } = useAuth();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['/api/performance/analytics'],
    enabled: hasAccess('elite')
  });

  if (!hasAccess('elite')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Award className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
            <h2 className="text-2xl font-bold mb-2">Elite Feature</h2>
            <p className="text-muted-foreground mb-4">
              Performance Analytics is an Elite tier feature. Upgrade to access advanced betting insights and detailed performance tracking.
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-6 bg-muted rounded mb-4"></div>
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Mock data for demonstration
  const performanceData: PerformanceMetrics = (metrics as PerformanceMetrics) || {
    totalBets: 247,
    winRate: 64.8,
    totalProfit: 1247.50,
    roi: 12.4,
    avgOdds: 1.85,
    streakCount: 7,
    streakType: 'win',
    bestSport: 'MLB',
    bestMarket: 'Moneyline',
    monthlyBreakdown: [
      { month: 'Jan', profit: 187.50, bets: 42, winRate: 61.9 },
      { month: 'Feb', profit: 312.25, bets: 38, winRate: 68.4 },
      { month: 'Mar', profit: 256.75, bets: 45, winRate: 62.2 },
      { month: 'Apr', profit: 491.00, bets: 51, winRate: 70.6 },
      { month: 'May', profit: -89.50, bets: 39, winRate: 48.7 },
      { month: 'Jun', profit: 89.50, bets: 32, winRate: 65.6 }
    ],
    marketBreakdown: [
      { market: 'Moneyline', bets: 98, winRate: 71.4, profit: 687.25 },
      { market: 'Spread', bets: 76, winRate: 59.2, profit: 324.75 },
      { market: 'Total', bets: 45, winRate: 62.2, profit: 156.50 },
      { market: 'Props', bets: 28, winRate: 60.7, profit: 79.00 }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <BarChart3 className="h-8 w-8 text-yellow-600" />
            <h1 className="text-3xl font-bold text-foreground">Performance Analytics</h1>
            <Badge className="bg-yellow-600 text-white">
              <Award className="h-3 w-3 mr-1" />
              Elite
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Advanced insights into your betting performance with detailed breakdowns and trends.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="text-2xl font-bold text-foreground">{performanceData.winRate}%</p>
                  <Progress value={performanceData.winRate} className="mt-2" />
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
                  <p className="text-sm text-muted-foreground">Total Profit</p>
                  <p className={`text-2xl font-bold ${performanceData.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${performanceData.totalProfit.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">ROI: {performanceData.roi}%</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                  <p className="text-2xl font-bold text-foreground">{performanceData.streakCount}</p>
                  <p className={`text-sm capitalize ${performanceData.streakType === 'win' ? 'text-green-600' : 'text-red-600'}`}>
                    {performanceData.streakType} streak
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  {performanceData.streakType === 'win' ? (
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-purple-600" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Bets</p>
                  <p className="text-2xl font-bold text-foreground">{performanceData.totalBets}</p>
                  <p className="text-sm text-muted-foreground">Avg odds: {performanceData.avgOdds}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Activity className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="monthly" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="monthly">Monthly Breakdown</TabsTrigger>
            <TabsTrigger value="markets">Market Analysis</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="monthly">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Monthly Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceData.monthlyBreakdown.map((month) => (
                    <div key={month.month} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm font-medium w-12">{month.month}</div>
                        <div className="text-sm text-muted-foreground">{month.bets} bets</div>
                        <div className="text-sm text-muted-foreground">{month.winRate}% win rate</div>
                      </div>
                      <div className={`text-lg font-bold ${month.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {month.profit >= 0 ? '+' : ''}${month.profit.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="markets">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5" />
                  <span>Market Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceData.marketBreakdown.map((market) => (
                    <div key={market.market} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm font-medium w-20">{market.market}</div>
                        <div className="text-sm text-muted-foreground">{market.bets} bets</div>
                        <div className="text-sm text-muted-foreground">{market.winRate}% win rate</div>
                        <Progress value={market.winRate} className="w-20" />
                      </div>
                      <div className={`text-lg font-bold ${market.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {market.profit >= 0 ? '+' : ''}${market.profit.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <LineChart className="h-5 w-5" />
                  <span>AI Performance Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Strengths</h4>
                    <ul className="space-y-1 text-sm text-green-700">
                      <li>• Excellent performance on {performanceData.bestMarket} bets (71.4% win rate)</li>
                      <li>• Strong April performance with 70.6% win rate</li>
                      <li>• Current 7-game winning streak shows good momentum</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-2">Areas for Improvement</h4>
                    <ul className="space-y-1 text-sm text-yellow-700">
                      <li>• May showed negative returns - review strategy during that period</li>
                      <li>• Spread betting could be optimized (59.2% win rate)</li>
                      <li>• Consider increasing stake on high-confidence Moneyline bets</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Recommendations</h4>
                    <ul className="space-y-1 text-sm text-blue-700">
                      <li>• Focus more on Moneyline bets where you excel</li>
                      <li>• Consider reducing exposure to Total bets</li>
                      <li>• Your ROI of 12.4% is excellent - maintain current approach</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}