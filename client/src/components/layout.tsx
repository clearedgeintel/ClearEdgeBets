import { ReactNode, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import Sidebar from "./sidebar";
import SidebarRail from "./sidebar-rail";
import TopNav from "./top-nav";
import Footer from "./footer";
import MobileNav from "./mobile-bottom-nav";
import { OnboardingModal } from "./onboarding-modal";
import { DailyTriviaBubble } from "./daily-trivia-bubble";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const showOnboarding = !!user && !user.onboardingComplete && !onboardingDismissed;

  return (
    <div className="min-h-screen flex">
      {showOnboarding && (
        <OnboardingModal open={true} onComplete={() => {
          setOnboardingDismissed(true);
          if (user) user.onboardingComplete = true;
        }} />
      )}
      {/* Sidebar area — rail visible at md+ (tablet + desktop); full sidebar on hover */}
      <div className="hidden md:block flex-shrink-0 w-16 relative z-40 group/sidebar">
        {/* Rail: always visible at w-16 */}
        <div className="fixed top-0 left-0 h-screen w-16 bg-[#111113] border-r border-border/20 group-hover/sidebar:opacity-0 transition-opacity duration-200">
          <SidebarRail />
        </div>

        {/* Full sidebar: appears on hover */}
        <div className="fixed top-0 left-0 h-screen w-72 bg-[#111113] border-r border-border/20 opacity-0 group-hover/sidebar:opacity-100 pointer-events-none group-hover/sidebar:pointer-events-auto transition-opacity duration-200 overflow-y-auto overflow-x-hidden">
          <Sidebar />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          <div key={location} className="page-enter">
            {children}
          </div>
        </main>

        <div className="hidden lg:block">
          <Footer />
        </div>

        <MobileNav />
        <DailyTriviaBubble />
      </div>
    </div>
  );
}
