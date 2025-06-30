import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Menu, Crown } from "lucide-react";
// import logoPath from "/logo.png";
import { useBettingSlip } from "@/contexts/betting-slip-context";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Header() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { bets } = useBettingSlip();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <img 
                src={`/clearedge-logo-final.png?v=${Date.now()}`}
                alt="ClearEdge Bets" 
                className="h-12 w-auto"
                onError={(e) => {
                  e.currentTarget.src = "/logo.svg";
                }}
              />
            </Link>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Subscription Status */}
            {user && user.subscriptionTier === "free" && (
              <Link href="/subscribe">
                <Button size="sm" className="hidden sm:inline-flex">
                  Upgrade Pro
                </Button>
              </Link>
            )}
            
            {user && user.subscriptionTier !== "free" && (
              <Badge 
                variant="outline"
                className={`hidden sm:inline-flex ${
                  user.subscriptionTier === "pro" 
                    ? "border-primary text-primary" 
                    : "border-secondary text-secondary"
                }`}
              >
                {user.subscriptionTier?.toUpperCase()}
              </Badge>
            )}
            
            <div className="hidden sm:flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">Live</span>
            </div>


          </div>
        </div>
      </div>
    </header>
  );
}
