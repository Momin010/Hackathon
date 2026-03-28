import { NextResponse } from 'next/server';
import { getHistory } from '@/lib/supabase-client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const orders = await getHistory(limit);

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('History error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
