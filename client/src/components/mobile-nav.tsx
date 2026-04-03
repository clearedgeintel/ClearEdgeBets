import { Link, useLocation } from "wouter";
import { Home, TrendingUp, FileText, User } from "lucide-react";

export default function MobileNav() {
  const [location] = useLocation();

  const navigation = [
    { name: "Games", href: "/", icon: Home, current: location === "/" },
    { name: "My Picks", href: "/my-bets", icon: TrendingUp, current: location === "/my-bets" },
    { name: "Digest", href: "/daily-digest", icon: FileText, current: location === "/daily-digest" },
    { name: "Profile", href: "#", icon: User, current: false },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-40">
      <div className="grid grid-cols-4 py-2">
        {navigation.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center py-2 px-1 ${
                item.current ? "text-primary" : "text-gray-600"
              }`}
            >
              <IconComponent className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
