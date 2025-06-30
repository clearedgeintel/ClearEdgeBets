import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { BettingSlipProvider } from "@/contexts/betting-slip-context";
import Layout from "@/components/layout";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import TodaysGames from "@/pages/todays-games";
import MyBets from "@/pages/my-bets";
import DailyPicks from "@/pages/daily-picks";
import AdminPanel from "@/pages/admin";
import Subscribe from "@/pages/subscribe";
import CFLHub from "@/pages/cfl-hub";
import CFLGames from "@/pages/cfl-games";
import CFLPicks from "@/pages/cfl-picks";
import PerformanceTracking from "@/pages/performance-tracking";
import GolfTournaments from "@/pages/golf-tournaments";
import AuthPage from "@/pages/auth";
import PerformanceAnalytics from "@/pages/performance-analytics";
import CustomStrategies from "@/pages/custom-strategies";
import ExpertConsultation from "@/pages/expert-consultation";
import EarlyAccess from "@/pages/early-access";
import WhiteLabel from "@/pages/white-label";
import OddsComparison from "@/pages/odds-comparison";
import PropFinder from "@/pages/prop-finder";
import HotTrends from "@/pages/hot-trends";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/todays-games" component={TodaysGames} />
        <Route path="/my-bets" component={MyBets} />
        <Route path="/daily-picks" component={DailyPicks} />
        <Route path="/subscribe" component={Subscribe} />
        <Route path="/admin" component={AdminPanel} />
        <Route path="/cfl" component={CFLHub} />
        <Route path="/cfl/games" component={CFLGames} />
        <Route path="/cfl/picks" component={CFLPicks} />
        <Route path="/cfl/:section" component={CFLHub} />
        <Route path="/golf/tournaments" component={GolfTournaments} />
        <Route path="/performance-tracking" component={PerformanceTracking} />
        <Route path="/analytics" component={PerformanceAnalytics} />
        <Route path="/strategies" component={CustomStrategies} />
        <Route path="/consultation" component={ExpertConsultation} />
        <Route path="/early-access" component={EarlyAccess} />
        <Route path="/white-label" component={WhiteLabel} />
        <Route path="/odds-comparison" component={OddsComparison} />
        <Route path="/prop-finder" component={PropFinder} />
        <Route path="/hot-trends" component={HotTrends} />
        <Route path="/auth" component={AuthPage} />
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
