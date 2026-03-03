import { NextRequest, NextResponse } from 'next/server';

export function checkWebhookAuth(req: NextRequest): NextResponse | null {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'development') {
      // en dev on autorise sans secret pour faciliter les tests locaux
      return null;
    }
    console.error('[checkWebhookAuth] WEBHOOK_SECRET manquant en production');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }
  const token = req.headers.get('x-webhook-secret') ?? req.nextUrl.searchParams.get('secret');
  if (token !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
