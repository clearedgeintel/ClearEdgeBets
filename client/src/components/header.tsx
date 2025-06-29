import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Menu, Crown } from "lucide-react";
// import logoPath from "/logo.png";
import { useBettingSlip } from "@/hooks/use-betting-slip";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Header() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { bets } = useBettingSlip();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Home", href: "/", current: location === "/" },
    { name: "Daily Picks", href: "/daily-picks", current: location === "/daily-picks" },
    { name: "Daily Digest", href: "/daily-digest", current: location === "/daily-digest" },
    { name: "My Bets", href: "/my-bets", current: location === "/my-bets" },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex items-center">
                <span className="text-2xl font-black text-primary">CLEAR</span>
                <span className="text-2xl font-black text-secondary">EDGE</span>
                <span className="text-lg font-bold text-gray-700 ml-1">BETS</span>
              </div>
            </Link>
            <nav className="hidden md:flex space-x-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    item.current
                      ? "text-primary font-medium border-b-2 border-primary pb-1"
                      : "text-gray-600 hover:text-gray-900"
                  } transition-colors`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Subscription Status */}
            {user && (
              <div className="hidden sm:flex items-center space-x-2">
                {user.subscriptionTier === "free" && (
                  <Link href="/subscribe">
                    <Button variant="outline" size="sm">
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade
                    </Button>
                  </Link>
                )}
                {user.subscriptionTier !== "free" && (
                  <Badge 
                    className={`${
                      user.subscriptionTier === "pro" 
                        ? "bg-blue-100 text-blue-800" 
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    <Crown className="h-3 w-3 mr-1" />
                    {user.subscriptionTier?.toUpperCase()}
                  </Badge>
                )}
              </div>
            )}
            
            <div className="hidden sm:flex items-center space-x-2 bg-secondary/10 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-secondary">Live Odds</span>
            </div>
            
            <Button className="bg-primary text-white hover:bg-blue-700 hidden sm:inline-flex">
              <TrendingUp className="h-4 w-4 mr-2" />
              Betting Slip
              {bets.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-white text-primary">
                  {bets.length}
                </Badge>
              )}
            </Button>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-4 mt-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`${
                        item.current
                          ? "text-primary font-medium"
                          : "text-gray-600"
                      } text-lg py-2`}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <div className="pt-4 border-t border-gray-200">
                    <Button className="w-full bg-primary text-white hover:bg-blue-700">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Betting Slip ({bets.length})
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
