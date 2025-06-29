import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import Layout from "@/components/layout";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home-new";
import MyBets from "@/pages/my-bets";
import DailyDigest from "@/pages/daily-digest";
import DailyPicks from "@/pages/daily-picks";
import AdminDashboard from "@/pages/admin";
import Subscribe from "@/pages/subscribe";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/my-bets" component={MyBets} />
        <Route path="/daily-digest" component={DailyDigest} />
        <Route path="/daily-picks" component={DailyPicks} />
        <Route path="/subscribe" component={Subscribe} />
        <Route path="/admin" component={AdminDashboard} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
