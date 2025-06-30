import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown, Zap, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';

interface TierRestrictionProps {
  requiredTier: 'free' | 'pro' | 'elite';
  feature: string;
  children: React.ReactNode;
  fallbackComponent?: React.ReactNode;
}

export function TierRestriction({ requiredTier, feature, children, fallbackComponent }: TierRestrictionProps) {
  const { user } = useAuth();
  
  // Get user tier (default to 'free' if not authenticated)
  const userTier = user?.subscriptionTier || 'free';
  
  // Define tier hierarchy
  const tierLevels = { free: 0, pro: 1, elite: 2 };
  const userLevel = tierLevels[userTier as keyof typeof tierLevels] || 0;
  const requiredLevel = tierLevels[requiredTier];
  
  // Check if user has access
  const hasAccess = userLevel >= requiredLevel;
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (fallbackComponent) {
    return <>{fallbackComponent}</>;
  }
  
  // Default upgrade prompt
  return (
    <Card className="border-dashed border-2 border-orange-200 bg-orange-50/50">
      <CardContent className="p-6 text-center">
        <div className="flex flex-col items-center space-y-4">
          {requiredTier === 'pro' && <Crown className="h-8 w-8 text-orange-500" />}
          {requiredTier === 'elite' && <Zap className="h-8 w-8 text-purple-500" />}
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              {requiredTier === 'pro' ? 'Pro' : 'Elite'} Feature
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Unlock {feature} with {requiredTier === 'pro' ? 'Pro' : 'Elite'} subscription
            </p>
            <Badge variant="outline" className={
              requiredTier === 'pro' ? 'border-orange-200 text-orange-600' :
              'border-purple-200 text-purple-600'
            }>
              {requiredTier === 'pro' ? '$9.99/month' : '$19.99/month'}
            </Badge>
          </div>
          
          <Link href="/subscribe">
            <Button size="sm" className={
              requiredTier === 'pro' ? 'bg-orange-500 hover:bg-orange-600' :
              'bg-purple-500 hover:bg-purple-600'
            }>
              <TrendingUp className="h-4 w-4 mr-2" />
              Upgrade Now
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

interface FreeTierLimitProps {
  maxItems: number;
  currentCount: number;
  itemType: string;
  upgradeMessage: string;
}

export function FreeTierLimit({ maxItems, currentCount, itemType, upgradeMessage }: FreeTierLimitProps) {
  const isAtLimit = currentCount >= maxItems;
  
  if (!isAtLimit) {
    return null;
  }
  
  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Lock className="h-5 w-5 text-orange-500" />
            <div>
              <p className="font-medium text-gray-900">Free Tier Limit Reached</p>
              <p className="text-sm text-gray-600">
                You've viewed {currentCount}/{maxItems} {itemType}. {upgradeMessage}
              </p>
            </div>
          </div>
          <Link href="/subscribe">
            <Button size="sm" variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50">
              Upgrade
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook to check tier access
export function useTierAccess() {
  const { user } = useAuth();
  const userTier = user?.subscriptionTier || 'free';
  
  return {
    userTier,
    hasProAccess: userTier === 'pro' || userTier === 'elite',
    hasEliteAccess: userTier === 'elite',
    canAccess: (requiredTier: 'free' | 'pro' | 'elite') => {
      const tierLevels = { free: 0, pro: 1, elite: 2 };
      const userLevel = tierLevels[userTier as keyof typeof tierLevels] || 0;
      const requiredLevel = tierLevels[requiredTier];
      return userLevel >= requiredLevel;
    }
  };
}