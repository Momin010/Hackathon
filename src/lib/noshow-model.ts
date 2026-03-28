import { EventType } from './types';
import { fetchAllEvents, fetchAllGuests } from './luma-client';

// Default no-show rates based on spec (fallback when no historical data)
const DEFAULT_RATES: Record<EventType, number> = {
  pizza_event: 0.15,
  snacks_event: 0.20,
  sandwich_event: 0.12,
};

let cachedRates: Record<EventType, number> | null = null;

export async function computeNoShowRates(): Promise<Record<EventType, number>> {
  if (cachedRates) return cachedRates;

  try {
    const events = await fetchAllEvents();
    const rates: Record<EventType, number[]> = {
      pizza_event: [],
      snacks_event: [],
      sandwich_event: [],
    };

    for (const event of events) {
      try {
        const guests = await fetchAllGuests(event.id, 'approved');
        if (guests.length === 0) continue;

        const registered = guests.length;
        const checkedIn = guests.filter((g) => g.checked_in_at).length;
        const noShowRate = 1 - checkedIn / registered;

        // Classify the event to bucket the rate
        const eventType = classifyFromName(event.name);
        rates[eventType].push(noShowRate);
      } catch {
        // Skip events that fail to load guests
        continue;
      }
    }

    const computed: Record<EventType, number> = { ...DEFAULT_RATES };
    for (const eventType of Object.keys(rates) as EventType[]) {
      if (rates[eventType].length > 0) {
        const sum = rates[eventType].reduce((a, b) => a + b, 0);
        computed[eventType] = sum / rates[eventType].length;
      }
    }

    cachedRates = computed;
    return computed;
  } catch {
    // If Luma API is unavailable, use defaults
    return DEFAULT_RATES;
  }
}

function classifyFromName(name: string): EventType {
  const lower = name.toLowerCase();
  if (lower.includes('pizza')) return 'pizza_event';
  if (lower.includes('sandwich') || lower.includes('fireside') || lower.includes('speaker'))
    return 'sandwich_event';
  return 'snacks_event';
}

export function getAdjustedHeadcount(
  registered: number,
  eventType: EventType,
  rates: Record<EventType, number>
): number {
  return Math.round(registered * (1 - rates[eventType]));
}

export function clearRateCache(): void {
  cachedRates = null;
}
