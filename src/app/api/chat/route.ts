import { NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';

const PROJECT_ID = process.env.GCP_PROJECT_ID || '';
const LOCATION = process.env.GCP_LOCATION || 'us-central1';
const MODEL_ID = 'gemini-2.5-pro';

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, history = [] } = body;

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const token = await getAccessToken();
    const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:generateContent`;

    // Build conversation history
    const contents = history.map((msg: { role: string; text: string }) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));

    // Add system prompt and current message
    const systemPrompt = `You are Planera AI, a helpful assistant for event planning in Finland.

Your role:
- Help users plan food for student entrepreneurship events at Aalto University
- Answer questions about dietary requirements, event types, and food planning
- Use Finnish dietary terms when relevant: "laktoositon" (lactose-free), "gluteeniton" (gluten-free), "vegaaninen" (vegan), "pähkinätön" (nut-free), "rasvaton" (low-fat)

Event types you handle:
- Pizza Night: Casual networking with pizzas
- Workshop/Snacks: Hands-on events with finger foods
- Fireside Chat: Speaker events with sandwiches

Be friendly, concise, and practical. If users ask about specific events, guide them to use the "Start Planning" button.`;

    const fullContents = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }],
      },
      {
        role: 'model',
        parts: [{ text: 'Understood! I am Planera AI, ready to help with event planning.' }],
      },
      ...contents,
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    const requestBody = {
      contents: fullContents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
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

    return NextResponse.json({
      response: text,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
