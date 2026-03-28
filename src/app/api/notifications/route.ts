import { NextResponse } from 'next/server';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, createNotification, deleteNotification } from '@/lib/notifications';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const unreadOnly = searchParams.get('unread_only') === 'true';

    if (unreadOnly) {
      const count = await getUnreadCount(userId);
      return NextResponse.json({ count }, { headers: corsHeaders });
    }

    const notifications = await getNotifications(userId, limit);
    return NextResponse.json({ notifications }, { headers: corsHeaders });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, message, type = 'info', category = 'general', user_id, data } = body;

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400, headers: corsHeaders });
    }

    const notification = await createNotification({
      title,
      message,
      type,
      category,
      user_id,
      data,
      read: false,
    });

    return NextResponse.json({ notification }, { headers: corsHeaders });
  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    const body = await request.json();
    const { mark_all_read, user_id } = body;

    if (mark_all_read) {
      await markAllAsRead(user_id);
      return NextResponse.json({ success: true }, { headers: corsHeaders });
    }

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400, headers: corsHeaders });
    }

    await markAsRead(notificationId);
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error('Update notification error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400, headers: corsHeaders });
    }

    await deleteNotification(notificationId);
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
