import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getServerUser } from '@/lib/auth-server';
import { getSubscription } from '@/lib/subscription';

export async function POST() {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await getSubscription(user.id);
  if (!existing?.stripe_customer_id) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
  }

  const stripe = getStripe();
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const session = await stripe.billingPortal.sessions.create({
    customer: existing.stripe_customer_id,
    return_url: `${siteUrl}/settings`,
  });

  return NextResponse.json({ url: session.url });
}
