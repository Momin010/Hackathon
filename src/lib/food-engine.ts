import { GoogleAuth } from 'google-auth-library';
import { EventType, DietaryBreakdown, GeminiRecommendation, GeminiFoodItem } from './types';

const PROJECT_ID = process.env.GCP_PROJECT_ID || '';
const LOCATION = process.env.GCP_LOCATION || 'us-central1';
const MODEL_ID = 'gemini-2.5-pro';

function buildPrompt(
  eventType: EventType,
  adjustedHeadcount: number,
  dietary: DietaryBreakdown
): string {
  const typeDescriptions: Record<EventType, string> = {
    pizza_event: `Pizza Night. Rules:
- Pizza: 2.5 slices per guest, 8 slices per pizza → calculate pizzas
- Soft drinks: 1.2 per guest → round up packs of 6
- Napkins: 3 per guest
- If vegan guests: +15% extra vegan pizza
- If lactose-free guests: ensure lactose-free cheese option`,
    snacks_event: `Workshop / Hackathon. Rules:
- Salty snacks: 1 bag per 4 guests
- Soft drinks: 1.5 per guest → round up packs of 6
- Fruit / energy bars: 1 per guest
- If gluten-free guests: +1 GF snack pack per 5 GF guests`,
    sandwich_event: `Fireside / Speaker event. Rules:
- Bread: 1 loaf per 8 guests
- Ham/turkey: 100g per guest → divide by pack size
- Cheese (sliced): 60g per guest → divide by pack size
- Butter: 10g per guest → divide by 500g pack
- If lactose-free guests: +1 lactose-free butter per 10 LF guests`,
  };

  return `You are a food ordering assistant for event catering in Finland. Products are from S-kaupat (Finnish grocery store).

EVENT TYPE: ${eventType} — ${typeDescriptions[eventType]}

ATTENDANCE: ${adjustedHeadcount} guests (no-show adjusted)
DIETARY BREAKDOWN:
- Vegan: ${dietary.vegan}
- Lactose-free: ${dietary.lactoseFree}
- Gluten-free: ${dietary.glutenFree}
- No restrictions: ${dietary.noRestrictions}

INSTRUCTIONS:
1. Calculate exact quantities needed based on the rules above
2. For each item, provide a good search query for S-kaupat's product search
3. Use Finnish product names where appropriate (e.g., "juusto" for cheese, "makkara" for sausage)
4. Mark dietary variants clearly
5. Be specific with search queries — include brand names if relevant (Valio, Saarioinen, etc.)

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "items": [
    {
      "item": "Human-readable item name",
      "searchQuery": "search term for S-kaupat",
      "qty": number,
      "dietaryVariant": "VEGAN" | "LACTOSE_FREE" | "GLUTEN_FREE" | null
    }
  ],
  "reasoning": "Brief explanation of choices"
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
    expiresAt: Date.now() + 3500 * 1000, // ~58 min
  };

  return tokenResponse.token;
}

export async function generateFoodRecommendation(
  eventType: EventType,
  adjustedHeadcount: number,
  dietary: DietaryBreakdown
): Promise<GeminiRecommendation> {
  const prompt = buildPrompt(eventType, adjustedHeadcount, dietary);
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
      maxOutputTokens: 4096,
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

  // Parse JSON from response (handle potential markdown wrapping)
  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(jsonStr);

  return {
    items: parsed.items.map((item: GeminiFoodItem) => ({
      item: item.item,
      searchQuery: item.searchQuery,
      qty: item.qty,
      dietaryVariant: item.dietaryVariant || undefined,
    })),
    reasoning: parsed.reasoning,
  };
}
