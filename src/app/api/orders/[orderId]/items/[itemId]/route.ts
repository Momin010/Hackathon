import { NextResponse } from 'next/server';
import { updateOrderItem } from '@/lib/supabase-client';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function PUT(
  request: Request,
  { params }: { params: { orderId: string; itemId: string } }
) {
  try {
    const { orderId, itemId } = params;
    const body = await request.json();
    const { purchased } = body;

    if (typeof purchased !== 'boolean') {
      return NextResponse.json(
        { error: 'purchased field is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    await updateOrderItem(orderId, itemId, purchased);
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error('Order item PUT error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}
