# Stripe Integration Setup Guide

## Step 1: Create Products in Stripe Dashboard

1. **Login to Stripe Dashboard**: https://dashboard.stripe.com
2. **Go to Products**: Navigate to Products → + Add Product

### Create Pro Plan ($25/month)
- **Name**: ClearEdge Bets Pro
- **Price**: $25.00 USD
- **Billing Period**: Monthly
- **Copy the Price ID** (starts with `price_`) - you'll need this

### Create Elite Plan ($40/month)  
- **Name**: ClearEdge Bets Elite
- **Price**: $40.00 USD
- **Billing Period**: Monthly
- **Copy the Price ID** (starts with `price_`) - you'll need this

## Step 2: Set Environment Variables

Add these to your environment (in Replit's Secrets tab):

```
STRIPE_SECRET_KEY=sk_test_... (your secret key)
STRIPE_PRO_PRICE_ID=price_... (Pro plan price ID)
STRIPE_ELITE_PRICE_ID=price_... (Elite plan price ID)
STRIPE_WEBHOOK_SECRET=whsec_... (webhook endpoint secret)
```

## Step 3: Configure Webhooks

1. **Go to Webhooks** in Stripe Dashboard
2. **Add Endpoint**: https://your-app-url.replit.app/api/webhooks/stripe
3. **Select Events**:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
4. **Copy the Signing Secret** and add as `STRIPE_WEBHOOK_SECRET`

## Step 4: Test the Integration

### Test Checkout Flow:
```bash
# Create checkout session for Pro tier
curl -X POST http://localhost:5000/api/subscriptions/create-checkout \
  -H "Content-Type: application/json" \
  -d '{"tier": "pro"}' \
  -b "session-cookie"

# Create checkout session for Elite tier  
curl -X POST http://localhost:5000/api/subscriptions/create-checkout \
  -H "Content-Type: application/json" \
  -d '{"tier": "elite"}' \
  -b "session-cookie"
```

### API Endpoints Available:

- `POST /api/subscriptions/create-checkout` - Create Stripe checkout session
- `POST /api/webhooks/stripe` - Handle Stripe webhooks  
- `GET /api/subscriptions/products` - Get pricing info
- `POST /api/subscriptions/cancel` - Cancel subscription

## Step 5: Frontend Integration

Update your subscribe page to use the new checkout endpoint:

```typescript
// In your subscribe page component
const createCheckoutSession = async (tier: 'pro' | 'elite') => {
  const response = await fetch('/api/subscriptions/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier })
  });
  
  const { url } = await response.json();
  window.location.href = url; // Redirect to Stripe checkout
};
```

## Tier Features Mapping

### Free Tier
- Kelly Calculator
- Games viewing
- My Bets tracking

### Pro Tier ($25/month)
- All Free features
- Daily AI Picks
- Odds Comparison  
- Hot Trends

### Elite Tier ($40/month)
- All Pro features
- Performance Analytics
- AI Assistant
- Parlay Builder
- Custom Strategies
- Expert Consultation
- Early Access Features

## Next Steps

1. Replace the placeholder price IDs in `server/stripe-config.ts` with your actual Stripe price IDs
2. Test the complete checkout flow in test mode
3. Update frontend subscribe buttons to use the new checkout endpoint
4. Test webhook handling by completing a test purchase
5. Switch to live mode when ready for production

## Security Notes

- Never expose your secret key in frontend code
- Always validate webhook signatures
- Test thoroughly in Stripe's test mode first
- Keep your webhook endpoint secure and fast-responding