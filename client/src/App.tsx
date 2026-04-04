import { Switch, Route } from "wouter";
import { lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
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
const ExpertLeaderboard = lazy(() => import("@/pages/expert-leaderboard"));
const Trivia = lazy(() => import("@/pages/trivia"));
const FeedPage = lazy(() => import("@/pages/feed"));
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

// Wrapper that redirects unauthenticated users to /auth
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (!user) return <AuthPage />;
  return <Component />;
}

function Router() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          {/* Public — no login required */}
          <Route path="/" component={Home} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/blog" component={Blog} />
          <Route path="/newsletter" component={NewsletterPage} />
          <Route path="/wiki" component={Wiki} />
          <Route path="/writers" component={Writers} />
          <Route path="/subscribe" component={Subscribe} />

          {/* Protected — login required */}
          <Route path="/games">{() => <ProtectedRoute component={TodaysGames} />}</Route>
          <Route path="/todays-games">{() => <ProtectedRoute component={TodaysGames} />}</Route>
          <Route path="/game/:gameId">{() => <ProtectedRoute component={GameDetail} />}</Route>
          <Route path="/experts">{() => <ProtectedRoute component={Experts} />}</Route>
          <Route path="/expert-leaderboard">{() => <ProtectedRoute component={ExpertLeaderboard} />}</Route>
          <Route path="/trivia">{() => <ProtectedRoute component={Trivia} />}</Route>
          <Route path="/feed" component={FeedPage} />
          <Route path="/my-bets">{() => <ProtectedRoute component={MyBets} />}</Route>
          <Route path="/daily-picks">{() => <ProtectedRoute component={DailyPicks} />}</Route>
          <Route path="/team/:teamAbv">{() => <ProtectedRoute component={TeamDetail} />}</Route>
          <Route path="/team-power-scores">{() => <ProtectedRoute component={TeamPowerScores} />}</Route>
          <Route path="/player-rankings">{() => <ProtectedRoute component={PlayerRankings} />}</Route>
          <Route path="/weather-summary">{() => <ProtectedRoute component={WeatherSummary} />}</Route>
          <Route path="/virtual-sportsbook">{() => <ProtectedRoute component={VirtualSportsbook} />}</Route>
          <Route path="/virtual-performance">{() => <ProtectedRoute component={VirtualPerformance} />}</Route>
          <Route path="/weekly-leaderboard">{() => <ProtectedRoute component={WeeklyLeaderboard} />}</Route>
          <Route path="/groups">{() => <ProtectedRoute component={Groups} />}</Route>
          <Route path="/editors-desk">{() => <ProtectedRoute component={EditorsDesk} />}</Route>
          <Route path="/performance-tracking">{() => <ProtectedRoute component={PerformanceTracking} />}</Route>
          <Route path="/analytics">{() => <ProtectedRoute component={PerformanceAnalytics} />}</Route>
          <Route path="/odds-comparison">{() => <ProtectedRoute component={OddsComparison} />}</Route>
          <Route path="/kelly-calculator">{() => <ProtectedRoute component={KellyCalculator} />}</Route>
          <Route path="/hot-trends">{() => <ProtectedRoute component={HotTrends} />}</Route>
          <Route path="/ai-assistant">{() => <ProtectedRoute component={AIAssistant} />}</Route>
          <Route path="/parlay-builder">{() => <ProtectedRoute component={ParlayBuilder} />}</Route>
          <Route path="/prop-finder">{() => <ProtectedRoute component={PropFinder} />}</Route>
          <Route path="/mlb-picks">{() => <ProtectedRoute component={MLBPicks} />}</Route>
          <Route path="/daily-dose">{() => <ProtectedRoute component={DailyDose} />}</Route>
          <Route path="/enhanced-odds">{() => <ProtectedRoute component={EnhancedOdds} />}</Route>
          <Route path="/expected-value">{() => <ProtectedRoute component={ExpectedValue} />}</Route>
          <Route path="/player-prop-builder">{() => <ProtectedRoute component={PlayerPropBuilder} />}</Route>
          <Route path="/strategies">{() => <ProtectedRoute component={CustomStrategies} />}</Route>
          <Route path="/consultation">{() => <ProtectedRoute component={ExpertConsultation} />}</Route>
          <Route path="/early-access">{() => <ProtectedRoute component={EarlyAccess} />}</Route>
          <Route path="/white-label">{() => <ProtectedRoute component={WhiteLabel} />}</Route>
          <Route path="/help">{() => <ProtectedRoute component={Help} />}</Route>
          <Route path="/cfl">{() => <ProtectedRoute component={CFLHub} />}</Route>
          <Route path="/cfl/games">{() => <ProtectedRoute component={CFLGames} />}</Route>
          <Route path="/cfl/picks">{() => <ProtectedRoute component={CFLPicks} />}</Route>
          <Route path="/cfl/:section">{() => <ProtectedRoute component={CFLHub} />}</Route>
          <Route path="/golf/tournaments">{() => <ProtectedRoute component={GolfTournaments} />}</Route>

          {/* Admin — login + admin check handled server-side */}
          <Route path="/admin">{() => <ProtectedRoute component={AdminPanel} />}</Route>
          <Route path="/admin/users">{() => <ProtectedRoute component={AdminUsers} />}</Route>
          <Route path="/admin/referrals">{() => <ProtectedRoute component={AdminReferrals} />}</Route>
          <Route path="/admin/phrase-detection">{() => <ProtectedRoute component={AdminPhraseDetection} />}</Route>
          <Route path="/admin/stripe-setup">{() => <ProtectedRoute component={StripeSetup} />}</Route>
          <Route path="/admin/ticket-dashboard">{() => <ProtectedRoute component={TicketDashboard} />}</Route>
          <Route path="/admin/api-management">{() => <ProtectedRoute component={APIManagement} />}</Route>
          <Route path="/admin/ai-management">{() => <ProtectedRoute component={AIManagement} />}</Route>
          <Route path="/admin/api-playground">{() => <ProtectedRoute component={AdminAPIPlayground} />}</Route>
          <Route path="/admin/operations">{() => <ProtectedRoute component={AdminOperations} />}</Route>
          <Route path="/admin/newsletter">{() => <ProtectedRoute component={AdminNewsletter} />}</Route>
          <Route path="/admin/api-log">{() => <ProtectedRoute component={AdminAPILog} />}</Route>

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
