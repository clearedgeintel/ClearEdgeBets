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
      {/* Sidebar — hidden on mobile, visible on lg+ */}
      <div className="hidden lg:block">
        <Sidebar />
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

        {/* Mobile bottom nav — visible on mobile only */}
        <MobileNav />
      </div>
    </div>
  );
}
