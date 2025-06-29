import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { BettingSlipProvider } from "@/contexts/betting-slip-context";
import Layout from "@/components/layout";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home-new";
import TodaysGames from "@/pages/todays-games";
import MyBets from "@/pages/my-bets";
import DailyDigest from "@/pages/daily-digest";
import DailyPicks from "@/pages/daily-picks";
import AdminDashboard from "@/pages/admin";
import Subscribe from "@/pages/subscribe";
import CFLHub from "@/pages/cfl-hub";
import CFLGames from "@/pages/cfl-games";
import CFLPicks from "@/pages/cfl-picks";
import CFLDigest from "@/pages/cfl-digest";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/todays-games" component={TodaysGames} />
        <Route path="/my-bets" component={MyBets} />
        <Route path="/daily-digest" component={DailyDigest} />
        <Route path="/daily-picks" component={DailyPicks} />
        <Route path="/subscribe" component={Subscribe} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/cfl" component={CFLHub} />
        <Route path="/cfl/games" component={CFLGames} />
        <Route path="/cfl/picks" component={CFLPicks} />
        <Route path="/cfl/digest" component={CFLDigest} />
        <Route path="/cfl/:section" component={CFLHub} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BettingSlipProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </BettingSlipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
