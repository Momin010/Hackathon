import { NextResponse } from 'next/server';
import { fetchEvent, fetchAllGuests, extractAllDietaryInfo } from '@/lib/luma-client';
import { classifyEvent } from '@/lib/classifier';
import { computeNoShowRates, getAdjustedHeadcount } from '@/lib/noshow-model';
import { generateShoppingListRecommendation } from '@/lib/food-engine';
import { GuestDietaryInfo } from '@/lib/types';
import { saveOrder } from '@/lib/supabase-client';
import { createNotification } from '@/lib/notifications';
import { DietaryBreakdown } from '@/lib/types';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { event_id } = body;

    if (!event_id) {
      return NextResponse.json({ error: 'event_id is required' }, { status: 400, headers: corsHeaders });
    }

    const event = await fetchEvent(event_id);
    const guests = await fetchAllGuests(event_id, 'approved');
    const registered = guests.length;

    const eventType = classifyEvent(event.name, event.description);

    // Extract detailed dietary info from all guests
    const guestDiets: GuestDietaryInfo[] = extractAllDietaryInfo(guests);

    // Calculate dietary breakdown
    const dietary: DietaryBreakdown = {
      vegan: guestDiets.filter((g) => g.isVegan).length,
      lactoseFree: guestDiets.filter((g) => g.hasLactoseIntolerance).length,
      glutenFree: guestDiets.filter((g) => g.hasGlutenAllergy).length,
      nutAllergy: guestDiets.filter((g) => g.hasNutAllergy).length,
      noRestrictions: guestDiets.filter(
        (g) =>
          !g.isVegan &&
          !g.hasLactoseIntolerance &&
          !g.hasGlutenAllergy &&
          !g.hasNutAllergy &&
          g.otherRestrictions.length === 0
      ).length,
    };

    const rates = await computeNoShowRates();
    const adjustedHeadcount = getAdjustedHeadcount(registered, eventType, rates);

    // Generate the new dietary-aware shopping list
    const recommendation = await generateShoppingListRecommendation(
      eventType,
      adjustedHeadcount,
      dietary,
      guestDiets
    );

    let savedOrder;
    try {
      savedOrder = await saveOrder({
        event_id: event.id,
        event_name: event.name,
        event_type: eventType,
        registered,
        adjusted_headcount: adjustedHeadcount,
        dietary_breakdown: dietary,
        items: recommendation.items.map((item) => ({
          name: item.itemName,
          quantity: parseFloat(item.quantity) || 1,
          notes: `${item.targetGroup}. ${item.dietaryRequirements.join(', ')}${item.notes ? '. ' + item.notes : ''}`,
        })),
        reasoning: recommendation.summary,
      });
    } catch (saveError) {
      console.error('Failed to save order:', saveError);
    }

    return NextResponse.json({
      event_id: event.id,
      event_name: event.name,
      event_type: eventType,
      registered,
      adjusted_headcount: adjustedHeadcount,
      no_show_rate: rates[eventType],
      dietary_breakdown: dietary,
      items: recommendation.items.map((item) => ({
        name: item.itemName,
        quantity: parseFloat(item.quantity) || 1,
        notes: `${item.targetGroup}. ${item.dietaryRequirements.join(', ')}${item.notes ? '. ' + item.notes : ''}`,
      })),
      reasoning: recommendation.summary,
      order_id: savedOrder?.id || null,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Recommend error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
