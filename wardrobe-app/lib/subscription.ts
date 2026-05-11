import { getSupabase } from './supabase';

export type SubscriptionStatus = 'free' | 'active' | 'canceled' | 'past_due';

export async function getSubscription(userId: string) {
  const db = getSupabase();
  const { data } = await db
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();
  return data;
}

export async function isPremium(userId: string): Promise<boolean> {
  const sub = await getSubscription(userId);
  if (!sub) return false;
  if (sub.status !== 'active') return false;
  if (sub.current_period_end && new Date(sub.current_period_end) < new Date()) return false;
  return true;
}

export async function upsertSubscription(payload: {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: SubscriptionStatus;
  currentPeriodEnd: Date;
}) {
  const db = getSupabase();
  await db.from('subscriptions').upsert({
    user_id: payload.userId,
    stripe_customer_id: payload.stripeCustomerId,
    stripe_subscription_id: payload.stripeSubscriptionId,
    status: payload.status,
    current_period_end: payload.currentPeriodEnd.toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
}
