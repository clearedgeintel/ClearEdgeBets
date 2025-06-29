import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import MyBets from "@/pages/my-bets";
import DailyDigest from "@/pages/daily-digest";
import DailyPicks from "@/pages/daily-picks";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/my-bets" component={MyBets} />
      <Route path="/daily-digest" component={DailyDigest} />
      <Route path="/daily-picks" component={DailyPicks} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
