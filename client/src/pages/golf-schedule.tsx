import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, ChevronRight, MapPin, DollarSign, Trophy, Users, Clock, Flag } from "lucide-react";

interface GolfTournament {
  id: string;
  name: string;
  venue: string;
  location: string;
  startDate: string;
  endDate: string;
  purse: number;
  field: number;
  status: 'upcoming' | 'in-progress' | 'completed';
  tour: 'PGA' | 'LIV' | 'European';
  major: boolean;
  featured?: boolean;
}

export default function GolfSchedule() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: tournaments, isLoading } = useQuery<GolfTournament[]>({
    queryKey: ['/api/golf/tournaments'],
  });

  // Mock tournament data with realistic 2025 PGA Tour schedule
  const mockTournaments: GolfTournament[] = [
    {
      id: "sentry-tournament-2025",
      name: "Sentry Tournament of Champions",
      venue: "Kapalua Golf Club",
      location: "Maui, HI",
      startDate: "2025-01-02",
      endDate: "2025-01-05",
      purse: 20000000,
      field: 59,
      status: 'upcoming',
      tour: 'PGA',
      major: false,
      featured: true
    },
    {
      id: "sony-open-2025",
      name: "Sony Open in Hawaii",
      venue: "Waialae Country Club",
      location: "Honolulu, HI",
      startDate: "2025-01-09",
      endDate: "2025-01-12",
      purse: 8300000,
      field: 144,
      status: 'upcoming',
      tour: 'PGA',
      major: false
    },
    {
      id: "farmers-insurance-2025",
      name: "Farmers Insurance Open",
      venue: "Torrey Pines Golf Course",
      location: "San Diego, CA",
      startDate: "2025-01-23",
      endDate: "2025-01-26",
      purse: 8400000,
      field: 156,
      status: 'upcoming',
      tour: 'PGA',
      major: false
    },
    {
      id: "wm-phoenix-open-2025",
      name: "WM Phoenix Open",
      venue: "TPC Scottsdale",
      location: "Scottsdale, AZ",
      startDate: "2025-01-30",
      endDate: "2025-02-02",
      purse: 9100000,
      field: 132,
      status: 'upcoming',
      tour: 'PGA',
      major: false,
      featured: true
    },
    {
      id: "pebble-beach-2025",
      name: "AT&T Pebble Beach Pro-Am",
      venue: "Pebble Beach Golf Links",
      location: "Pebble Beach, CA",
      startDate: "2025-02-06",
      endDate: "2025-02-09",
      purse: 8700000,
      field: 156,
      status: 'upcoming',
      tour: 'PGA',
      major: false
    },
    {
      id: "genesis-invitational-2025",
      name: "Genesis Invitational",
      venue: "Riviera Country Club",
      location: "Pacific Palisades, CA",
      startDate: "2025-02-13",
      endDate: "2025-02-16",
      purse: 20000000,
      field: 120,
      status: 'upcoming',
      tour: 'PGA',
      major: false,
      featured: true
    },
    {
      id: "honda-classic-2025",
      name: "The Honda Classic",
      venue: "PGA National Resort",
      location: "Palm Beach Gardens, FL",
      startDate: "2025-02-20",
      endDate: "2025-02-23",
      purse: 8400000,
      field: 144,
      status: 'upcoming',
      tour: 'PGA',
      major: false
    },
    {
      id: "arnold-palmer-2025",
      name: "Arnold Palmer Invitational",
      venue: "Bay Hill Club & Lodge",
      location: "Orlando, FL",
      startDate: "2025-03-06",
      endDate: "2025-03-09",
      purse: 12000000,
      field: 120,
      status: 'upcoming',
      tour: 'PGA',
      major: false,
      featured: true
    },
    {
      id: "players-championship-2025",
      name: "The Players Championship",
      venue: "TPC Sawgrass",
      location: "Ponte Vedra Beach, FL",
      startDate: "2025-03-13",
      endDate: "2025-03-16",
      purse: 25000000,
      field: 144,
      status: 'upcoming',
      tour: 'PGA',
      major: false,
      featured: true
    },
    {
      id: "masters-2025",
      name: "The Masters Tournament",
      venue: "Augusta National Golf Club",
      location: "Augusta, GA",
      startDate: "2025-04-10",
      endDate: "2025-04-13",
      purse: 18000000,
      field: 90,
      status: 'upcoming',
      tour: 'PGA',
      major: true,
      featured: true
    },
    {
      id: "pga-championship-2025",
      name: "PGA Championship",
      venue: "Quail Hollow Club",
      location: "Charlotte, NC",
      startDate: "2025-05-15",
      endDate: "2025-05-18",
      purse: 18500000,
      field: 156,
      status: 'upcoming',
      tour: 'PGA',
      major: true,
      featured: true
    },
    {
      id: "us-open-2025",
      name: "U.S. Open",
      venue: "Oakmont Country Club",
      location: "Oakmont, PA",
      startDate: "2025-06-12",
      endDate: "2025-06-15",
      purse: 21500000,
      field: 156,
      status: 'upcoming',
      tour: 'PGA',
      major: true,
      featured: true
    },
    {
      id: "open-championship-2025",
      name: "The Open Championship",
      venue: "Royal Portrush Golf Club",
      location: "Portrush, Northern Ireland",
      startDate: "2025-07-17",
      endDate: "2025-07-20",
      purse: 16500000,
      field: 156,
      status: 'upcoming',
      tour: 'PGA',
      major: true,
      featured: true
    }
  ];

  const displayTournaments = tournaments || mockTournaments;

  const getMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getTournamentsForDate = (day: number) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateString = targetDate.toISOString().split('T')[0];
    
    return displayTournaments.filter(tournament => {
      const startDate = tournament.startDate;
      const endDate = tournament.endDate;
      return dateString >= startDate && dateString <= endDate;
    });
  };

  const formatPurse = (amount: number) => {
    return `$${(amount / 1000000).toFixed(1)}M`;
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-border"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const tournamentsForDay = getTournamentsForDate(day);
      const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
      
      days.push(
        <div key={day} className={`h-24 border border-border p-1 ${isToday ? 'bg-primary/5' : 'bg-background'}`}>
          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : 'text-foreground'}`}>
            {day}
          </div>
          <div className="space-y-1">
            {tournamentsForDay.slice(0, 2).map((tournament, index) => (
              <div
                key={index}
                className={`text-xs px-1 py-0.5 rounded truncate ${
                  tournament.major 
                    ? 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20' 
                    : tournament.featured
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-secondary/10 text-secondary border border-secondary/20'
                }`}
                title={tournament.name}
              >
                {tournament.major && <Trophy className="inline h-3 w-3 mr-1" />}
                {tournament.name.length > 15 ? tournament.name.substring(0, 15) + '...' : tournament.name}
              </div>
            ))}
            {tournamentsForDay.length > 2 && (
              <div className="text-xs text-muted-foreground">
                +{tournamentsForDay.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-96 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Calendar className="h-10 w-10 text-accent" />
              <h1 className="text-4xl font-bold">Golf Schedule</h1>
            </div>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              Complete 2025 PGA Tour tournament calendar with dates, venues, and prize pools.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Calendar Navigation */}
        <Card className="bg-card border-border mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <h2 className="text-2xl font-bold text-foreground">{getMonth(currentDate)}</h2>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Calendar Grid */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="p-0">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 border-b border-border">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                <div key={day} className="p-4 text-center font-medium text-foreground border-r border-border last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {renderCalendarDays()}
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="bg-card border-border mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground">
              <Flag className="h-5 w-5 mr-2 text-primary" />
              Tournament Legend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500/10 border border-yellow-500/20 rounded"></div>
                <Trophy className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-foreground">Major Championship</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-primary/10 border border-primary/20 rounded"></div>
                <span className="text-sm text-foreground">Featured Tournament</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-secondary/10 border border-secondary/20 rounded"></div>
                <span className="text-sm text-foreground">Regular Tournament</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tournaments List */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-foreground">Upcoming Tournaments</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayTournaments.filter(t => t.status === 'upcoming').slice(0, 6).map((tournament) => (
              <Card key={tournament.id} className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg text-foreground">{tournament.name}</CardTitle>
                    {tournament.major && (
                      <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                        <Trophy className="h-3 w-3 mr-1" />
                        Major
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(tournament.startDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })} - {new Date(tournament.endDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      {tournament.venue}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <DollarSign className="h-4 w-4 mr-2" />
                      {formatPurse(tournament.purse)} purse
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Users className="h-4 w-4 mr-2" />
                      {tournament.field} players
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}