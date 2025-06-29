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
  Settings
} from "lucide-react";
import { useBettingSlip } from "@/hooks/use-betting-slip";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import LoginForm from "@/components/auth/login-form";

export default function Sidebar() {
  const [location] = useLocation();
  const { bets } = useBettingSlip();
  const { user, hasAccess } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigation = [
    { 
      name: "Today's Games", 
      href: "/", 
      icon: Home,
      current: location === "/",
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
      description: "Market overview and analysis"
    },
    { 
      name: "My Bets", 
      href: "/my-bets", 
      icon: History,
      current: location === "/my-bets",
      description: "Betting history and tracking"
    },
    ...(user && hasAccess("elite") ? [{ 
      name: "Admin Dashboard", 
      href: "/admin", 
      icon: Settings,
      current: location === "/admin",
      description: "System analytics and management"
    }] : []),
  ];

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

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors group ${
                item.current
                  ? "bg-blue-600 text-white"
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
              <Button size="sm" className="w-full">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Slip
              </Button>
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