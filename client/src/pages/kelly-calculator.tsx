import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, AlertTriangle, DollarSign } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function KellyCalculator() {
  const { user } = useAuth();
  const [odds, setOdds] = useState<string>("");
  const [winProbability, setWinProbability] = useState<string>("");
  const [bankroll, setBankroll] = useState<string>("");
  const [result, setResult] = useState<{
    kellyPercentage: number;
    recommendedBet: number;
    expectedValue: number;
  } | null>(null);

  const calculateKelly = () => {
    const oddsNum = parseFloat(odds);
    const probNum = parseFloat(winProbability) / 100;
    const bankrollNum = parseFloat(bankroll);

    if (isNaN(oddsNum) || isNaN(probNum) || isNaN(bankrollNum)) {
      return;
    }

    // Convert American odds to decimal
    const decimalOdds = oddsNum > 0 ? (oddsNum / 100) + 1 : (100 / Math.abs(oddsNum)) + 1;
    
    // Kelly formula: f = (bp - q) / b
    // where b = odds received on the wager, p = probability of winning, q = probability of losing
    const b = decimalOdds - 1;
    const q = 1 - probNum;
    const kellyFraction = (b * probNum - q) / b;
    
    const kellyPercentage = Math.max(0, kellyFraction * 100);
    const recommendedBet = bankrollNum * (kellyPercentage / 100);
    const expectedValue = ((decimalOdds * probNum) - 1) * 100;

    setResult({
      kellyPercentage: Math.round(kellyPercentage * 100) / 100,
      recommendedBet: Math.round(recommendedBet * 100) / 100,
      expectedValue: Math.round(expectedValue * 100) / 100
    });
  };

  const clearCalculation = () => {
    setOdds("");
    setWinProbability("");
    setBankroll("");
    setResult(null);
  };

  // Check if user has Pro or Elite access
  const hasAccess = user && (user.subscriptionTier === 'pro' || user.subscriptionTier === 'elite');

  if (!hasAccess) {
    return (
      <div className="p-8 space-y-8">
        <div className="text-center">
          <Calculator className="mx-auto h-16 w-16 text-blue-400 mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Kelly Calculator</h1>
          <p className="text-gray-400 mb-6">
            Optimize your bet sizing with mathematical precision using the Kelly Criterion
          </p>
          <Badge className="bg-blue-600 text-white mb-6">
            <TrendingUp className="w-3 h-3 mr-1" />
            Pro Feature
          </Badge>
        </div>

        <Card className="bg-gray-800 border-gray-700 max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-white">Upgrade to Pro Required</CardTitle>
            <CardDescription className="text-gray-400">
              The Kelly Calculator helps you determine optimal bet sizes based on your edge and bankroll management strategy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <Calculator className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <h3 className="font-semibold text-white">Mathematical Precision</h3>
                <p className="text-sm text-gray-400">Calculate exact bet sizes using the Kelly Criterion formula</p>
              </div>
              <div>
                <TrendingUp className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <h3 className="font-semibold text-white">Bankroll Management</h3>
                <p className="text-sm text-gray-400">Protect your funds while maximizing long-term growth</p>
              </div>
              <div>
                <DollarSign className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                <h3 className="font-semibold text-white">Expected Value</h3>
                <p className="text-sm text-gray-400">See the mathematical edge of each betting opportunity</p>
              </div>
            </div>
            <div className="text-center pt-4">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <a href="/subscribe" className="flex items-center">
                  Upgrade to Pro - $9.99/month
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="text-center">
        <Calculator className="mx-auto h-16 w-16 text-blue-400 mb-4" />
        <h1 className="text-3xl font-bold text-white mb-2">Kelly Calculator</h1>
        <p className="text-gray-400 mb-4">
          Optimize your bet sizing with mathematical precision using the Kelly Criterion
        </p>
        <Badge className="bg-blue-600 text-white">
          <TrendingUp className="w-3 h-3 mr-1" />
          Pro Feature
        </Badge>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calculator Input */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Calculator className="h-5 w-5 mr-2" />
              Kelly Criterion Calculator
            </CardTitle>
            <CardDescription className="text-gray-400">
              Enter your betting parameters to calculate optimal bet size
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="odds" className="text-gray-300">American Odds</Label>
              <Input
                id="odds"
                type="number"
                placeholder="e.g., +150 or -110"
                value={odds}
                onChange={(e) => setOdds(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="probability" className="text-gray-300">Win Probability (%)</Label>
              <Input
                id="probability"
                type="number"
                placeholder="e.g., 60"
                min="0"
                max="100"
                value={winProbability}
                onChange={(e) => setWinProbability(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankroll" className="text-gray-300">Total Bankroll ($)</Label>
              <Input
                id="bankroll"
                type="number"
                placeholder="e.g., 1000"
                value={bankroll}
                onChange={(e) => setBankroll(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div className="flex space-x-3">
              <Button onClick={calculateKelly} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Calculate Kelly
              </Button>
              <Button onClick={clearCalculation} variant="outline" className="border-gray-600 text-gray-300">
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Kelly Calculation Results
            </CardTitle>
            <CardDescription className="text-gray-400">
              Optimal bet sizing recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-400 mb-2">
                    {result.kellyPercentage}%
                  </div>
                  <p className="text-gray-400">of bankroll to wager</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-700 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-400 mx-auto mb-2" />
                    <div className="text-xl font-semibold text-white">${result.recommendedBet}</div>
                    <p className="text-sm text-gray-400">Recommended Bet</p>
                  </div>
                  <div className="text-center p-4 bg-gray-700 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
                    <div className="text-xl font-semibold text-white">{result.expectedValue}%</div>
                    <p className="text-sm text-gray-400">Expected Value</p>
                  </div>
                </div>

                {result.kellyPercentage > 25 && (
                  <div className="flex items-start space-x-2 p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-yellow-300 font-medium">High Kelly Percentage Warning</p>
                      <p className="text-yellow-200 text-sm">
                        Consider reducing bet size. High Kelly percentages can lead to significant variance.
                      </p>
                    </div>
                  </div>
                )}

                {result.expectedValue < 0 && (
                  <div className="flex items-start space-x-2 p-3 bg-red-900/20 border border-red-700 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-red-300 font-medium">Negative Expected Value</p>
                      <p className="text-red-200 text-sm">
                        This bet has negative expected value. Consider avoiding this wager.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calculator className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Enter your betting parameters to see Kelly calculation results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Educational Content */}
      <Card className="bg-gray-800 border-gray-700 max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-white">Understanding the Kelly Criterion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-gray-300">
          <p>
            The Kelly Criterion is a mathematical formula used to determine the optimal size of a series of bets. 
            It helps maximize long-term growth while minimizing the risk of ruin.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-white mb-2">How it Works:</h3>
              <ul className="space-y-1 text-sm">
                <li>• Formula: f = (bp - q) / b</li>
                <li>• f = fraction of bankroll to wager</li>
                <li>• b = odds received on the wager</li>
                <li>• p = probability of winning</li>
                <li>• q = probability of losing (1 - p)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Best Practices:</h3>
              <ul className="space-y-1 text-sm">
                <li>• Never bet more than 25% of bankroll</li>
                <li>• Only bet when you have an edge (positive EV)</li>
                <li>• Be conservative with probability estimates</li>
                <li>• Consider fractional Kelly for reduced variance</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}