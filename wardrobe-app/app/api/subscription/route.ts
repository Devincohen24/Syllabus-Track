import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth-server';
import { getSubscription, isPremium } from '@/lib/subscription';

export async function GET() {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ isPremium: false, status: 'free' });

  const sub = await getSubscription(user.id);
  const premium = await isPremium(user.id);

  return NextResponse.json({
    isPremium: premium,
    status: sub?.status ?? 'free',
    currentPeriodEnd: sub?.current_period_end ?? null,
  });
}
