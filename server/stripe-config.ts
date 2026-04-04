// Stripe Product Configuration
// Replace price IDs with your actual Stripe Price IDs from dashboard

export const STRIPE_PRODUCTS = {
  edge: {
    priceId: process.env.STRIPE_EDGE_PRICE_ID || 'price_edge_monthly',
    annualPriceId: process.env.STRIPE_EDGE_ANNUAL_PRICE_ID || 'price_edge_annual',
    tier: 'edge',
    name: 'Edge Pass',
    price: 25,
    annualPrice: 240, // $20/mo billed annually (20% off)
    interval: 'month',
    features: [
      'All 5 Expert Analysts — real-time picks',
      'Unlimited Follow & Fade',
      'Daily AI Picks & Analysis',
      'Odds Comparison (8 books)',
      'Player Rankings + Power Scores',
      'Daily Trivia (earn bonus coins)',
      'Performance Analytics',
      'Newsletter (premium edition)',
    ],
  },
  sharp: {
    priceId: process.env.STRIPE_SHARP_PRICE_ID || 'price_sharp_monthly',
    annualPriceId: process.env.STRIPE_SHARP_ANNUAL_PRICE_ID || 'price_sharp_annual',
    tier: 'sharp',
    name: 'Sharp Pass',
    price: 40,
    annualPrice: 384, // $32/mo billed annually (20% off)
    interval: 'month',
    features: [
      'Everything in Edge Pass',
      'Expert Consensus Alerts (when 3+ agree)',
      'The Sharp & The Closer — premium picks',
      'AI Assistant (unlimited)',
      'Parlay Builder + Prop Finder',
      'Custom Strategies',
      'Priority API access',
      'Early access to new features',
    ],
  },
};

// Tier hierarchy for access checks
export const TIER_HIERARCHY: Record<string, number> = {
  free: 0,
  pro: 1,    // legacy — maps to edge
  edge: 1,
  elite: 2,  // legacy — maps to sharp
  sharp: 2,
};

// Map legacy tier names
export function normalizeTier(tier: string): string {
  if (tier === 'pro') return 'edge';
  if (tier === 'elite') return 'sharp';
  return tier;
}

// Check if user tier has access to a required tier level
export function hasAccess(userTier: string, requiredTier: string): boolean {
  const userLevel = TIER_HIERARCHY[normalizeTier(userTier)] || 0;
  const requiredLevel = TIER_HIERARCHY[normalizeTier(requiredTier)] || 0;
  return userLevel >= requiredLevel;
}

// Helper function to get product config by tier
export function getProductByTier(tier: string) {
  const normalized = normalizeTier(tier);
  return STRIPE_PRODUCTS[normalized as keyof typeof STRIPE_PRODUCTS];
}

// Helper function to get tier by price ID
export function getTierByPriceId(priceId: string) {
  for (const [, product] of Object.entries(STRIPE_PRODUCTS)) {
    if (product.priceId === priceId || product.annualPriceId === priceId) {
      return product.tier;
    }
  }
  return null;
}

// Free tier limits
export const FREE_TIER_LIMITS = {
  maxExpertFollows: 1,
  canFade: false,
  pickDelay: 30, // minutes — free users see picks 30 min late
  dailyTriviaBonusCoins: false,
  aiAssistant: false,
  parlayBuilder: false,
  customStrategies: false,
};
