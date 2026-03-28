import { EventType } from './types';

const PIZZA_KEYWORDS = [
  'pizza', 'pizzeria', 'italian', 'slice', 'margherita', 'pepperoni',
  'cheese night', 'pie night', 'dough',
];

const SNACKS_KEYWORDS = [
  'snack', 'workshop', 'hackathon', 'coding', 'build', 'hacking',
  'marathon', 'sprint', 'energy', 'fuel', 'bite', 'nibble',
];

const SANDWICH_KEYWORDS = [
  'sandwich', 'fireside', 'speaker', 'talk', 'presentation',
  'lunch', 'breakfast', 'brunch', 'deli', 'toast', 'bagel',
  'panel', 'discussion', 'keynote', 'seminar',
];

function matchesKeywords(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

export function classifyEvent(name: string, description?: string): EventType {
  const combined = `${name} ${description || ''}`;

  // Check most specific first
  if (matchesKeywords(combined, PIZZA_KEYWORDS)) return 'pizza_event';
  if (matchesKeywords(combined, SANDWICH_KEYWORDS)) return 'sandwich_event';
  if (matchesKeywords(combined, SNACKS_KEYWORDS)) return 'snacks_event';

  // Default fallback: snacks (most flexible)
  return 'snacks_event';
}
