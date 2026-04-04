import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Coins, Sparkles, Star } from "lucide-react";

interface CoinPack {
  id: string;
  coins: number;
  price: number;
  label: string;
  priceLabel: string;
  popular?: boolean;
  bonus?: string;
}

export default function CoinStore() {
  const { toast } = useToast();

  const { data: packs = [] } = useQuery<CoinPack[]>({
    queryKey: ['/api/coin-store'],
    queryFn: () => fetch('/api/coin-store').then(r => r.json()),
  });

  const purchaseMutation = useMutation({
    mutationFn: async (packId: string) => {
      const resp = await fetch('/api/coin-store/purchase', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ packId }),
      });
      if (!resp.ok) throw new Error((await resp.json()).error || 'Failed');
      return resp.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe checkout
      } else {
        toast({ title: `+${data.coins.toLocaleString()} coins!`, description: 'Added to your balance' });
      }
    },
    onError: (err: any) => toast({ title: 'Purchase failed', description: err.message, variant: 'destructive' }),
  });

  if (packs.length === 0) return null;

  return (
    <Card className="border-border/30">
      <CardContent className="p-4">
        <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5 mb-3">
          <Coins className="h-3.5 w-3.5 text-amber-400" />
          Coin Store
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {packs.map(pack => (
            <button
              key={pack.id}
              className={`p-3 rounded-lg border text-center transition-all hover:border-amber-500/30 ${pack.popular ? 'border-amber-500/20 bg-amber-500/5' : 'border-border/30'}`}
              disabled={purchaseMutation.isPending}
              onClick={() => purchaseMutation.mutate(pack.id)}
            >
              {pack.popular && <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/20 text-[9px] mb-1"><Star className="h-2 w-2 mr-0.5" />Popular</Badge>}
              <div className="text-lg font-bold text-amber-400 tabular-nums">{(pack.coins / 1000).toFixed(0)}K</div>
              <div className="text-[10px] text-muted-foreground">{pack.label}</div>
              <div className="text-xs font-medium text-foreground mt-1">{pack.priceLabel}</div>
              {pack.bonus && <div className="text-[9px] text-emerald-400 mt-0.5">{pack.bonus}</div>}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
