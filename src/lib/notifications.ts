import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

function getClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured');
  }
  return createClient(supabaseUrl, supabaseKey);
}

export interface Notification {
  id: string;
  user_id?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'general' | 'event' | 'order' | 'system';
  read: boolean;
  data?: Record<string, unknown>;
  created_at: string;
}

export async function getNotifications(userId?: string, limit = 50): Promise<Notification[]> {
  const supabase = getClient();

  let query = supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (userId) {
    query = query.or(`user_id.eq.${userId},user_id.is.null`);
  } else {
    query = query.is('user_id', null);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch notifications: ${error.message}`);
  return data || [];
}

export async function getUnreadCount(userId?: string): Promise<number> {
  const supabase = getClient();

  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('read', false);

  if (userId) {
    query = query.or(`user_id.eq.${userId},user_id.is.null`);
  } else {
    query = query.is('user_id', null);
  }

  const { count, error } = await query;

  if (error) throw new Error(`Failed to get unread count: ${error.message}`);
  return count || 0;
}

export async function markAsRead(notificationId: string): Promise<void> {
  const supabase = getClient();

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) throw new Error(`Failed to mark notification as read: ${error.message}`);
}

export async function markAllAsRead(userId?: string): Promise<void> {
  const supabase = getClient();

  let query = supabase
    .from('notifications')
    .update({ read: true })
    .eq('read', false);

  if (userId) {
    query = query.or(`user_id.eq.${userId},user_id.is.null`);
  } else {
    query = query.is('user_id', null);
  }

  const { error } = await query;

  if (error) throw new Error(`Failed to mark all as read: ${error.message}`);
}

export async function createNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<Notification> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('notifications')
    .insert(notification)
    .select()
    .single();

  if (error) throw new Error(`Failed to create notification: ${error.message}`);
  return data;
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const supabase = getClient();

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) throw new Error(`Failed to delete notification: ${error.message}`);
}
