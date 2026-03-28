export type EventType = 'pizza_event' | 'snacks_event' | 'sandwich_event';

export type DietaryLabel = 'VEGAN' | 'LACTOSE_FREE' | 'GLUTEN_FREE';

export interface DietaryBreakdown {
  vegan: number;
  lactoseFree: number;
  glutenFree: number;
  noRestrictions: number;
}

export interface FoodItem {
  item: string;
  qty: number;
  ean: string;
  slug: string;
  price: number;
  labels: DietaryLabel[];
  totalCost: number;
  flagged?: boolean;
  flagReason?: string;
}

export interface OrderRecord {
  id?: string;
  event_id: string;
  event_name?: string;
  event_type: EventType;
  registered: number;
  adjusted_headcount: number;
  dietary_breakdown: DietaryBreakdown;
  items: FoodItem[];
  total_estimate: number;
  created_at?: string;
}

export interface SkaupatProduct {
  ean: string;
  name: string;
  slug: string;
  price: number;
  labels: string[];
  brandName: string;
}

export interface GeminiFoodItem {
  item: string;
  searchQuery: string;
  qty: number;
  dietaryVariant?: DietaryLabel;
}

export interface GeminiRecommendation {
  items: GeminiFoodItem[];
  reasoning: string;
}
