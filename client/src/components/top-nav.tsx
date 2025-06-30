import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bell, User, Settings, LogOut, Crown, Zap, Shield, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import LoginForm from "@/components/auth/login-form";

export default function TopNav() {
  const { user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'free':
        return <Badge variant="outline" className="bg-gray-100 text-gray-700">Free</Badge>;
      case 'pro':
        return <Badge className="bg-blue-600 text-white"><Crown className="h-3 w-3 mr-1" />Pro</Badge>;
      case 'elite':
        return <Badge className="bg-purple-600 text-white"><Zap className="h-3 w-3 mr-1" />Elite</Badge>;
      default:
        return <Badge variant="outline">Free</Badge>;
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'pro':
        return <Crown className="h-4 w-4 text-blue-600" />;
      case 'elite':
        return <Zap className="h-4 w-4 text-purple-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <img 
              src="/clearedge-logo-new.png" 
              alt="ClearEdge Bets" 
              className="h-8 w-auto"
            />
            <span className="text-xl font-bold text-foreground hidden sm:block">
              ClearEdge Bets
            </span>
          </Link>

          {/* Center - Status */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live Updates</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
          </div>

          {/* Right Side - User Info */}
          <div className="flex items-center space-x-4">
            
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                2
              </span>
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 px-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-white text-sm">
                        {user.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium text-foreground">
                        {user.username}
                      </div>
                      <div className="flex items-center space-x-2">
                        {getTierIcon(user.subscriptionTier || 'free')}
                        <span className="text-xs text-muted-foreground capitalize">
                          {user.subscriptionTier || 'free'} Plan
                        </span>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div className="flex items-center justify-between">
                      <span>Account</span>
                      {getTierBadge(user.subscriptionTier || 'free')}
                    </div>
                  </DropdownMenuLabel>
                  
                  <DropdownMenuSeparator />
                  
                  <div className="p-2 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between mb-2">
                      <span>Email:</span>
                      <span className="font-medium">{user.email}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span>Member since:</span>
                      <span className="font-medium">Recently</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Status:</span>
                      <span className="font-medium capitalize">{user.subscriptionStatus || 'Active'}</span>
                    </div>
                  </div>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem asChild>
                    <Link href="/my-bets" className="flex items-center w-full">
                      <User className="h-4 w-4 mr-2" />
                      My Bets
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link href="/performance" className="flex items-center w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Performance
                    </Link>
                  </DropdownMenuItem>
                  
                  {user.subscriptionTier === 'free' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/subscribe" className="flex items-center w-full text-primary">
                          <Crown className="h-4 w-4 mr-2" />
                          Upgrade Plan
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={logout}
                    className="flex items-center w-full text-red-600 focus:text-red-600"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Dialog open={showLogin} onOpenChange={setShowLogin}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Welcome Back</DialogTitle>
                    </DialogHeader>
                    <LoginForm onSuccess={() => setShowLogin(false)} />
                  </DialogContent>
                </Dialog>
                
                <Link href="/subscribe">
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    <Crown className="h-4 w-4 mr-2" />
                    Get Pro
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}