import { Switch, Route } from "wouter";
import { lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { BettingSlipProvider } from "@/contexts/betting-slip-context";
import Layout from "@/components/layout";

// Critical path — eager loaded
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import TodaysGames from "@/pages/todays-games";
import DailyPicks from "@/pages/daily-picks";
import AuthPage from "@/pages/auth";

// Non-critical — lazy loaded
const MyBets = lazy(() => import("@/pages/my-bets"));
const AdminPanel = lazy(() => import("@/pages/admin"));
const AdminUsers = lazy(() => import("@/pages/admin-users"));
const AdminReferrals = lazy(() => import("@/pages/admin-referrals"));
const AdminPhraseDetection = lazy(() => import("@/pages/admin-phrase-detection"));
const TicketDashboard = lazy(() => import("@/pages/admin/ticket-dashboard"));
const Subscribe = lazy(() => import("@/pages/subscribe"));
const CFLHub = lazy(() => import("@/pages/cfl-hub"));
const CFLGames = lazy(() => import("@/pages/cfl-games"));
const CFLPicks = lazy(() => import("@/pages/cfl-picks"));
const PerformanceTracking = lazy(() => import("@/pages/performance-tracking"));
const GolfTournaments = lazy(() => import("@/pages/golf-tournaments"));
const PerformanceAnalytics = lazy(() => import("@/pages/performance-analytics"));
const CustomStrategies = lazy(() => import("@/pages/custom-strategies"));
const ExpertConsultation = lazy(() => import("@/pages/expert-consultation"));
const EarlyAccess = lazy(() => import("@/pages/early-access"));
const WhiteLabel = lazy(() => import("@/pages/white-label"));
const ParlayBuilder = lazy(() => import("@/pages/parlay-builder"));
const OddsComparison = lazy(() => import("@/pages/odds-comparison"));
const PropFinder = lazy(() => import("@/pages/prop-finder"));
const HotTrends = lazy(() => import("@/pages/hot-trends"));
const AIAssistant = lazy(() => import("@/pages/ai-assistant"));
const KellyCalculator = lazy(() => import("@/pages/kelly-calculator"));
const GameDetail = lazy(() => import("@/pages/game-detail"));
const VirtualSportsbook = lazy(() => import("@/pages/virtual-sportsbook"));
const WeeklyLeaderboard = lazy(() => import("@/pages/weekly-leaderboard"));
const Groups = lazy(() => import("@/pages/groups"));
const StripeSetup = lazy(() => import("@/pages/stripe-setup"));
const PlayerPropBuilder = lazy(() => import("@/pages/player-prop-builder"));
const Help = lazy(() => import("@/pages/help"));
const VirtualPerformance = lazy(() => import("@/pages/virtual-performance"));
const APIManagement = lazy(() => import("@/pages/APIManagement"));
const AIManagement = lazy(() => import("@/pages/ai-management"));
const AdminAPIPlayground = lazy(() => import("@/pages/admin-api-playground"));
const AdminOperations = lazy(() => import("@/pages/admin-operations"));
const Blog = lazy(() => import("@/pages/blog"));
const TeamDetail = lazy(() => import("@/pages/team-detail"));
const Writers = lazy(() => import("@/pages/writers"));
const EditorsDesk = lazy(() => import("@/pages/editors-desk"));
const NewsletterPage = lazy(() => import("@/pages/newsletter"));
const PlayerRankings = lazy(() => import("@/pages/player-rankings"));
const Wiki = lazy(() => import("@/pages/wiki"));
const Experts = lazy(() => import("@/pages/experts"));
const AdminNewsletter = lazy(() => import("@/pages/admin-newsletter"));
const AdminAPILog = lazy(() => import("@/pages/admin-api-log"));
const WeatherSummary = lazy(() => import("@/pages/WeatherSummary"));
const MLBPicks = lazy(() => import("@/pages/MLBPicks"));
const TeamPowerScores = lazy(() => import("@/pages/TeamPowerScores"));
const DailyDose = lazy(() => import("@/pages/DailyDose"));
const EnhancedOdds = lazy(() => import("@/pages/EnhancedOdds"));

const ExpectedValue = lazy(() => import("@/pages/expected-value"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/games" component={TodaysGames} />
          <Route path="/todays-games" component={TodaysGames} />
          <Route path="/game/:gameId" component={GameDetail} />
          <Route path="/my-bets" component={MyBets} />
          <Route path="/virtual-sportsbook" component={VirtualSportsbook} />
          <Route path="/virtual-performance" component={VirtualPerformance} />
          <Route path="/weekly-leaderboard" component={WeeklyLeaderboard} />
          <Route path="/groups" component={Groups} />
          <Route path="/daily-picks" component={DailyPicks} />
          <Route path="/subscribe" component={Subscribe} />
          <Route path="/admin" component={AdminPanel} />
          <Route path="/admin/users" component={AdminUsers} />
          <Route path="/admin/referrals" component={AdminReferrals} />
          <Route path="/admin/phrase-detection" component={AdminPhraseDetection} />
          <Route path="/admin/stripe-setup" component={StripeSetup} />
          <Route path="/admin/ticket-dashboard" component={TicketDashboard} />
          <Route path="/admin/api-management" component={APIManagement} />
          <Route path="/admin/ai-management" component={AIManagement} />
          <Route path="/admin/api-playground" component={AdminAPIPlayground} />
          <Route path="/admin/operations" component={AdminOperations} />
          <Route path="/blog" component={Blog} />
          <Route path="/team/:teamAbv" component={TeamDetail} />
          <Route path="/writers" component={Writers} />
          <Route path="/editors-desk" component={EditorsDesk} />
          <Route path="/newsletter" component={NewsletterPage} />
          <Route path="/admin/newsletter" component={AdminNewsletter} />
          <Route path="/admin/api-log" component={AdminAPILog} />
          <Route path="/player-rankings" component={PlayerRankings} />
          <Route path="/wiki" component={Wiki} />
          <Route path="/experts" component={Experts} />
          <Route path="/weather-summary" component={WeatherSummary} />
          <Route path="/mlb-picks" component={MLBPicks} />
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
          <Route path="/parlay-builder" component={ParlayBuilder} />
          <Route path="/hot-trends" component={HotTrends} />
          <Route path="/ai-assistant" component={AIAssistant} />
          <Route path="/kelly-calculator" component={KellyCalculator} />
          <Route path="/team-power-scores" component={TeamPowerScores} />
          <Route path="/player-prop-builder" component={PlayerPropBuilder} />
          <Route path="/daily-dose" component={DailyDose} />
          <Route path="/enhanced-odds" component={EnhancedOdds} />
          <Route path="/expected-value" component={ExpectedValue} />
          <Route path="/help" component={Help} />
          <Route path="/auth" component={AuthPage} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
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
