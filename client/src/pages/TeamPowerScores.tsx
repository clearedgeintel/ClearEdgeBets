import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Activity, Target, Zap, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TeamPowerScore {
  team: string;
  advBattingScore: number;
  pitchingScore: number;
  teamPowerScore: number;
  lastUpdated: string;
  rank: number;
  percentile: number;
  battingRank: number;
  pitchingRank: number;
}

export default function TeamPowerScores() {
  const { data: powerScores, isLoading, error } = useQuery<TeamPowerScore[]>({
    queryKey: ["/api/team-power-scores"],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Team Power Scores</CardTitle>
            <CardDescription>
              Unable to fetch team power scores from Baseball Reference. Please try again later.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const topTeam = powerScores?.[0];
  const bottomTeam = powerScores && powerScores.length > 0 ? powerScores[powerScores.length - 1] : null;
  const averageScore = powerScores ? powerScores.reduce((sum: number, team: TeamPowerScore) => sum + team.teamPowerScore, 0) / powerScores.length : 0;

  const getRankColor = (rank: number) => {
    if (rank <= 5) return "bg-green-500";
    if (rank <= 10) return "bg-blue-500";
    if (rank <= 20) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 80) return "text-green-600";
    if (percentile >= 60) return "text-blue-600";
    if (percentile >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">MLB Team Power Rankings</h1>
        <p className="text-muted-foreground">
          Live team power scores calculated from authentic Baseball Reference statistics.
          Updated {powerScores && powerScores.length > 0 && powerScores[0].lastUpdated ? new Date(powerScores[0].lastUpdated).toLocaleString() : 'recently'}.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">League Leader</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{topTeam?.team}</div>
            <p className="text-xs text-muted-foreground">
              Power Score: {topTeam?.teamPowerScore} (Rank #{topTeam?.rank})
            </p>
            <div className="mt-2 flex gap-2">
              <Badge variant="outline" className="text-xs">
                <Target className="mr-1 h-3 w-3" />
                Batting #{topTeam?.battingRank}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Shield className="mr-1 h-3 w-3" />
                Pitching #{topTeam?.pitchingRank}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">League Average</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{averageScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Power Score Baseline
            </p>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                30 Teams Analyzed
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Improvement</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{bottomTeam?.team}</div>
            <p className="text-xs text-muted-foreground">
              Power Score: {bottomTeam?.teamPowerScore} (Rank #{bottomTeam?.rank})
            </p>
            <div className="mt-2 flex gap-2">
              <Badge variant="outline" className="text-xs">
                <Target className="mr-1 h-3 w-3" />
                Batting #{bottomTeam?.battingRank}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Shield className="mr-1 h-3 w-3" />
                Pitching #{bottomTeam?.pitchingRank}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Rankings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Complete Team Power Rankings
          </CardTitle>
          <CardDescription>
            Comprehensive analysis combining batting performance (60% weight) and pitching performance (40% weight).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-center">Power Score</TableHead>
                <TableHead className="text-center">Percentile</TableHead>
                <TableHead className="text-center">Batting Score</TableHead>
                <TableHead className="text-center">Pitching Score</TableHead>
                <TableHead className="text-center">Batting Rank</TableHead>
                <TableHead className="text-center">Pitching Rank</TableHead>
                <TableHead>Strength Profile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {powerScores && powerScores.map((team: TeamPowerScore) => (
                <TableRow key={team.team}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getRankColor(team.rank)}`} />
                      <span className="font-medium">#{team.rank}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-lg">{team.team}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="text-2xl font-bold">{team.teamPowerScore}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className={`font-semibold ${getPercentileColor(team.percentile)}`}>
                      {team.percentile}th
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="space-y-1">
                      <div className="font-medium">{team.advBattingScore}</div>
                      <Progress value={(team.advBattingScore / 100) * 100} className="h-1" />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="space-y-1">
                      <div className="font-medium">{team.pitchingScore}</div>
                      <Progress value={(team.pitchingScore / 100) * 100} className="h-1" />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-xs">
                      #{team.battingRank}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-xs">
                      #{team.pitchingRank}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {team.battingRank <= team.pitchingRank ? (
                        <Badge className="bg-orange-100 text-orange-800 text-xs">
                          <Target className="mr-1 h-3 w-3" />
                          Offense-First
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          <Shield className="mr-1 h-3 w-3" />
                          Pitching-First
                        </Badge>
                      )}
                      {Math.abs(team.battingRank - team.pitchingRank) <= 3 && (
                        <Badge variant="outline" className="text-xs">
                          Balanced
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Methodology */}
      <Card>
        <CardHeader>
          <CardTitle>Power Score Methodology</CardTitle>
          <CardDescription>Understanding how team power scores are calculated</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-orange-600" />
                Batting Score (60% Weight)
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• OPS (On-base Plus Slugging): 40%</li>
                <li>• Runs per Game: 25%</li>
                <li>• Home Runs: 15%</li>
                <li>• Batting Average: 10%</li>
                <li>• Walks: 10%</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                Pitching Score (40% Weight)
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• ERA (Earned Run Average): 35%</li>
                <li>• WHIP (Walks + Hits per Inning): 25%</li>
                <li>• Strikeouts per 9 Innings: 20%</li>
                <li>• Saves: 10%</li>
                <li>• Complete Games: 10%</li>
              </ul>
            </div>
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Data Source:</strong> All statistics are extracted in real-time from Baseball Reference, 
              ensuring authentic and up-to-date team performance metrics. Power scores are recalculated with 
              fresh data on every request to provide the most current team rankings and analysis.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}