import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Users, 
  Award, 
  Calendar as CalendarIcon, 
  Clock, 
  Star,
  MessageSquare,
  Video,
  Phone,
  BookOpen,
  TrendingUp,
  Target,
  Brain
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ConsultationSession {
  id: string;
  date: string;
  time: string;
  duration: number;
  type: 'strategy' | 'analysis' | 'portfolio' | 'general';
  status: 'scheduled' | 'completed' | 'cancelled';
  expertName: string;
  notes?: string;
  recordingUrl?: string;
}

interface Expert {
  id: string;
  name: string;
  title: string;
  specialty: string;
  experience: string;
  winRate: number;
  totalPicks: number;
  image: string;
  availability: string[];
  pricing: {
    "30min": number;
    "60min": number;
  };
}

export default function ExpertConsultation() {
  const { user, hasAccess } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [showBooking, setShowBooking] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);

  // Mock experts data
  const experts: Expert[] = [
    {
      id: "1",
      name: "Mike Rodriguez",
      title: "Senior MLB Analyst",
      specialty: "Advanced Analytics & Value Betting",
      experience: "12+ years",
      winRate: 68.5,
      totalPicks: 2847,
      image: "/api/placeholder/64/64",
      availability: ["Monday", "Tuesday", "Wednesday", "Friday"],
      pricing: { "30min": 99, "60min": 179 }
    },
    {
      id: "2",
      name: "Sarah Chen",
      title: "Statistical Modeling Expert",
      specialty: "Prop Betting & Live Lines",
      experience: "8+ years",
      winRate: 71.2,
      totalPicks: 1923,
      image: "/api/placeholder/64/64",
      availability: ["Tuesday", "Wednesday", "Thursday", "Saturday"],
      pricing: { "30min": 129, "60min": 229 }
    },
    {
      id: "3",
      name: "David Kim",
      title: "Bankroll Management Specialist",
      specialty: "Risk Management & Kelly Criterion",
      experience: "15+ years",
      winRate: 65.8,
      totalPicks: 3456,
      image: "/api/placeholder/64/64",
      availability: ["Monday", "Wednesday", "Thursday", "Friday"],
      pricing: { "30min": 89, "60min": 159 }
    }
  ];

  // Mock consultation history
  const [consultations] = useState<ConsultationSession[]>([
    {
      id: "1",
      date: "2025-06-15",
      time: "2:00 PM",
      duration: 60,
      type: "strategy",
      status: "completed",
      expertName: "Mike Rodriguez",
      notes: "Discussed advanced MLB analytics approach and bankroll optimization strategies.",
      recordingUrl: "#"
    },
    {
      id: "2",
      date: "2025-06-28",
      time: "10:00 AM",
      duration: 30,
      type: "analysis",
      status: "scheduled",
      expertName: "Sarah Chen",
      notes: "Review prop prediction performance and discuss new market opportunities."
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
              1-on-1 Expert Consultation is an Elite tier feature. Book personalized sessions with our professional betting analysts.
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

  const handleBookSession = () => {
    toast({
      title: "Session booked!",
      description: "Your consultation has been scheduled. You'll receive a confirmation email shortly.",
    });
    setShowBooking(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-600';
      case 'completed': return 'bg-green-600';
      case 'cancelled': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'strategy': return <Target className="h-4 w-4" />;
      case 'analysis': return <Brain className="h-4 w-4" />;
      case 'portfolio': return <TrendingUp className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Users className="h-8 w-8 text-yellow-600" />
              <h1 className="text-3xl font-bold text-foreground">Expert Consultation</h1>
              <Badge className="bg-yellow-600 text-white">
                <Award className="h-3 w-3 mr-1" />
                Elite
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Book 1-on-1 sessions with professional sports analytics analysts and strategists.
            </p>
          </div>

          <Dialog open={showBooking} onOpenChange={setShowBooking}>
            <DialogTrigger asChild>
              <Button className="bg-yellow-600 hover:bg-yellow-700">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Book Session
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Book Expert Consultation</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Select Expert</Label>
                  <div className="space-y-3 mt-2">
                    {experts.map((expert) => (
                      <div 
                        key={expert.id}
                        className={`p-3 border rounded-lg cursor-pointer ${
                          selectedExpert?.id === expert.id ? 'border-yellow-600 bg-yellow-50' : 'border-border'
                        }`}
                        onClick={() => setSelectedExpert(expert)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                            <Users className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{expert.name}</h4>
                            <p className="text-sm text-muted-foreground">{expert.specialty}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {expert.winRate}% wins
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                ${expert.pricing["30min"]}/30min
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Session Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select consultation type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="strategy">Strategy Development</SelectItem>
                        <SelectItem value="analysis">Performance Analysis</SelectItem>
                        <SelectItem value="portfolio">Portfolio Review</SelectItem>
                        <SelectItem value="general">General Consultation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Duration</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes - ${selectedExpert?.pricing["30min"] || 99}</SelectItem>
                        <SelectItem value="60">60 minutes - ${selectedExpert?.pricing["60min"] || 179}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Preferred Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>Preferred Time</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="09:00">9:00 AM</SelectItem>
                        <SelectItem value="10:00">10:00 AM</SelectItem>
                        <SelectItem value="11:00">11:00 AM</SelectItem>
                        <SelectItem value="14:00">2:00 PM</SelectItem>
                        <SelectItem value="15:00">3:00 PM</SelectItem>
                        <SelectItem value="16:00">4:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Session Goals (Optional)</Label>
                    <Textarea placeholder="What would you like to focus on in this session?" />
                  </div>

                  <Button onClick={handleBookSession} className="w-full">
                    Book Consultation
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Expert Profiles */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Our Expert Analysts</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {experts.map((expert) => (
              <Card key={expert.id}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                      <Users className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="font-bold">{expert.name}</h3>
                      <p className="text-sm text-muted-foreground">{expert.title}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Specialty</p>
                      <p className="text-sm text-muted-foreground">{expert.specialty}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Experience</p>
                        <p className="text-sm text-muted-foreground">{expert.experience}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Win Rate</p>
                        <p className="text-sm text-green-600 font-bold">{expert.winRate}%</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">30 min</span>
                        <span className="font-bold">${expert.pricing["30min"]}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">60 min</span>
                        <span className="font-bold">${expert.pricing["60min"]}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Consultation History */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Your Consultation History</h2>
          <div className="space-y-4">
            {consultations.map((consultation) => (
              <Card key={consultation.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(consultation.type)}
                        <div>
                          <h4 className="font-semibold capitalize">{consultation.type} Session</h4>
                          <p className="text-sm text-muted-foreground">
                            with {consultation.expertName}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{consultation.date}</p>
                        <p className="text-sm text-muted-foreground">
                          {consultation.time} ({consultation.duration} min)
                        </p>
                      </div>
                      <Badge className={`${getStatusColor(consultation.status)} text-white`}>
                        {consultation.status}
                      </Badge>
                    </div>
                  </div>

                  {consultation.notes && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm">{consultation.notes}</p>
                    </div>
                  )}

                  {consultation.status === 'completed' && consultation.recordingUrl && (
                    <div className="mt-4 flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Video className="h-4 w-4 mr-2" />
                        View Recording
                      </Button>
                      <Button variant="outline" size="sm">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Session Notes
                      </Button>
                    </div>
                  )}

                  {consultation.status === 'scheduled' && (
                    <div className="mt-4 flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4 mr-2" />
                        Join Call
                      </Button>
                      <Button variant="outline" size="sm">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Reschedule
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}