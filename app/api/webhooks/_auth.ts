import { NextRequest, NextResponse } from 'next/server';

export function checkWebhookAuth(req: NextRequest): NextResponse | null {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) return null; // pas de secret configuré = pas de protection (dev)
  const token = req.headers.get('x-webhook-secret') ?? req.nextUrl.searchParams.get('secret');
  if (token !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
