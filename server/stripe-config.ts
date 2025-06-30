// Stripe Product Configuration
// Replace these with your actual Stripe Price IDs from your dashboard

export const STRIPE_PRODUCTS = {
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_1234567890abcdef', // Replace with actual Pro price ID
    tier: 'pro',
    name: 'Pro Plan',
    price: 25,
    interval: 'month',
    features: [
      'Daily AI Picks',
      'Odds Comparison',
      'Hot Trends',
      'Kelly Calculator'
    ]
  },
  elite: {
    priceId: process.env.STRIPE_ELITE_PRICE_ID || 'price_0987654321fedcba', // Replace with actual Elite price ID
    tier: 'elite',
    name: 'Elite Plan', 
    price: 40,
    interval: 'month',
    features: [
      'All Pro Features',
      'Performance Analytics',
      'AI Assistant',
      'Parlay Builder',
      'Custom Strategies',
      'Expert Consultation',
      'Early Access Features'
    ]
  }
};

// Helper function to get product config by tier
export function getProductByTier(tier: string) {
  return STRIPE_PRODUCTS[tier as keyof typeof STRIPE_PRODUCTS];
}

// Helper function to get tier by price ID
export function getTierByPriceId(priceId: string) {
  for (const [tier, product] of Object.entries(STRIPE_PRODUCTS)) {
    if (product.priceId === priceId) {
      return tier;
    }
  }
  return null;
}