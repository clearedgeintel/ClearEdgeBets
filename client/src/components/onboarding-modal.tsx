import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Check } from "lucide-react";

const MLB_TEAMS = [
  { code: "NYY", name: "Yankees" }, { code: "BOS", name: "Red Sox" }, { code: "BAL", name: "Orioles" },
  { code: "TOR", name: "Blue Jays" }, { code: "TB", name: "Rays" }, { code: "CLE", name: "Guardians" },
  { code: "MIN", name: "Twins" }, { code: "DET", name: "Tigers" }, { code: "CWS", name: "White Sox" },
  { code: "KC", name: "Royals" }, { code: "HOU", name: "Astros" }, { code: "SEA", name: "Mariners" },
  { code: "TEX", name: "Rangers" }, { code: "LAA", name: "Angels" }, { code: "OAK", name: "Athletics" },
  { code: "ATL", name: "Braves" }, { code: "NYM", name: "Mets" }, { code: "PHI", name: "Phillies" },
  { code: "MIA", name: "Marlins" }, { code: "WSH", name: "Nationals" }, { code: "MIL", name: "Brewers" },
  { code: "CHC", name: "Cubs" }, { code: "STL", name: "Cardinals" }, { code: "CIN", name: "Reds" },
  { code: "PIT", name: "Pirates" }, { code: "LAD", name: "Dodgers" }, { code: "SD", name: "Padres" },
  { code: "SF", name: "Giants" }, { code: "ARI", name: "D-backs" }, { code: "COL", name: "Rockies" },
];

const NHL_TEAMS = [
  { code: "BOS", name: "Bruins", sport: "nhl" }, { code: "NYR", name: "Rangers", sport: "nhl" },
  { code: "TOR", name: "Maple Leafs", sport: "nhl" }, { code: "FLA", name: "Panthers", sport: "nhl" },
  { code: "TB", name: "Lightning", sport: "nhl" }, { code: "CAR", name: "Hurricanes", sport: "nhl" },
  { code: "WSH", name: "Capitals", sport: "nhl" }, { code: "PIT", name: "Penguins", sport: "nhl" },
  { code: "DAL", name: "Stars", sport: "nhl" }, { code: "COL", name: "Avalanche", sport: "nhl" },
  { code: "WPG", name: "Jets", sport: "nhl" }, { code: "EDM", name: "Oilers", sport: "nhl" },
  { code: "VGK", name: "Golden Knights", sport: "nhl" }, { code: "VAN", name: "Canucks", sport: "nhl" },
  { code: "MIN", name: "Wild", sport: "nhl" }, { code: "NSH", name: "Predators", sport: "nhl" },
];

function teamLogo(code: string, sport: string = "mlb") {
  const c = code.toUpperCase() === "WAS" ? "wsh" : code.toLowerCase();
  return `https://a.espncdn.com/i/teamlogos/${sport}/500/scoreboard/${c}.png`;
}

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: async (teams: string[]) => apiRequest("POST", "/api/auth/onboarding", { favoriteTeams: teams }),
    onSuccess: () => {
      toast({ title: "Welcome to ClearEdge!", description: `Following ${selected.size} teams` });
      onComplete();
    },
  });

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const TeamGrid = ({ teams, sport }: { teams: Array<{ code: string; name: string }>; sport: string }) => (
    <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
      {teams.map((t) => {
        const key = `${sport}:${t.code}`;
        const active = selected.has(key);
        return (
          <button
            key={key}
            onClick={() => toggle(key)}
            className={`relative flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
              active
                ? "border-amber-500/60 bg-amber-500/15 ring-1 ring-amber-500/30"
                : "border-border/30 bg-zinc-900/40 hover:border-zinc-600"
            }`}
          >
            {active && (
              <div className="absolute top-1 right-1">
                <Check className="h-3 w-3 text-amber-400" />
              </div>
            )}
            <img
              src={teamLogo(t.code, sport)}
              alt={t.name}
              className="h-8 w-8"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <span className="text-[9px] font-medium text-zinc-400 leading-tight text-center">{t.name}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Trophy className="h-5 w-5 text-amber-400" />
            Pick your teams
          </DialogTitle>
          <p className="text-sm text-zinc-500">
            Choose your favorite teams to personalize your experience. You can change these anytime.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <h3 className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">MLB</h3>
            <TeamGrid teams={MLB_TEAMS} sport="mlb" />
          </div>
          <div>
            <h3 className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">NHL</h3>
            <TeamGrid teams={NHL_TEAMS} sport="nhl" />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              saveMutation.mutate([]);
            }}
            className="text-zinc-500"
          >
            Skip for now
          </Button>
          <Button
            onClick={() => saveMutation.mutate(Array.from(selected))}
            disabled={saveMutation.isPending}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {selected.size > 0 ? `Follow ${selected.size} team${selected.size !== 1 ? "s" : ""}` : "Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
