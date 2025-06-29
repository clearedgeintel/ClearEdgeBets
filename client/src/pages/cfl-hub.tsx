import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Target, TrendingUp, Calendar, Users, Star, Zap, BarChart3 } from "lucide-react";

export default function CFLHub() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Trophy className="h-12 w-12 text-accent" />
              <h1 className="text-5xl font-bold">CFL Central</h1>
            </div>
            <p className="text-xl text-primary-foreground/80 max-w-3xl mx-auto">
              Your ultimate Canadian Football League destination. Expert analysis, betting intelligence, 
              and comprehensive coverage of all 9 CFL teams.
            </p>
            <div className="flex items-center justify-center space-x-6 pt-6">
              <Badge variant="secondary" className="bg-primary-foreground/10 text-white border-primary-foreground/20 px-4 py-2">
                <Calendar className="h-4 w-4 mr-2" />
                2025 Season
              </Badge>
              <Badge variant="secondary" className="bg-primary-foreground/10 text-white border-primary-foreground/20 px-4 py-2">
                <Users className="h-4 w-4 mr-2" />
                9 Teams
              </Badge>
              <Badge variant="secondary" className="bg-primary-foreground/10 text-white border-primary-foreground/20 px-4 py-2">
                <Zap className="h-4 w-4 mr-2" />
                Live Odds
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold text-foreground">18</div>
              <div className="text-sm text-muted-foreground">Regular Season Games</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <Target className="h-8 w-8 mx-auto mb-2 text-secondary" />
              <div className="text-2xl font-bold text-foreground">21</div>
              <div className="text-sm text-muted-foreground">Weeks of Action</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-accent" />
              <div className="text-2xl font-bold text-foreground">Nov</div>
              <div className="text-sm text-muted-foreground">Grey Cup 2025</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold text-foreground">Live</div>
              <div className="text-sm text-muted-foreground">Betting Markets</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Tabs defaultValue="teams" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="standings">Standings</TabsTrigger>
            <TabsTrigger value="betting">Betting Hub</TabsTrigger>
          </TabsList>

          <TabsContent value="teams" className="space-y-6">
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-3xl font-bold text-foreground">CFL Teams</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Complete coverage of all 9 Canadian Football League teams with betting analysis, 
                player stats, and expert insights.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* West Division */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center text-foreground">
                    <Trophy className="h-5 w-5 mr-2 text-accent" />
                    West Division
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { name: "BC Lions", city: "Vancouver", color: "orange" },
                    { name: "Calgary Stampeders", city: "Calgary", color: "red" },
                    { name: "Edmonton Elks", city: "Edmonton", color: "green" },
                    { name: "Saskatchewan Roughriders", city: "Regina", color: "green" },
                    { name: "Winnipeg Blue Bombers", city: "Winnipeg", color: "blue" }
                  ].map((team) => (
                    <div key={team.name} className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors cursor-pointer">
                      <div>
                        <div className="font-medium text-foreground">{team.name}</div>
                        <div className="text-sm text-muted-foreground">{team.city}</div>
                      </div>
                      <Badge variant="outline">Coming Soon</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* East Division */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center text-foreground">
                    <Trophy className="h-5 w-5 mr-2 text-accent" />
                    East Division
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { name: "Hamilton Tiger-Cats", city: "Hamilton", color: "yellow" },
                    { name: "Montreal Alouettes", city: "Montreal", color: "red" },
                    { name: "Ottawa Redblacks", city: "Ottawa", color: "red" },
                    { name: "Toronto Argonauts", city: "Toronto", color: "blue" }
                  ].map((team) => (
                    <div key={team.name} className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors cursor-pointer">
                      <div>
                        <div className="font-medium text-foreground">{team.name}</div>
                        <div className="text-sm text-muted-foreground">{team.city}</div>
                      </div>
                      <Badge variant="outline">Coming Soon</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center text-foreground">
                    <Zap className="h-5 w-5 mr-2 text-accent" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" variant="default">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Live Odds
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Weekly Schedule
                  </Button>
                  <Button className="w-full" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Team Analytics
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Target className="h-4 w-4 mr-2" />
                    Betting Insights
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-3xl font-bold text-foreground">CFL Schedule</h2>
              <p className="text-muted-foreground">
                Stay up to date with all CFL games, odds, and betting opportunities.
              </p>
            </div>
            
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold text-foreground mb-2">2025 CFL Schedule</h3>
                <p className="text-muted-foreground mb-6">
                  Complete schedule with live odds and betting lines coming soon.
                </p>
                <Badge variant="secondary">Feature in Development</Badge>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="standings" className="space-y-6">
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-3xl font-bold text-foreground">CFL Standings</h2>
              <p className="text-muted-foreground">
                Live standings, playoff implications, and championship odds.
              </p>
            </div>
            
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Live Standings</h3>
                <p className="text-muted-foreground mb-6">
                  Real-time standings with playoff scenarios and Grey Cup odds.
                </p>
                <Badge variant="secondary">Feature in Development</Badge>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="betting" className="space-y-6">
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-3xl font-bold text-foreground">CFL Betting Hub</h2>
              <p className="text-muted-foreground">
                Expert analysis, AI-powered picks, and comprehensive betting intelligence.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center text-foreground">
                    <Target className="h-5 w-5 mr-2 text-primary" />
                    AI Betting Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Advanced AI analysis of CFL games including player performance, 
                    weather conditions, and historical matchup data.
                  </p>
                  <Badge variant="secondary">Coming Soon</Badge>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center text-foreground">
                    <TrendingUp className="h-5 w-5 mr-2 text-secondary" />
                    Live Odds Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Real-time odds comparison across major sportsbooks with 
                    line movement alerts and value bet identification.
                  </p>
                  <Badge variant="secondary">Coming Soon</Badge>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}