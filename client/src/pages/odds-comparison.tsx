import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface OddsComparison {
  gameId: string;
  awayTeam: string;
  homeTeam: string;
  gameTime: string;
  venue: string;
  bookmakers: {
    name: string;
    moneyline: { away: number; home: number };
    spread: { away: number; home: number; line: number };
    total: { over: number; under: number; line: number };
    bestLines: {
      moneylineAway: boolean;
      moneylineHome: boolean;
      spreadAway: boolean;
      spreadHome: boolean;
      totalOver: boolean;
      totalUnder: boolean;
    };
  }[];
}

export default function OddsComparison() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: oddsData, isLoading } = useQuery({
    queryKey: ['/api/odds-comparison', selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/odds-comparison?date=${selectedDate}`);
      if (!response.ok) throw new Error('Failed to fetch odds comparison');
      return response.json() as OddsComparison[];
    }
  });

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const getMovementIcon = (movement: 'up' | 'down' | 'neutral') => {
    switch (movement) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-red-500" />;
      default: return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Odds Comparison</h1>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded mb-4"></div>
                <div className="grid grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-20 bg-muted rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Odds Comparison</h1>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          />
          <Badge variant="secondary">Pro Feature</Badge>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-muted-foreground">
          Compare odds across multiple sportsbooks to find the best lines. 
          Best available odds are highlighted in green.
        </p>
      </div>

      <div className="grid gap-6">
        {oddsData?.map((game) => (
          <Card key={game.gameId}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div>
                  <span className="text-lg">{game.awayTeam} @ {game.homeTeam}</span>
                  <p className="text-sm text-muted-foreground font-normal">
                    {new Date(game.gameTime).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })} • {new Date(game.gameTime).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })} • {game.venue}
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="moneyline" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="moneyline">Moneyline</TabsTrigger>
                  <TabsTrigger value="spread">Spread</TabsTrigger>
                  <TabsTrigger value="total">Total</TabsTrigger>
                </TabsList>

                <TabsContent value="moneyline" className="mt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Sportsbook</th>
                          <th className="text-center p-2">{game.awayTeam}</th>
                          <th className="text-center p-2">{game.homeTeam}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {game.bookmakers.map((book) => (
                          <tr key={book.name} className="border-b">
                            <td className="p-2 font-medium">{book.name}</td>
                            <td className={`text-center p-2 ${
                              book.bestLines.moneylineAway 
                                ? 'bg-green-100 dark:bg-green-900/20 font-bold text-green-700 dark:text-green-400' 
                                : ''
                            }`}>
                              {formatOdds(book.moneyline.away)}
                            </td>
                            <td className={`text-center p-2 ${
                              book.bestLines.moneylineHome 
                                ? 'bg-green-100 dark:bg-green-900/20 font-bold text-green-700 dark:text-green-400' 
                                : ''
                            }`}>
                              {formatOdds(book.moneyline.home)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="spread" className="mt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Sportsbook</th>
                          <th className="text-center p-2">{game.awayTeam}</th>
                          <th className="text-center p-2">{game.homeTeam}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {game.bookmakers.map((book) => (
                          <tr key={book.name} className="border-b">
                            <td className="p-2 font-medium">{book.name}</td>
                            <td className={`text-center p-2 ${
                              book.bestLines.spreadAway 
                                ? 'bg-green-100 dark:bg-green-900/20 font-bold text-green-700 dark:text-green-400' 
                                : ''
                            }`}>
                              {book.spread.line > 0 ? `+${book.spread.line}` : `${book.spread.line}`} ({formatOdds(book.spread.away)})
                            </td>
                            <td className={`text-center p-2 ${
                              book.bestLines.spreadHome 
                                ? 'bg-green-100 dark:bg-green-900/20 font-bold text-green-700 dark:text-green-400' 
                                : ''
                            }`}>
                              {book.spread.line > 0 ? `${-book.spread.line}` : `+${-book.spread.line}`} ({formatOdds(book.spread.home)})
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="total" className="mt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Sportsbook</th>
                          <th className="text-center p-2">Over</th>
                          <th className="text-center p-2">Under</th>
                        </tr>
                      </thead>
                      <tbody>
                        {game.bookmakers.map((book) => (
                          <tr key={book.name} className="border-b">
                            <td className="p-2 font-medium">{book.name}</td>
                            <td className={`text-center p-2 ${
                              book.bestLines.totalOver 
                                ? 'bg-green-100 dark:bg-green-900/20 font-bold text-green-700 dark:text-green-400' 
                                : ''
                            }`}>
                              O{book.total.line} ({formatOdds(book.total.over)})
                            </td>
                            <td className={`text-center p-2 ${
                              book.bestLines.totalUnder 
                                ? 'bg-green-100 dark:bg-green-900/20 font-bold text-green-700 dark:text-green-400' 
                                : ''
                            }`}>
                              U{book.total.line} ({formatOdds(book.total.under)})
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!oddsData || oddsData.length === 0) && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No games found for the selected date.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}