import { GoogleAuth } from 'google-auth-library';
import {
  EventType,
  DietaryBreakdown,
  GuestDietaryInfo,
  ShoppingListRecommendation,
  ShoppingListItem,
} from './types';

const PROJECT_ID = process.env.GCP_PROJECT_ID || '';
const LOCATION = process.env.GCP_LOCATION || 'us-central1';
const MODEL_ID = 'gemini-2.5-pro';

// Helper function to extract and clean JSON from AI response
function extractJsonFromResponse(text: string): string {
  // Remove markdown code blocks
  let cleaned = text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
  
  // Find JSON object boundaries - look for the outermost { and }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  // Remove any trailing commas before closing braces/brackets
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
  
  // Remove any control characters that might break JSON parsing
  cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  
  return cleaned;
}

// Parse dietary restrictions from guest input
export function parseDietaryRestrictions(input: string): GuestDietaryInfo {
  const lower = input.toLowerCase();
  const restrictions: GuestDietaryInfo = {
    hasLactoseIntolerance: false,
    hasGlutenAllergy: false,
    hasNutAllergy: false,
    isVegan: false,
    isVegetarian: false,
    otherRestrictions: [],
    rawInput: input,
  };

  // Lactose intolerance
  if (
    lower.includes('lactose') ||
    lower.includes('laktoosi') ||
    lower.includes('laktoositon') ||
    lower.includes('maitoallergia') ||
    lower.includes('dairy-free') ||
    lower.includes('milk-free')
  ) {
    restrictions.hasLactoseIntolerance = true;
  }

  // Gluten allergy/intolerance
  if (
    lower.includes('gluten') ||
    lower.includes('gluteeniton') ||
    lower.includes('celiac') ||
    lower.includes('keliakia') ||
    lower.includes('gluten-free')
  ) {
    restrictions.hasGlutenAllergy = true;
  }

  // Nut allergies
  if (
    lower.includes('nut') ||
    lower.includes('pähkinä') ||
    lower.includes('maapähkinä') ||
    lower.includes('cashew') ||
    lower.includes('almond') ||
    lower.includes('hasselpähkinä') ||
    lower.includes('peanut') ||
    lower.includes('tree nut')
  ) {
    restrictions.hasNutAllergy = true;
  }

  // Vegan
  if (
    lower.includes('vegan') ||
    lower.includes('vegaaninen') ||
    lower.includes('plant-based')
  ) {
    restrictions.isVegan = true;
  }

  // Vegetarian
  if (
    lower.includes('vegetarian') ||
    lower.includes('kasvissyöjä') ||
    lower.includes('ei lihaa') ||
    lower.includes('no meat')
  ) {
    restrictions.isVegetarian = true;
  }

  // Extract other restrictions
  const knownTerms = [
    'lactose',
    'laktoosi',
    'gluten',
    'gluteeniton',
    'nut',
    'pähkinä',
    'vegan',
    'vegaaninen',
    'vegetarian',
    'kasvissyöjä',
    'none',
    'ei mitään',
    'no restrictions',
  ];

  // Split by common separators and check for unknown terms
  const parts = input.split(/[,;]/).map((p) => p.trim().toLowerCase());
  for (const part of parts) {
    if (part && !knownTerms.some((term) => part.includes(term))) {
      restrictions.otherRestrictions.push(part);
    }
  }

  return restrictions;
}

// Build dietary requirements array for display
export function buildDietaryRequirements(info: GuestDietaryInfo): string[] {
  const requirements: string[] = [];

  if (info.isVegan) {
    requirements.push('vegaaninen');
  }
  if (info.hasLactoseIntolerance) {
    requirements.push('laktoositon');
  }
  if (info.hasGlutenAllergy) {
    requirements.push('gluteeniton');
  }
  if (info.hasNutAllergy) {
    requirements.push('pähkinätön');
  }
  if (info.isVegetarian && !info.isVegan) {
    requirements.push('kasvissyöjä');
  }

  return requirements;
}

