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
      dietary_breakdown: order.dietary_breakdown,
      reasoning: order.reasoning,
    })
    .select()
    .single();

  if (orderError) throw new Error(`Failed to save order: ${orderError.message}`);

  const orderItems = order.items.map((item: FoodItem) => ({
    order_id: orderData.id,
    name: item.name,
    quantity: item.quantity,
    notes: item.notes || null,
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

  const ordersWithItems = await Promise.all(
    orders.map(async (order) => {
      const { data: items } = await supabase
        .from('order_items')
        .select('id, name, quantity, notes, purchased, created_at')
        .eq('order_id', order.id);

      return {
        ...order,
        items: items || [],
      } as OrderRecord;
    })
  );

  return ordersWithItems;
}

export async function getOrder(orderId: string): Promise<OrderRecord> {
  const supabase = getClient();

  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error) throw new Error(`Failed to fetch order: ${error.message}`);
  if (!order) throw new Error('Order not found');

  const { data: items } = await supabase
    .from('order_items')
    .select('id, name, quantity, notes, purchased, created_at')
    .eq('order_id', orderId);

  return {
    ...order,
    items: items || [],
  } as OrderRecord;
}

export async function updateOrderItem(orderId: string, itemId: string, purchased: boolean): Promise<void> {
  const supabase = getClient();

  const { error } = await supabase
    .from('order_items')
    .update({ purchased })
    .eq('id', itemId)
    .eq('order_id', orderId);

  if (error) throw new Error(`Failed to update order item: ${error.message}`);
}
