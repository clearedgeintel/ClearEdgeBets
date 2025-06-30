import { useAuth } from "@/contexts/auth-context";
import { useTierAccess } from "@/components/tier-restrictions";
import FreeTierHome from "@/pages/free-tier-home";
import HomeNew from "@/pages/home-new";

export default function TieredHome() {
  const { user } = useAuth();
  const { userTier, hasProAccess } = useTierAccess();

  // Show free tier home for unauthenticated users or free tier users
  if (!user || userTier === 'free') {
    return <FreeTierHome />;
  }

  // Show full home for Pro/Elite users
  return <HomeNew />;
}