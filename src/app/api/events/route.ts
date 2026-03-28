import { NextResponse } from 'next/server';
import { fetchAllEvents } from '@/lib/luma-client';
import { classifyEvent } from '@/lib/classifier';

export async function GET() {
  try {
    const events = await fetchAllEvents();

    const enriched = events.map((event) => ({
      id: event.id,
      name: event.name,
      description: event.description,
      start_at: event.start_at,
      url: event.url,
      event_type: classifyEvent(event.name, event.description),
    }));

    return NextResponse.json({ events: enriched });
  } catch (error) {
    console.error('Events error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
