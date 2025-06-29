import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <img 
                src="/clearedge-logo.png" 
                alt="ClearEdge Bets" 
                className="h-10 w-auto"
              />
            </div>
            <p className="text-gray-600 text-sm max-w-md">
              Professional MLB betting intelligence powered by AI. Get your clear edge with real-time analysis, expert picks, and smart bankroll management.
            </p>
            <div className="mt-4 flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live odds and analysis</span>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Platform</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/" className="text-sm text-gray-600 hover:text-primary">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/daily-picks" className="text-sm text-gray-600 hover:text-primary">
                  Daily Picks
                </Link>
              </li>
              <li>
                <Link href="/daily-digest" className="text-sm text-gray-600 hover:text-primary">
                  Daily Digest
                </Link>
              </li>
              <li>
                <Link href="/my-bets" className="text-sm text-gray-600 hover:text-primary">
                  My Bets
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Account</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/subscribe" className="text-sm text-gray-600 hover:text-primary">
                  Pricing
                </Link>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-primary">
                  Support
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-primary">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-primary">
                  Terms
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">
              © 2025 ClearEdge Bets. All rights reserved.
            </p>
            <div className="mt-4 sm:mt-0 flex items-center space-x-6">
              <span className="text-sm text-gray-500">
                Responsible Gaming
              </span>
              <span className="text-sm text-gray-500">
                21+ Only
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}