import { NextResponse } from 'next/server';
import { fetchEvent, fetchAllGuests, extractDietaryRestrictions } from '@/lib/luma-client';
import { classifyEvent } from '@/lib/classifier';
import { computeNoShowRates, getAdjustedHeadcount } from '@/lib/noshow-model';
import { generateFoodRecommendation } from '@/lib/food-engine';
import { resolveProduct } from '@/lib/skaupat-client';
import { saveOrder } from '@/lib/supabase-client';
import { FoodItem, DietaryBreakdown, DietaryLabel, GeminiFoodItem } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { event_id } = body;

    if (!event_id) {
      return NextResponse.json({ error: 'event_id is required' }, { status: 400 });
    }

    // Step 1: Fetch event details
    const event = await fetchEvent(event_id);

    // Step 2: Fetch approved guests
    const guests = await fetchAllGuests(event_id, 'approved');
    const registered = guests.length;

    // Step 3: Classify event
    const eventType = classifyEvent(event.name, event.description);

    // Step 4: Compute dietary breakdown
    const dietary: DietaryBreakdown = {
      vegan: 0,
      lactoseFree: 0,
      glutenFree: 0,
      noRestrictions: 0,
    };

    for (const guest of guests) {
      const restrictions = extractDietaryRestrictions(guest).toLowerCase();
      if (restrictions.includes('vegan') || restrictions.includes('vegaaninen')) {
        dietary.vegan++;
      } else if (restrictions.includes('lactose') || restrictions.includes('laktoositon')) {
        dietary.lactoseFree++;
      } else if (restrictions.includes('gluten') || restrictions.includes('gluteeniton')) {
        dietary.glutenFree++;
      } else {
        dietary.noRestrictions++;
      }
    }

    // Step 5: No-show adjustment
    const rates = await computeNoShowRates();
    const adjustedHeadcount = getAdjustedHeadcount(registered, eventType, rates);

    // Step 6: Generate food recommendation via Gemini
    const recommendation = await generateFoodRecommendation(
      eventType,
      adjustedHeadcount,
      dietary
    );

    // Step 7: Resolve each item via S-kaupat
    const resolvedItems: FoodItem[] = [];
    const flaggedItems: FoodItem[] = [];

    for (const item of recommendation.items) {
      const product = await resolveProduct(item.searchQuery, item.dietaryVariant);

      if (product) {
        resolvedItems.push({
          item: item.item,
          qty: item.qty,
          ean: product.ean,
          slug: product.slug,
          price: product.price,
          labels: product.labels as DietaryLabel[],
          totalCost: product.price * item.qty,
        });
      } else {
        flaggedItems.push({
          item: item.item,
          qty: item.qty,
          ean: '',
          slug: '',
          price: 0,
          labels: [],
          totalCost: 0,
          flagged: true,
          flagReason: `Could not find in S-kaupat. Try searching manually for: ${item.searchQuery}`,
        });
      }
    }

    const allItems = [...resolvedItems, ...flaggedItems];
    const totalEstimate = resolvedItems.reduce((sum, item) => sum + item.totalCost, 0);

    // Step 8: Save to Supabase
    let savedOrder;
    try {
      savedOrder = await saveOrder({
        event_id: event.id,
        event_name: event.name,
        event_type: eventType,
        registered,
        adjusted_headcount: adjustedHeadcount,
        dietary_breakdown: dietary,
        items: allItems,
        total_estimate: totalEstimate,
      });
    } catch (saveError) {
      // Don't fail the whole request if save fails — return the recommendation anyway
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
      items: allItems,
      total_estimate: totalEstimate,
      reasoning: recommendation.reasoning,
      order_id: savedOrder?.id || null,
    });
  } catch (error) {
    console.error('Recommend error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
