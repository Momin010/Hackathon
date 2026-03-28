const API_BASE = 'http://localhost:3001/api';

export interface ApiEvent {
  id: string;
  name: string;
  description?: string;
  start_at?: string;
  url?: string;
  event_type: string;
}

export interface DietaryBreakdown {
  vegan: number;
  lactoseFree: number;
  glutenFree: number;
  noRestrictions: number;
}

export interface FoodItem {
  name: string;
  quantity: number;
  notes?: string;
  purchased?: boolean;
  id?: string;
}

export interface RecommendResponse {
  event_id: string;
  event_name: string;
  event_type: string;
  registered: number;
  adjusted_headcount: number;
  no_show_rate: number;
  dietary_breakdown: DietaryBreakdown;
  items: FoodItem[];
  reasoning: string;
  order_id: string | null;
}

export interface OrderRecord {
  id: string;
  event_id: string;
  event_name?: string;
  event_type: string;
  registered: number;
  adjusted_headcount: number;
  dietary_breakdown: DietaryBreakdown;
  items: FoodItem[];
  reasoning?: string;
  created_at?: string;
}

export interface EventsResponse {
  events: ApiEvent[];
  error?: string;
}

export interface HistoryResponse {
  orders: OrderRecord[];
  error?: string;
}

export interface RecommendRequest {
  event_id: string;
}

export async function fetchEvents(): Promise<ApiEvent[]> {
  const res = await fetch(`${API_BASE}/events`);
  const data: EventsResponse = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch events');
  return data.events;
}

export async function fetchHistory(limit = 50): Promise<OrderRecord[]> {
  const res = await fetch(`${API_BASE}/history?limit=${limit}`);
  const data: HistoryResponse = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch history');
  return data.orders;
}

export async function postRecommend(eventId: string): Promise<RecommendResponse> {
  const res = await fetch(`${API_BASE}/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_id: eventId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to generate recommendation');
  return data;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface ChatResponse {
  response: string;
  timestamp: string;
}

export async function sendChatMessage(message: string, history: ChatMessage[] = []): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send message');
  return data;
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

export interface NotificationsResponse {
  notifications: Notification[];
  error?: string;
}

export interface UnreadCountResponse {
  count: number;
  error?: string;
}

export async function fetchNotifications(userId?: string, limit = 50): Promise<Notification[]> {
  const params = new URLSearchParams();
  if (userId) params.set('user_id', userId);
  if (limit) params.set('limit', limit.toString());
  
  const res = await fetch(`${API_BASE}/notifications?${params.toString()}`);
  const data: NotificationsResponse = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch notifications');
  return data.notifications;
}

export async function fetchUnreadCount(userId?: string): Promise<number> {
  const params = new URLSearchParams();
  if (userId) params.set('user_id', userId);
  params.set('unread_only', 'true');
  
  const res = await fetch(`${API_BASE}/notifications?${params.toString()}`);
  const data: UnreadCountResponse = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch unread count');
  return data.count;
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/notifications?id=${notificationId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to mark as read');
}

export async function markAllNotificationsAsRead(userId?: string): Promise<void> {
  const res = await fetch(`${API_BASE}/notifications`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mark_all_read: true, user_id: userId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to mark all as read');
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/notifications?id=${notificationId}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete notification');
}

// Order/History API functions
export async function fetchOrder(orderId: string): Promise<OrderRecord> {
  const res = await fetch(`${API_BASE}/orders/${orderId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch order');
  return data;
}

export async function updateItemPurchased(orderId: string, itemId: string, purchased: boolean): Promise<void> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/items/${itemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ purchased }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update item');
}
