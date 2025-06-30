import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Diamond as HomePlate, 
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
  Calendar,
  Flag,
  BarChart3,
  Users,
  Building,
  Award,
  Brain,
  Calculator
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
  const [golfExpanded, setGolfExpanded] = useState(false);

  // Debug logging
  console.log("Sidebar bets:", bets);

  const sportsNavigation = [
    {
      sport: "Baseball",
      icon: HomePlate,
      expanded: baseballExpanded,
      setExpanded: setBaseballExpanded,
      active: location === "/" || location.startsWith("/baseball") || location === "/todays-games" || location === "/daily-picks" || location === "/daily-digest" || location === "/my-bets" || location === "/performance-tracking",
      freeItems: [
        { 
          name: "Games", 
          href: "/todays-games", 
          icon: Home,
          current: location === "/todays-games",
          description: "MLB games and odds for any date"
        },
        { 
          name: "Daily Picks", 
          href: "/daily-picks", 
          icon: Target,
          current: location === "/daily-picks",
          description: "AI-powered betting recommendations"
        },
        { 
          name: "My Bets", 
          href: "/my-bets", 
          icon: History,
          current: location === "/my-bets",
          description: "Your MLB betting history"
        }
      ],
      proItems: [
        { 
          name: "Odds Comparison", 
          href: "/odds-comparison", 
          icon: BarChart3,
          current: location === "/odds-comparison",
          description: "Compare odds across multiple sportsbooks",
          requiresPro: true
        },
        { 
          name: "Hot Trends", 
          href: "/hot-trends", 
          icon: TrendingUp,
          current: location === "/hot-trends",
          description: "Discover trending betting patterns",
          requiresPro: true
        },
        { 
          name: "Kelly Calculator", 
          href: "/kelly-calculator", 
          icon: Calculator,
          current: location === "/kelly-calculator",
          description: "Optimize bet sizing with mathematical precision",
          requiresPro: true
        }
      ],
      eliteItems: [
        { 
          name: "Performance Analytics", 
          href: "/analytics", 
          icon: BarChart3,
          current: location === "/analytics",
          description: "Advanced betting performance insights",
          requiresElite: true
        },
        { 
          name: "AI Assistant", 
          href: "/ai-assistant", 
          icon: Brain,
          current: location === "/ai-assistant",
          description: "Chat with AI for betting insights",
          requiresElite: true
        },
        { 
          name: "Prop Finder", 
          href: "/prop-finder", 
          icon: Target,
          current: location === "/prop-finder",
          description: "Find positive EV player props",
          requiresElite: true
        },
        { 
          name: "Parlay Builder", 
          href: "/parlay-builder", 
          icon: Calculator,
          current: location === "/parlay-builder",
          description: "Build optimal parlays with EV guidance",
          requiresElite: true
        },
        { 
          name: "Custom Strategies", 
          href: "/strategies", 
          icon: Target,
          current: location === "/strategies",
          description: "Create and manage betting strategies",
          requiresElite: true
        },
        { 
          name: "Expert Consultation", 
          href: "#", 
          icon: Users,
          current: false,
          description: "1-on-1 sessions with betting experts",
          disabled: true,
          comingSoon: true
        },
        { 
          name: "Early Access", 
          href: "/early-access", 
          icon: Zap,
          current: location === "/early-access",
          description: "Beta features and new releases",
          requiresElite: true
        },
        { 
          name: "White Label", 
          href: "#", 
          icon: Building,
          current: false,
          description: "Brand customization options",
          disabled: true,
          comingSoon: true
        }
      ]
    },
    {
      sport: "Football",
      icon: Zap,
      expanded: footballExpanded,
      setExpanded: setFootballExpanded,
      active: location.startsWith("/football") || location.startsWith("/cfl"),
      freeItems: [
        { 
          name: "CFL Hub", 
          href: "/cfl", 
          icon: Trophy,
          current: location === "/cfl",
          description: "Canadian Football League central",
          featured: true
        },
        { 
          name: "Today's Games", 
          href: "/cfl/games", 
          icon: Calendar,
          current: location === "/cfl/games",
          description: "Live CFL games and odds"
        },
        { 
          name: "Daily Picks", 
          href: "/cfl/picks", 
          icon: Target,
          current: location === "/cfl/picks",
          description: "AI-powered CFL betting picks"
        },
        { 
          name: "NFL", 
          href: "/nfl", 
          icon: Star,
          current: location === "/nfl",
          description: "Coming Soon",
          disabled: true
        }
      ],
      proItems: [],
      eliteItems: []
    },
    {
      sport: "Golf",
      icon: Flag,
      expanded: golfExpanded,
      setExpanded: setGolfExpanded,
      active: location.startsWith("/golf"),
      freeItems: [
        { 
          name: "Tournaments", 
          href: "/golf/tournaments", 
          icon: Trophy,
          current: location === "/golf/tournaments",
          description: "PGA Tour tournaments and odds",
          featured: true
        },
        { 
          name: "Leaderboards", 
          href: "/golf/leaderboards", 
          icon: TrendingUp,
          current: location === "/golf/leaderboards",
          description: "Live tournament leaderboards"
        },
        { 
          name: "Futures", 
          href: "/golf/futures", 
          icon: Target,
          current: location === "/golf/futures",
          description: "Season-long betting markets"
        }
      ],
      proItems: [],
      eliteItems: []
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
          <div>
            <img 
              src="/clearedge-logo-new.png" 
              alt="ClearEdge Bets" 
              className="h-12 w-auto"
            />
            <p className="text-sm text-gray-400 mt-1">Betting Platform</p>
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

      {/* Main Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {/* Home Link */}
        <Link
          href="/"
          className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors group ${
            location === "/"
              ? "bg-gray-800 text-white"
              : "text-gray-300 hover:bg-gray-800 hover:text-white"
          }`}
          onClick={() => setMobileOpen(false)}
        >
          <Home className={`h-5 w-5 ${location === "/" ? "text-white" : "text-gray-400 group-hover:text-white"}`} />
          <div className="flex-1">
            <div className="font-medium">Home</div>
            <div className="text-xs text-gray-400 group-hover:text-gray-300">
              Dashboard and daily insights
            </div>
          </div>
        </Link>

        {/* Sports Navigation */}
        {sportsNavigation.map((sport) => {
          const SportIcon = sport.icon;
          return (
            <div key={sport.sport} className="space-y-1">
              <button
                onClick={() => sport.setExpanded(!sport.expanded)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all duration-200 group ${
                  sport.active
                    ? "bg-gray-800 text-white"
                    : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <SportIcon className={`h-5 w-5 transition-colors duration-200 ${sport.active ? "text-white" : "text-gray-400 group-hover:text-white"}`} />
                  <span className="font-semibold transition-colors duration-200">{sport.sport}</span>
                </div>
                {sport.expanded ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </button>
              
              {sport.expanded && (
                <div className="ml-6 space-y-1">
                  {/* Free Tier Items */}
                  <div className="px-3 mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Free</span>
                    </div>
                  </div>
                  {sport.freeItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors group ${
                          item.current
                            ? "bg-secondary text-white"
                            : (item as any).disabled
                            ? "text-gray-500 cursor-not-allowed"
                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                        }`}
                        onClick={() => setMobileOpen(false)}
                      >
                        <Icon className={`h-4 w-4 ${
                          item.current ? "text-white" : 
                          (item as any).disabled ? "text-gray-500" :
                          "text-gray-400 group-hover:text-white"
                        }`} />
                        <div className="flex-1">
                          <div className={`text-sm font-medium ${(item as any).featured ? "flex items-center" : ""}`}>
                            {item.name}
                            {(item as any).featured && <Star className="h-3 w-3 ml-1 text-accent" />}
                          </div>
                          <div className="text-xs text-gray-400 group-hover:text-gray-300">
                            {item.description}
                          </div>
                        </div>
                      </Link>
                    );
                  })}

                  {/* Pro Tier Items */}
                  {sport.proItems && sport.proItems.length > 0 && (
                    <>
                      <div className="px-3 mb-2 mt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Crown className="h-3 w-3 text-blue-600" />
                            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Pro</span>
                          </div>
                          {!user || !hasAccess("pro") ? (
                            <Link href="/subscribe">
                              <Button size="sm" variant="outline" className="h-6 text-xs border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">
                                Upgrade
                              </Button>
                            </Link>
                          ) : null}
                        </div>
                      </div>
                      {sport.proItems.map((item) => {
                        const Icon = item.icon;
                        const hasProAccess = user && hasAccess("pro");
                        const requiresPro = (item as any).requiresPro;
                        
                        if (requiresPro && !hasProAccess) {
                          return (
                            <div
                              key={item.name}
                              className="flex items-center space-x-3 px-3 py-2 rounded-lg opacity-60 cursor-not-allowed"
                            >
                              <Icon className="h-4 w-4 text-gray-500" />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-gray-500">{item.name}</span>
                                  <Badge variant="secondary" className="text-xs bg-blue-600/20 text-blue-400 border border-blue-600/30">
                                    Pro
                                  </Badge>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {item.description}
                                </div>
                              </div>
                            </div>
                          );
                        }
                        
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors group ${
                              item.current
                                ? "bg-blue-600 text-white"
                                : "text-gray-300 hover:bg-gray-800 hover:text-white"
                            }`}
                            onClick={() => setMobileOpen(false)}
                          >
                            <Icon className={`h-4 w-4 ${
                              item.current ? "text-white" : "text-blue-400 group-hover:text-white"
                            }`} />
                            <div className="flex-1">
                              <div className="text-sm font-medium">{item.name}</div>
                              <div className="text-xs text-gray-400 group-hover:text-gray-300">
                                {item.description}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </>
                  )}

                  {/* Elite Tier Items */}
                  {sport.eliteItems && sport.eliteItems.length > 0 && (
                    <>
                      <div className="px-3 mb-2 mt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Award className="h-3 w-3 text-yellow-600" />
                            <span className="text-xs font-semibold text-yellow-600 uppercase tracking-wide">Elite</span>
                          </div>
                          {!user || !hasAccess("elite") ? (
                            <Link href="/subscribe">
                              <Button size="sm" variant="outline" className="h-6 text-xs border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white">
                                Upgrade
                              </Button>
                            </Link>
                          ) : null}
                        </div>
                      </div>
                      {sport.eliteItems.map((item) => {
                        const Icon = item.icon;
                        const isDisabled = (item as any).disabled;
                        const isComingSoon = (item as any).comingSoon;
                        const hasEliteAccess = user && hasAccess("elite");
                        const requiresElite = (item as any).requiresElite;
                        
                        if (isDisabled) {
                          return (
                            <div
                              key={item.name}
                              className="flex items-center space-x-3 px-3 py-2 rounded-lg opacity-60 cursor-not-allowed"
                            >
                              <Icon className="h-4 w-4 text-gray-500" />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-gray-500">{item.name}</span>
                                  {isComingSoon && (
                                    <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                                      Coming Soon
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {item.description}
                                </div>
                              </div>
                            </div>
                          );
                        }
                        
                        if (requiresElite && !hasEliteAccess) {
                          return (
                            <div
                              key={item.name}
                              className="flex items-center space-x-3 px-3 py-2 rounded-lg opacity-60 cursor-not-allowed"
                            >
                              <Icon className="h-4 w-4 text-gray-500" />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-gray-500">{item.name}</span>
                                  <Badge variant="secondary" className="text-xs bg-yellow-600/20 text-yellow-400 border border-yellow-600/30">
                                    Elite
                                  </Badge>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {item.description}
                                </div>
                              </div>
                            </div>
                          );
                        }
                        
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors group ${
                              item.current
                                ? "bg-yellow-600/20 text-yellow-400"
                                : "text-gray-300 hover:bg-gray-800 hover:text-white"
                            }`}
                            onClick={() => setMobileOpen(false)}
                          >
                            <Icon className={`h-4 w-4 ${item.current ? "text-yellow-400" : "text-gray-400 group-hover:text-white"}`} />
                            <div className="flex-1">
                              <div className="text-sm font-medium">{item.name}</div>
                              <div className="text-xs text-gray-400 group-hover:text-gray-300">
                                {item.description}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </>
                  )}
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