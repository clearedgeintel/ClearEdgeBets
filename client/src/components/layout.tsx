import { ReactNode } from "react";
import Sidebar from "./sidebar";
import TopNav from "./top-nav";
import Footer from "./footer";
import MobileNav from "./mobile-bottom-nav";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar — collapsed by default (w-16 icons), expands on hover (w-72) */}
      <div className="hidden lg:block group/sidebar flex-shrink-0 w-16 hover:w-72 transition-all duration-300 ease-in-out relative z-40">
        <div className="fixed top-0 left-0 h-screen w-16 group-hover/sidebar:w-72 transition-all duration-300 ease-in-out overflow-hidden bg-[#0a0a0c] border-r border-border/20">
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
