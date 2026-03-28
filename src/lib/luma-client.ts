import { LumaEvent, LumaGuest } from './luma-types';
import { parseDietaryRestrictions } from './food-engine';
import { GuestDietaryInfo } from './types';

const BASE_URL = process.env.LUMA_BASE_URL || 'https://luma-mock-server.vercel.app';
const API_KEY = process.env.LUMA_API_KEY || 'demo-key';

async function lumaFetch<T>(path: string): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      'x-luma-api-key': API_KEY,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Luma API error: ${res.status} ${res.statusText} — ${url}`);
  }

  return res.json();
}

export async function fetchAllEvents(): Promise<LumaEvent[]> {
  const allEvents: LumaEvent[] = [];
  let cursor: string | undefined;
  let hasMore = true;
  const seenCursors = new Set<string>();

  while (hasMore) {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);

    const data = await lumaFetch<{
      entries: Array<{ api_id: string; event: LumaEvent }>;
      has_more: boolean;
      next_cursor?: string;
    }>(`/api/v1/calendar/list-events?${params.toString()}`);

    for (const entry of data.entries || []) {
      allEvents.push(entry.event);
    }

    if (!data.has_more || !data.next_cursor) {
      break;
    }

    if (seenCursors.has(data.next_cursor) || data.next_cursor === cursor) {
      break;
    }

    seenCursors.add(data.next_cursor);
    cursor = data.next_cursor;
    hasMore = true;
  }

  return allEvents;
}

export async function fetchEvent(eventId: string): Promise<LumaEvent> {
  const data = await lumaFetch<{ event: LumaEvent }>(
    `/api/v1/event/get?id=${eventId}`
  );
  return data.event;
}

export async function fetchAllGuests(
  eventId: string,
  approvalStatus?: string
): Promise<LumaGuest[]> {
  const allGuests: LumaGuest[] = [];
  let cursor: string | undefined;
  let hasMore = true;
  const seenCursors = new Set<string>();

  while (hasMore) {
    const params = new URLSearchParams({ event_id: eventId });
    if (approvalStatus) params.set('approval_status', approvalStatus);
    if (cursor) params.set('cursor', cursor);

    const data = await lumaFetch<{
      entries: Array<{ api_id: string; guest: LumaGuest }>;
      has_more: boolean;
      next_cursor?: string;
    }>(`/api/v1/event/get-guests?${params.toString()}`);

    for (const entry of data.entries || []) {
      let guest = entry.guest;

      // Filter by approval status client-side if API doesn't support the param
      if (approvalStatus && guest.approval_status !== approvalStatus) {
        continue;
      }

      allGuests.push(guest);
    }

    if (!data.has_more || !data.next_cursor) {
      break;
    }

    if (seenCursors.has(data.next_cursor) || data.next_cursor === cursor) {
      break;
    }

    seenCursors.add(data.next_cursor);
    cursor = data.next_cursor;
    hasMore = true;
  }

  return allGuests;
}

// Legacy function - kept for compatibility
export function extractDietaryRestrictions(guest: LumaGuest): string {
  if (!guest.registration_answers) return '';

  const dietAnswer = guest.registration_answers.find(
    (a) =>
      a.label?.toLowerCase().includes('dietary') ||
      a.label?.toLowerCase().includes('diet') ||
      a.label?.toLowerCase().includes('food')
  );

  if (!dietAnswer) return '';

  const value = dietAnswer.answer || dietAnswer.value;
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.join(', ');
  return '';
}

// New function: Extract parsed dietary info for all guests
export function extractAllDietaryInfo(guests: LumaGuest[]): GuestDietaryInfo[] {
  return guests.map((guest) => {
    const rawRestrictions = extractDietaryRestrictions(guest);
    return parseDietaryRestrictions(rawRestrictions);
  });
}
