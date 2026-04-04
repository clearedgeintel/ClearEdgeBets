import { ReactNode } from "react";
import Sidebar from "./sidebar";
import SidebarRail from "./sidebar-rail";
import TopNav from "./top-nav";
import Footer from "./footer";
import MobileNav from "./mobile-bottom-nav";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar area — desktop only */}
      <div className="hidden lg:block flex-shrink-0 w-16 relative z-40 group/sidebar">
        {/* Rail: always visible at w-16 */}
        <div className="fixed top-0 left-0 h-screen w-16 bg-[#0a0a0c] border-r border-border/20 group-hover/sidebar:opacity-0 transition-opacity duration-200">
          <SidebarRail />
        </div>

        {/* Full sidebar: appears on hover */}
        <div className="fixed top-0 left-0 h-screen w-72 bg-[#0a0a0c] border-r border-border/20 opacity-0 group-hover/sidebar:opacity-100 pointer-events-none group-hover/sidebar:pointer-events-auto transition-opacity duration-200 overflow-y-auto overflow-x-hidden">
          <Sidebar />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          {children}
        </main>

        <div className="hidden lg:block">
          <Footer />
        </div>

        <MobileNav />
      </div>
    </div>
  );
}
