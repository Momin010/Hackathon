import { createClient } from '@supabase/supabase-js';
import { OrderRecord, FoodItem } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

function getClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured');
  }
  return createClient(supabaseUrl, supabaseKey);
}

export async function saveOrder(order: Omit<OrderRecord, 'id' | 'created_at'>): Promise<OrderRecord> {
  const supabase = getClient();

  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      event_id: order.event_id,
      event_name: order.event_name,
      event_type: order.event_type,
      registered: order.registered,
      adjusted_headcount: order.adjusted_headcount,
      total_estimate: order.total_estimate,
    })
    .select()
    .single();

  if (orderError) throw new Error(`Failed to save order: ${orderError.message}`);

  const orderItems = order.items.map((item: FoodItem) => ({
    order_id: orderData.id,
    ean: item.ean,
    name: item.item,
    slug: item.slug,
    qty: item.qty,
    unit_price: item.price,
    labels: item.labels,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

  if (itemsError) throw new Error(`Failed to save order items: ${itemsError.message}`);

  return { ...orderData, items: order.items };
}

export async function getHistory(limit = 50): Promise<OrderRecord[]> {
  const supabase = getClient();

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch history: ${error.message}`);
  if (!orders) return [];

  // Fetch items for each order
  const ordersWithItems = await Promise.all(
    orders.map(async (order) => {
      const { data: items } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);

      return {
        ...order,
        items: items || [],
      } as OrderRecord;
    })
  );

  return ordersWithItems;
}
