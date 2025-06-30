import { ReactNode } from "react";
import Sidebar from "./sidebar";
import TopNav from "./top-nav";
import Footer from "./footer";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <TopNav />
        <main className="flex-1 overflow-y-auto">
          <div className="lg:pl-0 pl-16">
            {children}
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}