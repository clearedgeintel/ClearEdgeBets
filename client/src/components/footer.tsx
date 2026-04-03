import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <img 
                src="/clearedge-logo.png" 
                alt="ClearEdge Sports" 
                className="h-10 w-auto"
              />
            </div>
            <p className="text-muted-foreground text-sm max-w-md">
              Professional sports intelligence powered by AI. Get your clear edge with real-time analysis, game predictions, and performance tracking.
            </p>
            <div className="mt-4 flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live stats and analysis</span>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Platform</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/daily-picks" className="text-sm text-muted-foreground hover:text-primary">
                  Daily Picks
                </Link>
              </li>
              <li>
                <Link href="/daily-digest" className="text-sm text-muted-foreground hover:text-primary">
                  Daily Digest
                </Link>
              </li>
              <li>
                <Link href="/my-bets" className="text-sm text-muted-foreground hover:text-primary">
                  My Picks
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Account</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/subscribe" className="text-sm text-muted-foreground hover:text-primary">
                  Pricing
                </Link>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary">
                  Support
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary">
                  Terms
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Newsletter subscribe */}
        <div className="mt-8 pt-8 border-t border-border mb-8">
          <div className="max-w-md">
            <h3 className="text-sm font-semibold text-foreground mb-2">The Daily Brief</h3>
            <p className="text-xs text-muted-foreground mb-3">Get yesterday's results and today's quick picks in your inbox every morning.</p>
            <form className="flex gap-2" onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const email = (form.elements.namedItem('footerEmail') as HTMLInputElement).value;
              if (!email) return;
              try {
                await fetch('/api/newsletter/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
                (form.elements.namedItem('footerEmail') as HTMLInputElement).value = '';
                (form.elements.namedItem('footerEmail') as HTMLInputElement).placeholder = 'Subscribed!';
              } catch {}
            }}>
              <input name="footerEmail" type="email" placeholder="you@email.com" className="flex-1 h-8 px-3 text-xs bg-zinc-900 border border-border/50 rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/50" />
              <button type="submit" className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-md">Subscribe</button>
            </form>
          </div>
        </div>

        <div className="pt-6 border-t border-border">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © 2025 ClearEdge Sports. All rights reserved.
            </p>
            <div className="mt-4 sm:mt-0 flex items-center space-x-6">
              <span className="text-sm text-gray-500">
                For Entertainment Purposes
              </span>
              <span className="text-sm text-gray-500">
                Not Financial Advice
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}