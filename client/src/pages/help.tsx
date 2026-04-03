import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  HelpCircle, 
  TrendingUp, 
  Calculator, 
  Brain, 
  BarChart3, 
  Users, 
  Zap,
  Target,
  DollarSign,
  BookOpen
} from 'lucide-react';

export default function Help() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Help & User Guide</h1>
        <p className="text-muted-foreground">
          Get the most out of ClearEdge Sports with our comprehensive platform guide
        </p>
      </div>

      <div className="grid gap-6">
        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Free Tier Features</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>View today's MLB games with basic odds</li>
                <li>Access top 3 daily AI picks with reasoning</li>
                <li>Browse latest MLB news and updates</li>
                <li>Use basic Kelly Calculator for bet sizing</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Subscription Benefits</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Badge variant="outline" className="mb-2">Pro Tier - $25/month</Badge>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Unlimited daily AI picks with analysis</li>
                    <li>Hot trends and market insights</li>
                    <li>Odds comparison across sportsbooks</li>
                    <li>Advanced Kelly Calculator features</li>
                    <li>Email and Telegram notifications</li>
                  </ul>
                </div>
                <div>
                  <Badge variant="outline" className="mb-2">Elite Tier - $40/month</Badge>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>AI Betting Assistant for instant answers</li>
                    <li>Advanced prop finder and parlay builder</li>
                    <li>Performance analytics and custom strategies</li>
                    <li>Live line movement tracking</li>
                    <li>Priority support and early access features</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Platform Features Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Picks & Analysis
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                Our AI analyzes pitcher matchups, team performance, weather conditions, and historical data to identify value opportunities.
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Confidence Levels:</strong> 70%+ indicates strong conviction picks</li>
                <li><strong>Expected Value:</strong> Shows potential profit margin based on true odds vs. sportsbook odds</li>
                <li><strong>Reasoning:</strong> Detailed explanation of factors influencing each pick</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Kelly Calculator
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                Optimize your bet sizing using the Kelly Criterion for maximum long-term growth.
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Win Probability:</strong> Enter your estimated chance of winning (convert from confidence %)</li>
                <li><strong>Bankroll:</strong> Your total prediction budget</li>
                <li><strong>Odds:</strong> Use American format (-110, +150, etc.)</li>
                <li><strong>Suggested Bet:</strong> Recommended stake size (typically 1-5% of bankroll)</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Hot Trends
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                Track profitable betting patterns and market inefficiencies.
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Recent examples show actual game dates for verification</li>
                <li>ROI percentages based on theoretical $100 unit betting</li>
                <li>Trend strength indicates sustainability over time</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Performance Analytics
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                Track your prediction performance with detailed monthly breakdowns.
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click on any month to see detailed bet-by-bet analysis</li>
                <li>ROI calculations help identify profitable strategies</li>
                <li>Win rate tracking across different bet types</li>
                <li>Bankroll growth visualization over time</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Advanced Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Betting Assistant <Badge variant="secondary">Elite</Badge>
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                Ask specific questions about today's games and get AI-powered insights.
              </p>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">Example Questions:</p>
                <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                  <li>"Which unders have the best value today?"</li>
                  <li>"What are your highest confidence picks?"</li>
                  <li>"Which games have the best contrarian opportunities?"</li>
                  <li>"How does weather affect today's totals?"</li>
                </ul>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Parlay Builder <Badge variant="secondary">Elite</Badge>
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                Construct intelligent parlays with EV calculations and risk assessment.
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Drag and drop legs to build your parlay</li>
                <li>Real-time odds multiplication and payout calculation</li>
                <li>Kelly Criterion guidance for parlay sizing</li>
                <li>Correlation warnings for related bets</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Groups & Virtual Betting
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                Create betting groups and track performance with virtual money.
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Start with $10,000 virtual bankroll</li>
                <li>Compete with friends on leaderboards</li>
                <li>Practice strategies risk-free</li>
                <li>Track performance over time</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Tips & Best Practices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Tips & Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Bankroll Management</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Never bet more than 5% of your bankroll on a single game</li>
                <li>Use the Kelly Calculator to optimize bet sizing</li>
                <li>Track all bets to identify profitable patterns</li>
                <li>Set stop-loss limits to protect your bankroll</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Using AI Picks Effectively</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Focus on picks with 75%+ confidence for higher success rates</li>
                <li>Read the reasoning to understand the analytical edge</li>
                <li>Compare odds across multiple sportsbooks for best value</li>
                <li>Consider game-time factors like weather and lineup changes</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Market Analysis</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Look for line movement against public betting percentages</li>
                <li>Target games with strong pitcher advantages and low totals</li>
                <li>Consider weather impacts on outdoor venues</li>
                <li>Fade heavily bet favorites with inflated lines</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Advanced Strategies</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Build correlated same-game parlays for higher payouts</li>
                <li>Target relief pitcher mismatches in late innings</li>
                <li>Consider first-five-inning bets to avoid bullpen variance</li>
                <li>Use contrarian approach when public is heavily on one side</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Contact & Support */}
        <Card>
          <CardHeader>
            <CardTitle>Contact & Support</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              For technical support, billing questions, or feature requests, please contact our support team. 
              We're here to help you maximize your betting intelligence and platform experience.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}