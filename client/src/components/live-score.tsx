import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Clock, Play, CheckCircle } from "lucide-react";

interface LiveScoreProps {
  gameId: string;
  awayTeam: string;
  homeTeam: string;
  className?: string;
}

interface LiveGameInfo {
  status: string;
  awayScore: number | null;
  homeScore: number | null;
  inning: number | null;
  inningHalf: 'top' | 'bottom' | null;
  outs: number | null;
  balls: number | null;
  strikes: number | null;
  runnersOn: any;
  lastPlay: string | null;
}

export function LiveScore({ gameId, awayTeam, homeTeam, className }: LiveScoreProps) {
  const { data: liveInfo, isLoading } = useQuery<LiveGameInfo>({
    queryKey: ['/api/live-game', gameId],
    refetchInterval: (query) => {
      // Only refetch if game is live
      return query.state.data?.status === 'live' ? 30000 : false; // 30 seconds
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!liveInfo) {
    return null;
  }

  const getStatusIcon = () => {
    switch (liveInfo.status) {
      case 'live':
        return <Play className="h-4 w-4 text-green-500" />;
      case 'final':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    switch (liveInfo.status) {
      case 'live':
        return (
          <Badge variant="outline" className="border-green-500 text-green-500">
            LIVE
          </Badge>
        );
      case 'final':
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-500">
            FINAL
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge variant="outline" className="border-gray-500 text-gray-500">
            SCHEDULED
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatInning = () => {
    if (!liveInfo.inning || !liveInfo.inningHalf) return '';
    
    const half = liveInfo.inningHalf === 'top' ? 'T' : 'B';
    return `${half}${liveInfo.inning}`;
  };

  const formatCount = () => {
    if (liveInfo.balls === null || liveInfo.strikes === null || liveInfo.outs === null) {
      return '';
    }
    return `${liveInfo.balls}-${liveInfo.strikes}, ${liveInfo.outs} out${liveInfo.outs !== 1 ? 's' : ''}`;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Status and Score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          {getStatusBadge()}
        </div>
        
        {(liveInfo.awayScore !== null && liveInfo.homeScore !== null) && (
          <div className="text-lg font-semibold">
            <span className="text-muted-foreground">
              {awayTeam.split(' ').pop()}: {liveInfo.awayScore}
            </span>
            <span className="mx-2">-</span>
            <span className="text-foreground">
              {homeTeam.split(' ').pop()}: {liveInfo.homeScore}
            </span>
          </div>
        )}
      </div>

      {/* Live Game Details */}
      {liveInfo.status === 'live' && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            {liveInfo.inning && liveInfo.inningHalf && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="px-2 py-1">
                  {formatInning()}
                </Badge>
                {formatCount() && (
                  <span className="text-muted-foreground">
                    {formatCount()}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {liveInfo.lastPlay && (
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              <strong>Last Play:</strong> {liveInfo.lastPlay}
            </div>
          )}
          
          {liveInfo.runnersOn && Object.keys(liveInfo.runnersOn).length > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-muted-foreground">Runners:</span>
              <div className="flex gap-1">
                {liveInfo.runnersOn.first && <Badge variant="outline" className="h-5 px-1">1st</Badge>}
                {liveInfo.runnersOn.second && <Badge variant="outline" className="h-5 px-1">2nd</Badge>}
                {liveInfo.runnersOn.third && <Badge variant="outline" className="h-5 px-1">3rd</Badge>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Final Game Summary */}
      {liveInfo.status === 'final' && liveInfo.lastPlay && (
        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          <strong>Game Summary:</strong> {liveInfo.lastPlay}
        </div>
      )}
    </div>
  );
}