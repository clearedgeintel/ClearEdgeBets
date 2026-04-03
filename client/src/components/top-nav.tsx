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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Bell, User, Settings, LogOut, Crown, Zap, Shield, ChevronDown, Menu } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import LoginForm from "@/components/auth/login-form";
import RegisterForm from "@/components/auth/register-form";
import Sidebar from "@/components/sidebar";

export default function TopNav() {
  const { user, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'free':
        return <Badge variant="outline" className="bg-zinc-800 text-zinc-400 border-zinc-700">Free</Badge>;
      case 'pro':
        return <Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/25"><Crown className="h-3 w-3 mr-1" />Pro</Badge>;
      case 'elite':
        return <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/25"><Zap className="h-3 w-3 mr-1" />Elite</Badge>;
      default:
        return <Badge variant="outline" className="bg-zinc-800 text-zinc-400 border-zinc-700">Free</Badge>;
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'pro':
        return <Crown className="h-4 w-4 text-blue-400" />;
      case 'elite':
        return <Zap className="h-4 w-4 text-amber-400" />;
      default:
        return <Shield className="h-4 w-4 text-zinc-500" />;
    }
  };

  return (
    <header className="bg-background/80 border-b border-border/50 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Mobile Menu + Logo */}
          <div className="flex items-center space-x-3">
            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button size="sm" variant="outline" className="bg-background shadow-sm border hover:bg-accent">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-80 overflow-y-auto">
                  <div className="h-full overflow-y-auto">
                    <div className="p-4 border-b border-border bg-background">
                      <div className="flex items-center space-x-3">
                        <img 
                          src="/clearedge-logo-new.png" 
                          alt="ClearEdge Sports" 
                          className="h-8 w-auto"
                        />
                        <span className="text-lg font-bold text-foreground">
                          ClearEdge Sports
                        </span>
                      </div>
                    </div>
                    <Sidebar isMobileSheet={true} onNavigate={() => setMobileMenuOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <img 
                src="/clearedge-logo-new.png" 
                alt="ClearEdge Sports" 
                className="h-8 w-auto"
              />
              <span className="text-xl font-bold text-foreground hidden sm:block">
                ClearEdge Sports
              </span>
            </Link>
          </div>

          {/* Center - Status */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
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
                      My Picks
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
                <Dialog open={showAuth} onOpenChange={setShowAuth}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setAuthMode('login');
                        setShowAuth(true);
                      }}
                    >
                      Sign In
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {authMode === 'login' ? 'Welcome Back' : 'Join ClearEdge Sports'}
                      </DialogTitle>
                    </DialogHeader>
                    {authMode === 'login' ? (
                      <LoginForm 
                        onSuccess={() => setShowAuth(false)} 
                        onToggleMode={() => setAuthMode('register')}
                      />
                    ) : (
                      <RegisterForm 
                        onSuccess={() => setShowAuth(false)} 
                        onToggleMode={() => setAuthMode('login')}
                      />
                    )}
                  </DialogContent>
                </Dialog>
                
                <Button 
                  size="sm" 
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => {
                    setAuthMode('register');
                    setShowAuth(true);
                  }}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Get Pro
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}