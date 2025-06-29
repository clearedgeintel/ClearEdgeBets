import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface KellyResult {
  kellyFraction: number;
  kellyPercentage: number;
  suggestedBet: number;
  bankrollPercentage: number;
}

export default function KellyCalculator() {
  const [odds, setOdds] = useState<string>("");
  const [winProbability, setWinProbability] = useState<string>("");
  const [bankroll, setBankroll] = useState<string>("");
  const [result, setResult] = useState<KellyResult | null>(null);

  const calculateMutation = useMutation({
    mutationFn: async (data: { odds: number; winProbability: number; bankroll: number }) => {
      const response = await apiRequest("POST", "/api/kelly", data);
      return response.json();
    },
    onSuccess: (data: KellyResult) => {
      setResult(data);
    },
  });

  const handleCalculate = () => {
    const oddsNum = parseInt(odds);
    const probNum = parseFloat(winProbability);
    const bankrollNum = parseFloat(bankroll);

    if (!oddsNum || !probNum || !bankrollNum) {
      return;
    }

    if (probNum < 0 || probNum > 100) {
      return;
    }

    calculateMutation.mutate({
      odds: oddsNum,
      winProbability: probNum,
      bankroll: bankrollNum
    });
  };

  const isFormValid = odds && winProbability && bankroll;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Calculator className="h-5 w-5 text-primary" />
          <span>Kelly Calculator</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="odds" className="text-xs text-gray-600 mb-1 block">
            American Odds
          </Label>
          <Input
            id="odds"
            type="number"
            placeholder="-110"
            value={odds}
            onChange={(e) => setOdds(e.target.value)}
            className="text-sm"
          />
        </div>
        
        <div>
          <Label htmlFor="winProbability" className="text-xs text-gray-600 mb-1 block">
            Win Probability (%)
          </Label>
          <Input
            id="winProbability"
            type="number"
            placeholder="55"
            min="0"
            max="100"
            value={winProbability}
            onChange={(e) => setWinProbability(e.target.value)}
            className="text-sm"
          />
        </div>
        
        <div>
          <Label htmlFor="bankroll" className="text-xs text-gray-600 mb-1 block">
            Bankroll ($)
          </Label>
          <Input
            id="bankroll"
            type="number"
            placeholder="1000"
            min="0"
            value={bankroll}
            onChange={(e) => setBankroll(e.target.value)}
            className="text-sm"
          />
        </div>
        
        <Button 
          className="w-full bg-primary text-white hover:bg-blue-700 text-sm"
          onClick={handleCalculate}
          disabled={!isFormValid || calculateMutation.isPending}
        >
          {calculateMutation.isPending ? "Calculating..." : "Calculate Optimal Bet"}
        </Button>
        
        {result && (
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-600">Suggested Bet Size</p>
            <p className="font-bold text-lg text-primary">
              ${result.suggestedBet.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">
              {result.bankrollPercentage.toFixed(2)}% of bankroll
            </p>
            {result.kellyPercentage <= 0 && (
              <p className="text-xs text-red-600 mt-1">
                No positive expected value
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
