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
  Ticket as TicketIcon,
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
  Calculator,
  CircleDot,
  Cloud,
  Shield,
  HelpCircle
} from "lucide-react";
import { useBettingSlip } from "@/contexts/betting-slip-context";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import LoginForm from "@/components/auth/login-form";
import BettingSlip from "@/components/betting-slip";

interface SidebarProps {
  isMobileSheet?: boolean;
  onNavigate?: () => void;
}

export default function Sidebar({ isMobileSheet = false, onNavigate }: SidebarProps = {}) {
  const [location] = useLocation();
  const { bets } = useBettingSlip();
  const { user, hasAccess } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [virtualSportsbookExpanded, setVirtualSportsbookExpanded] = useState(true);
  const [baseballExpanded, setBaseballExpanded] = useState(true);
  const [footballExpanded, setFootballExpanded] = useState(false);
  const [golfExpanded, setGolfExpanded] = useState(false);
  const [hockeyExpanded, setHockeyExpanded] = useState(false);
  const [basketballExpanded, setBasketballExpanded] = useState(false);



  const sportsNavigation = [
    {
      sport: "Baseball",
      icon: HomePlate,
      expanded: baseballExpanded,
      setExpanded: setBaseballExpanded,
      active: location === "/" || location.startsWith("/baseball") || location === "/games" || location === "/todays-games" || location === "/daily-picks" || location === "/daily-digest" || location === "/my-bets" || location === "/performance-tracking",
      freeItems: [
        { 
          name: "Games", 
          href: "/games", 
          icon: Home,
          current: location === "/games" || location === "/todays-games",
          description: "MLB games and odds for any date"
        },
        { 
          name: "My Picks", 
          href: "/my-bets", 
          icon: History,
          current: location === "/my-bets",
          description: "Your MLB prediction history"
        },
        { 
          name: "Kelly Calculator", 
          href: "/kelly-calculator", 
          icon: Calculator,
          current: location === "/kelly-calculator",
          description: "Optimize bet sizing with mathematical precision"
        },
        { 
          name: "Weather Central", 
          href: "/weather-summary", 
          icon: Cloud,
          current: location === "/weather-summary",
          description: "Fun weather map for today's MLB games"
        },

        {
          name: "Team Power Scores",
          href: "/team-power-scores",
          icon: BarChart3,
          current: location === "/team-power-scores",
          description: "Live MLB team rankings and power scores"
        },
        {
          name: "Player Rankings",
          href: "/player-rankings",
          icon: Trophy,
          current: location === "/player-rankings",
          description: "Sort hitters and pitchers by power score"
        },
        {
          name: "Wiki",
          href: "/wiki",
          icon: HelpCircle,
          current: location === "/wiki",
          description: "Scoring methodology and park factors"
        },
        {
          name: "The Morning Roast",
          href: "/blog",
          icon: FileText,
          current: location === "/blog",
          description: "Sarcastic AI game recaps"
        },
        {
          name: "The Newsroom",
          href: "/writers",
          icon: Users,
          current: location === "/writers",
          description: "Meet our 25 AI beat writers"
        },
        {
          name: "Editor's Desk",
          href: "/editors-desk",
          icon: FileText,
          current: location === "/editors-desk",
          description: "Assign stories to your newsroom"
        },
        {
          name: "Daily Brief",
          href: "/newsletter",
          icon: FileText,
          current: location === "/newsletter",
          description: "Subscribe to our daily newsletter"
        }
      ],
      proItems: [
        { 
          name: "Daily Picks", 
          href: "/daily-picks", 
          icon: Target,
          current: location === "/daily-picks",
          description: "AI-powered game predictions",
          requiresPro: true
        },
        { 
          name: "Daily Dose Newsletter", 
          href: "/daily-dose", 
          icon: FileText,
          current: location === "/daily-dose",
          description: "Professional sports newsletter with Kelly analysis",
          requiresPro: true
        },
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
          description: "Discover trending sports patterns",
          requiresPro: true
        },
        { 
          name: "Enhanced Odds", 
          href: "/enhanced-odds", 
          icon: Calculator,
          current: location === "/enhanced-odds",
          description: "Detailed odds analysis and implied probability breakdown",
          requiresPro: true
        },
        { 
          name: "Expected Value", 
          href: "/expected-value", 
          icon: Calculator,
          current: location === "/expected-value",
          description: "Optimal bet sizing with Kelly Criterion and EV calculations",
          requiresPro: true
        }
      ],
      eliteItems: [
        { 
          name: "Performance Analytics", 
          href: "/analytics", 
          icon: BarChart3,
          current: location === "/analytics",
          description: "Advanced prediction performance insights",
          requiresElite: true
        },
        { 
          name: "AI Assistant", 
          href: "/ai-assistant", 
          icon: Brain,
          current: location === "/ai-assistant",
          description: "Chat with AI for sports insights",
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
          name: "DFS Prop Builder", 
          href: "/player-prop-builder", 
          icon: Target,
          current: location === "/player-prop-builder",
          description: "Build player prop parlays up to 6 picks",
          requiresElite: true
        },
        { 
          name: "Custom Strategies", 
          href: "/strategies", 
          icon: Target,
          current: location === "/strategies",
          description: "Create and manage prediction strategies",
          requiresElite: true
        },
        { 
          name: "Expert Consultation", 
          href: "#", 
          icon: Users,
          current: false,
          description: "1-on-1 sessions with sports experts",
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
          description: "AI-powered CFL predictions"
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
          href: "#", 
          icon: Trophy,
          current: false,
          description: "Coming Soon",
          disabled: true,
          comingSoon: true
        },
        { 
          name: "Leaderboards", 
          href: "#", 
          icon: TrendingUp,
          current: false,
          description: "Coming Soon",
          disabled: true,
          comingSoon: true
        },
        { 
          name: "Futures", 
          href: "#", 
          icon: Target,
          current: false,
          description: "Coming Soon",
          disabled: true,
          comingSoon: true
        }
      ],
      proItems: [],
      eliteItems: []
    },
    {
      sport: "Hockey",
      icon: CircleDot,
      expanded: hockeyExpanded,
      setExpanded: setHockeyExpanded,
      active: location.startsWith("/hockey"),
      freeItems: [
        { 
          name: "NHL Games", 
          href: "#", 
          icon: Calendar,
          current: false,
          description: "Coming Soon",
          disabled: true,
          comingSoon: true
        },
        { 
          name: "Daily Picks", 
          href: "#", 
          icon: Target,
          current: false,
          description: "Coming Soon",
          disabled: true,
          comingSoon: true
        },
        { 
          name: "Player Props", 
          href: "#", 
          icon: Star,
          current: false,
          description: "Coming Soon",
          disabled: true,
          comingSoon: true
        }
      ],
      proItems: [],
      eliteItems: []
    },
    {
      sport: "Basketball",
      icon: Shield,
      expanded: basketballExpanded,
      setExpanded: setBasketballExpanded,
      active: location.startsWith("/basketball"),
      freeItems: [
        { 
          name: "NBA Games", 
          href: "#", 
          icon: Calendar,
          current: false,
          description: "Coming Soon",
          disabled: true,
          comingSoon: true
        },
        { 
          name: "Daily Picks", 
          href: "#", 
          icon: Target,
          current: false,
          description: "Coming Soon",
          disabled: true,
          comingSoon: true
        },
        { 
          name: "Player Props", 
          href: "#", 
          icon: Star,
          current: false,
          description: "Coming Soon",
          disabled: true,
          comingSoon: true
        }
      ],
      proItems: [],
      eliteItems: []
    },
    {
      sport: "Prediction Game",
      icon: CircleDot,
      expanded: virtualSportsbookExpanded,
      setExpanded: setVirtualSportsbookExpanded,
      active: location === "/virtual-sportsbook" || location === "/weekly-leaderboard" || location === "/groups",
      freeItems: [
        {
          name: "Virtual Predictions",
          href: "/virtual-sportsbook",
          icon: CircleDot,
          current: location === "/virtual-sportsbook",
          description: "Practice predictions with $1,000 virtual balance"
        },
        {
          name: "Weekly Leaderboard",
          href: "/weekly-leaderboard",
          icon: Trophy,
          current: location === "/weekly-leaderboard",
          description: "Compete with other users weekly"
        },
        {
          name: "Groups",
          href: "/groups",
          icon: Users,
          current: location === "/groups",
          description: "Create groups and invite friends"
        }
      ],
      proItems: [],
      eliteItems: []
    }
  ];

  const adminNavigation = user && hasAccess("elite") ? [
    { 
      name: "Admin Dashboard", 
      href: "/admin", 
      icon: Settings,
      current: location === "/admin",
      description: "System analytics and management"
    },
    { 
      name: "Ticket Dashboard", 
      href: "/admin/ticket-dashboard", 
      icon: TicketIcon,
      current: location === "/admin/ticket-dashboard",
      description: "Manage support tickets and pick slips"
    }
  ] : [];



  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0a0a0c] text-zinc-100">
      {/* Header */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center space-x-3">
          <div>
            <img 
              src="/clearedge-logo-new.png" 
              alt="ClearEdge Sports" 
              className="h-12 w-auto"
            />
            <p className="text-sm text-zinc-500 mt-1">Sports Intelligence</p>
          </div>
        </div>
      </div>

      {/* Live Status */}
      <div className="p-4">
        <div className="flex items-center space-x-2 bg-zinc-800/50 px-3 py-2 rounded-lg">
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
              ? "bg-zinc-800/50 text-white"
              : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
          }`}
          onClick={() => {
            if (isMobileSheet && onNavigate) onNavigate();
            setMobileOpen(false);
          }}
        >
          <Home className={`h-5 w-5 ${location === "/" ? "text-white" : "text-zinc-500 group-hover:text-white"}`} />
          <div className="flex-1">
            <div className="font-medium">Home</div>
            <div className="text-xs text-zinc-500 group-hover:text-zinc-400">
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
                    ? "bg-zinc-800/50 text-white"
                    : "text-zinc-400 hover:bg-zinc-800/30 hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <SportIcon className={`h-5 w-5 transition-colors duration-200 ${sport.active ? "text-white" : "text-zinc-500 group-hover:text-white"}`} />
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
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Free</span>
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
                            ? "text-zinc-600 cursor-not-allowed"
                            : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                        }`}
                        onClick={() => {
                          if (isMobileSheet && onNavigate) onNavigate();
                          setMobileOpen(false);
                        }}
                      >
                        <Icon className={`h-4 w-4 ${
                          item.current ? "text-white" : 
                          (item as any).disabled ? "text-zinc-600" :
                          "text-zinc-500 group-hover:text-white"
                        }`} />
                        <div className="flex-1">
                          <div className={`text-sm font-medium ${(item as any).featured ? "flex items-center" : ""}`}>
                            {item.name}
                            {(item as any).featured && <Star className="h-3 w-3 ml-1 text-accent" />}
                          </div>
                          <div className="text-xs text-zinc-500 group-hover:text-zinc-400">
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
                              <Button size="sm" variant="outline" className="h-6 text-xs border-blue-500/30 text-blue-400/80 hover:bg-blue-500/15 hover:text-blue-300">
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
                              <Icon className="h-4 w-4 text-zinc-600" />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-zinc-600">{item.name}</span>
                                  <Badge variant="secondary" className="text-xs bg-blue-600/20 text-blue-400/80 border border-blue-600/30">
                                    Pro
                                  </Badge>
                                </div>
                                <div className="text-xs text-zinc-600">
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
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                            }`}
                            onClick={() => {
                              if (isMobileSheet && onNavigate) onNavigate();
                              setMobileOpen(false);
                            }}
                          >
                            <Icon className={`h-4 w-4 ${
                              item.current ? "text-white" : "text-blue-400/80 group-hover:text-white"
                            }`} />
                            <div className="flex-1">
                              <div className="text-sm font-medium">{item.name}</div>
                              <div className="text-xs text-zinc-500 group-hover:text-zinc-400">
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
                              <Button size="sm" variant="outline" className="h-6 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/15 hover:text-amber-300">
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
                              <Icon className="h-4 w-4 text-zinc-600" />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-zinc-600">{item.name}</span>
                                  {isComingSoon && (
                                    <Badge variant="secondary" className="text-xs bg-gray-700 text-zinc-400">
                                      Coming Soon
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-zinc-600">
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
                              <Icon className="h-4 w-4 text-zinc-600" />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-zinc-600">{item.name}</span>
                                  <Badge variant="secondary" className="text-xs bg-yellow-600/20 text-yellow-400 border border-yellow-600/30">
                                    Elite
                                  </Badge>
                                </div>
                                <div className="text-xs text-zinc-600">
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
                                : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                            }`}
                            onClick={() => {
                              if (isMobileSheet && onNavigate) onNavigate();
                              setMobileOpen(false);
                            }}
                          >
                            <Icon className={`h-4 w-4 ${item.current ? "text-yellow-400" : "text-zinc-500 group-hover:text-white"}`} />
                            <div className="flex-1">
                              <div className="text-sm font-medium">{item.name}</div>
                              <div className="text-xs text-zinc-500 group-hover:text-zinc-400">
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
              className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors group border-t border-border/50 mt-4 pt-4 ${
                item.current
                  ? "bg-accent text-white"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
              }`}
              onClick={() => setMobileOpen(false)}
            >
              <Icon className={`h-5 w-5 ${item.current ? "text-white" : "text-zinc-500 group-hover:text-white"}`} />
              <div className="flex-1">
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-zinc-500 group-hover:text-zinc-400">
                  {item.description}
                </div>
              </div>
            </Link>
          );
        })}
        {/* Help Section */}
        <div className="mt-6 pt-4 border-t border-border/50">
          <Link
            href="/help"
            className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors group ${
              location === "/help"
                ? "bg-zinc-800/50 text-white"
                : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
            }`}
            onClick={() => setMobileOpen(false)}
          >
            <HelpCircle className={`h-5 w-5 ${location === "/help" ? "text-white" : "text-zinc-500 group-hover:text-white"}`} />
            <div className="flex-1">
              <div className="font-medium">Help & Guide</div>
              <div className="text-xs text-zinc-500 group-hover:text-zinc-400">
                Platform features and best practices
              </div>
            </div>
          </Link>
        </div>
      </nav>

      <Separator className="bg-gray-700" />

      {/* Pick Slip Summary */}
      <div className="p-4">
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium">Pick Slip</span>
            <Badge variant="secondary" className="bg-blue-600">
              {bets.length}
            </Badge>
          </div>
          
          {bets.length > 0 ? (
            <div className="space-y-2">
              <div className="text-sm text-zinc-500">
                Total Stake: ${bets.reduce((sum, bet) => sum + bet.stake, 0).toFixed(2)}
              </div>
              <div className="text-sm text-zinc-500">
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
                    <DialogTitle>Pick Slip</DialogTitle>
                  </DialogHeader>
                  <BettingSlip />
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No active bets</p>
          )}
        </div>
      </div>
    </div>
  );

  // When used as mobile sheet, render only the content
  if (isMobileSheet) {
    return <SidebarContent />;
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="w-80">
          <SidebarContent />
        </div>
      </div>
    </>
  );
}