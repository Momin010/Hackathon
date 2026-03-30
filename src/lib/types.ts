export type EventType = 'pizza_event' | 'snacks_event' | 'sandwich_event';

export interface DietaryBreakdown {
  vegan: number;
  lactoseFree: number;
  glutenFree: number;
  nutAllergy: number;
  noRestrictions: number;
}

// Detailed dietary info for a guest
export interface GuestDietaryInfo {
  hasLactoseIntolerance: boolean;
  hasGlutenAllergy: boolean;
  hasNutAllergy: boolean;
  isVegan: boolean;
  isVegetarian: boolean;
  otherRestrictions: string[];
  rawInput: string;
}

// Shopping list item with dietary requirements
export interface ShoppingListItem {
  itemName: string;           // e.g., "Kaurapuuro" (Oatmeal)
  quantity: string;           // e.g., "4 annosta" (4 portions)
  dietaryRequirements: string[]; // e.g., ["laktoositon", "vegaaninen"]
  targetGroup: string;        // e.g., "Kaikki osallistujat" or "Vegaanit"
  notes?: string;             // Additional context
}

// Legacy types (kept for compatibility)
export interface FoodItem {
  id?: string;
  name: string;
  quantity: number;
  notes?: string;
  purchased?: boolean;
}

export interface GeminiFoodItem {
  name: string;
  quantity: number;
  notes?: string;
}

export interface GeminiRecommendation {
  items: GeminiFoodItem[];
  reasoning: string;
}

// New shopping list response
export interface ShoppingListRecommendation {
  items: ShoppingListItem[];
  summary: string;
  dietarySummary: {
    totalAttendees: number;
    lactoseFreeNeeded: number;
    glutenFreeNeeded: number;
    nutFreeNeeded: number;
    veganNeeded: number;
  };
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
  reasoning?: string;
  created_at?: string;
}
