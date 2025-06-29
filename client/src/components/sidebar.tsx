import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Volleyball as Baseball, 
  Home, 
  Target, 
  FileText, 
  History,
  TrendingUp,
  Menu,
  X,
  Crown,
  Star,
  User,
  LogOut,
  LogIn,
  Settings,
  ChevronDown,
  ChevronRight,
  Zap,
  Trophy,
  Calendar
} from "lucide-react";
import { useBettingSlip } from "@/contexts/betting-slip-context";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import LoginForm from "@/components/auth/login-form";
import BettingSlip from "@/components/betting-slip";

export default function Sidebar() {
  const [location] = useLocation();
  const { bets } = useBettingSlip();
  const { user, hasAccess } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [baseballExpanded, setBaseballExpanded] = useState(true);
  const [footballExpanded, setFootballExpanded] = useState(false);

  // Debug logging
  console.log("Sidebar bets:", bets);

  const sportsNavigation = [
    {
      sport: "Baseball",
      icon: Baseball,
      expanded: baseballExpanded,
      setExpanded: setBaseballExpanded,
      active: location === "/" || location.startsWith("/baseball") || location === "/todays-games" || location === "/daily-picks" || location === "/daily-digest" || location === "/my-bets",
      subItems: [
        { 
          name: "Today's Games", 
          href: "/todays-games", 
          icon: Home,
          current: location === "/todays-games",
          description: "Live MLB games and odds"
        },
        { 
          name: "Daily Picks", 
          href: "/daily-picks", 
          icon: Target,
          current: location === "/daily-picks",
          description: "AI-powered betting recommendations"
        },
        { 
          name: "Daily Digest", 
          href: "/daily-digest", 
          icon: FileText,
          current: location === "/daily-digest",
          description: "Expert analysis and insights"
        },
        { 
          name: "My Bets", 
          href: "/my-bets", 
          icon: History,
          current: location === "/my-bets",
          description: "Your MLB betting history"
        }
      ]
    },
    {
      sport: "Football",
      icon: Zap,
      expanded: footballExpanded,
      setExpanded: setFootballExpanded,
      active: location.startsWith("/football") || location.startsWith("/cfl"),
      subItems: [
        { 
          name: "CFL Hub", 
          href: "/cfl", 
          icon: Trophy,
          current: location === "/cfl" || location.startsWith("/cfl"),
          description: "Canadian Football League central",
          featured: true
        },
        { 
          name: "CFL Schedule", 
          href: "/cfl/schedule", 
          icon: Calendar,
          current: location === "/cfl/schedule",
          description: "Upcoming CFL games and odds"
        },
        { 
          name: "NFL", 
          href: "/nfl", 
          icon: Star,
          current: location === "/nfl",
          description: "Coming Soon",
          disabled: true
        }
      ]
    }
  ];

  const adminNavigation = user && hasAccess("elite") ? [{ 
    name: "Admin Dashboard", 
    href: "/admin", 
    icon: Settings,
    current: location === "/admin",
    description: "System analytics and management"
  }] : [];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <Baseball className="h-8 w-8 text-blue-400" />
          <div>
            <img 
              src="/clearedge-logo.png" 
              alt="ClearEdge Bets" 
              className="h-8 w-auto"
            />
            <p className="text-sm text-gray-400">Betting Platform</p>
          </div>
        </div>
      </div>

      {/* Live Status */}
      <div className="p-4">
        <div className="flex items-center space-x-2 bg-gray-800 px-3 py-2 rounded-lg">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-green-400">Live Odds</span>
        </div>
      </div>

      {/* Sports Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {sportsNavigation.map((sport) => {
          const SportIcon = sport.icon;
          return (
            <div key={sport.sport} className="space-y-1">
              <button
                onClick={() => sport.setExpanded(!sport.expanded)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-colors group ${
                  sport.active
                    ? "bg-primary text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <SportIcon className={`h-5 w-5 ${sport.active ? "text-white" : "text-gray-400 group-hover:text-white"}`} />
                  <span className="font-semibold">{sport.sport}</span>
                </div>
                {sport.expanded ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </button>
              
              {sport.expanded && (
                <div className="ml-6 space-y-1">
                  {sport.subItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors group ${
                          item.current
                            ? "bg-secondary text-white"
                            : item.disabled
                            ? "text-gray-500 cursor-not-allowed"
                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                        }`}
                        onClick={() => setMobileOpen(false)}
                      >
                        <Icon className={`h-4 w-4 ${
                          item.current ? "text-white" : 
                          item.disabled ? "text-gray-500" :
                          "text-gray-400 group-hover:text-white"
                        }`} />
                        <div className="flex-1">
                          <div className={`text-sm font-medium ${item.featured ? "flex items-center" : ""}`}>
                            {item.name}
                            {item.featured && <Star className="h-3 w-3 ml-1 text-accent" />}
                          </div>
                          <div className="text-xs text-gray-400 group-hover:text-gray-300">
                            {item.description}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        
        {/* Admin Navigation */}
        {adminNavigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors group border-t border-gray-700 mt-4 pt-4 ${
                item.current
                  ? "bg-accent text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
              onClick={() => setMobileOpen(false)}
            >
              <Icon className={`h-5 w-5 ${item.current ? "text-white" : "text-gray-400 group-hover:text-white"}`} />
              <div className="flex-1">
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-gray-400 group-hover:text-gray-300">
                  {item.description}
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-gray-700" />

      {/* Betting Slip Summary */}
      <div className="p-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium">Betting Slip</span>
            <Badge variant="secondary" className="bg-blue-600">
              {bets.length}
            </Badge>
          </div>
          
          {bets.length > 0 ? (
            <div className="space-y-2">
              <div className="text-sm text-gray-400">
                Total Stake: ${bets.reduce((sum, bet) => sum + bet.stake, 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-400">
                Potential Win: ${bets.reduce((sum, bet) => sum + bet.potentialWin, 0).toFixed(2)}
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="w-full">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Slip
                  </Button>
                </DialogTrigger>
                <DialogContent 
                  className="max-w-md" 
                  onPointerDownOutside={(e) => e.preventDefault()}
                  onInteractOutside={(e) => e.preventDefault()}
                >
                  <DialogHeader>
                    <DialogTitle>Betting Slip</DialogTitle>
                  </DialogHeader>
                  <BettingSlip />
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No active bets</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="w-80">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button size="sm" variant="outline" className="bg-white shadow-lg">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}