function buildShoppingListPrompt(
  eventType: EventType,
  adjustedHeadcount: number,
  dietary: DietaryBreakdown,
  guestDiets: GuestDietaryInfo[]
): string {
  const typeDescriptions: Record<EventType, string> = {
    pizza_event: `Pizza Night — exclusive table chat with pizzas from local restaurants.
Recommended items: pizzas (2.5 slices per guest, 8 slices per pizza), soft drinks (1.2 per guest), napkins.
For vegan guests: suggest a separate vegan pizza option.
For lactose-free guests: suggest lactose-free cheese pizza.`,
    snacks_event: `Workshop / Hackathon — hands-on coding/building event with snacks and drinks.
Recommended items: salty chips/snacks (1 bag per 4 guests), soft drinks (1.5 per guest), fruit or energy bars (1 per guest), water bottles.
For gluten-free guests: suggest GF snack alternatives.
For vegan guests: suggest vegan snack/energy bar options.`,
    sandwich_event: `Fireside Chat / Speaker Event — casual sandwich bar setup.
Recommended items: bread/rolls (1 per 2 guests), deli meats like ham or turkey (100g per guest), cheese slices (60g per guest), butter (1 per 10 guests), lettuce/tomato, soft drinks (1.5 per guest).
For lactose-free guests: suggest lactose-free butter and cheese.
For vegan guests: suggest hummus, avocado, or vegan spread as protein replacement.`,
  };

  // Calculate how many need each restriction
  const needsLactoseFree = guestDiets.filter((g) => g.hasLactoseIntolerance).length;
  const needsGlutenFree = guestDiets.filter((g) => g.hasGlutenAllergy).length;
  const needsNutFree = guestDiets.filter((g) => g.hasNutAllergy).length;
  const needsVegan = guestDiets.filter((g) => g.isVegan).length;

  return `You are a food planning assistant for student entrepreneurship events at Aalto University in Finland.
Your task is to create a shopping list with VAGUE but DIETARY-AWARE descriptions.

EVENT TYPE: ${eventType} — ${typeDescriptions[eventType]}

ATTENDANCE: ${adjustedHeadcount} guests expected (no-show adjusted from ${Math.round(adjustedHeadcount / (1 - 0.15))} registered)

DIETARY REQUIREMENTS SUMMARY:
- Total attendees: ${adjustedHeadcount}
- Need lactose-free (laktoositon): ${needsLactoseFree}
- Need gluten-free (gluteeniton): ${needsGlutenFree}
- Need nut-free (pähkinätön): ${needsNutFree}
- Vegan (vegaaninen): ${needsVegan}
- No restrictions: ${dietary.noRestrictions}

CRITICAL INSTRUCTIONS:
1. Create a shopping list with VAGUE descriptions (e.g., "Kaurapuuro" not "Fazer Kaurapuuro 500g")
2. For EACH item, specify dietary requirements using Finnish terms:
   - "laktoositon" for lactose-free
   - "gluteeniton" for gluten-free
   - "pähkinätön" for nut-free
   - "vegaaninen" for vegan
   - "rasvaton" for low-fat when relevant
3. Group items by who they're for (e.g., "Kaikille", "Vegaaneille", "Gluteenittomana")
4. Include quantities in practical terms (portions, kg, liters, packages)
5. If someone has severe allergies, add safety notes about cross-contamination
6. Be practical — this is a student event

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "items": [
    {
      "itemName": "Product category in Finnish (e.g., 'Kaurapuuro', 'Riisi', 'Kasvispiirakka')",
      "quantity": "Amount in practical terms (e.g., '4 annosta', '2 kg', '1.5 litraa')",
      "dietaryRequirements": ["array of Finnish dietary terms, e.g., ['laktoositon', 'vegaaninen']"],
      "targetGroup": "Who this is for (e.g., 'Kaikki osallistujat', 'Vegaanit', 'Gluteenittomana')",
      "notes": "Optional safety note or additional context"
    }
  ],
  "summary": "Brief summary of the shopping list and key dietary considerations",
  "dietarySummary": {
    "totalAttendees": number,
    "lactoseFreeNeeded": number,
    "glutenFreeNeeded": number,
    "nutFreeNeeded": number,
    "veganNeeded": number
  }
}`;
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedAccessToken && Date.now() < cachedAccessToken.expiresAt) {
    return cachedAccessToken.token;
  }

  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();

  if (!tokenResponse.token) {
    throw new Error('Failed to get GCP access token. Ensure GOOGLE_APPLICATION_CREDENTIALS is set.');
  }

  cachedAccessToken = {
    token: tokenResponse.token,
    expiresAt: Date.now() + 3500 * 1000,
  };

  return cachedAccessToken.token;
}

// Legacy function - kept for compatibility
export async function generateFoodRecommendation(
  eventType: EventType,
  adjustedHeadcount: number,
  dietary: DietaryBreakdown
) {
  const prompt = buildShoppingListPrompt(eventType, adjustedHeadcount, dietary, []);
  const token = await getAccessToken();

  const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:generateContent`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Vertex AI error: ${res.status} — ${errorText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response from Gemini');
  }

  const jsonStr = extractJsonFromResponse(text);
  
  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    console.error('Raw text from AI:', text);
    console.error('Cleaned JSON string:', jsonStr);
    throw new Error(`Failed to parse AI response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
  }

  return {
    items: parsed.items.map((item: { name: string; quantity: number; notes?: string }) => ({
      name: item.name,
      quantity: item.quantity,
      notes: item.notes || undefined,
    })),
    reasoning: parsed.reasoning,
  };
}

// New function: Generate dietary-aware shopping list
export async function generateShoppingListRecommendation(
  eventType: EventType,
  adjustedHeadcount: number,
  dietary: DietaryBreakdown,
  guestDiets: GuestDietaryInfo[]
): Promise<ShoppingListRecommendation> {
  const prompt = buildShoppingListPrompt(eventType, adjustedHeadcount, dietary, guestDiets);
  const token = await getAccessToken();

  const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:generateContent`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Vertex AI error: ${res.status} — ${errorText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response from Gemini');
  }

  const jsonStr = extractJsonFromResponse(text);
  
  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    console.error('Raw text from AI:', text);
    console.error('Cleaned JSON string:', jsonStr);
    throw new Error(`Failed to parse AI response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
  }

  // Calculate dietary summary from guest data
  const dietarySummary = {
    totalAttendees: adjustedHeadcount,
    lactoseFreeNeeded: guestDiets.filter((g) => g.hasLactoseIntolerance).length,
    glutenFreeNeeded: guestDiets.filter((g) => g.hasGlutenAllergy).length,
    nutFreeNeeded: guestDiets.filter((g) => g.hasNutAllergy).length,
    veganNeeded: guestDiets.filter((g) => g.isVegan).length,
  };

  return {
    items: parsed.items.map((item: ShoppingListItem) => ({
      itemName: item.itemName,
      quantity: item.quantity,
      dietaryRequirements: item.dietaryRequirements || [],
      targetGroup: item.targetGroup,
      notes: item.notes,
    })),
    summary: parsed.summary,
    dietarySummary,
  };
}
