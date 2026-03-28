import React, { useEffect, useState } from 'react';
import { ShoppingBasket, Calendar, Users, CheckCircle2, Circle, Loader2, ArrowRight } from 'lucide-react';
import { fetchHistory, OrderRecord, FoodItem } from '../services/api';

interface HistoryProps {
  onViewOrder: (order: OrderRecord) => void;
}

const eventTypeLabels: Record<string, string> = {
  pizza_event: 'Pizza Night',
  snacks_event: 'Workshop / Snacks',
  sandwich_event: 'Fireside Chat',
};

export default function History({ onViewOrder }: HistoryProps) {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await fetchHistory();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown date';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getPurchasedCount = (items: FoodItem[]) => {
    return items.filter((item) => item.purchased).length;
  };

  if (loading) {
    return (
      <div className="p-8 max-w-[1200px] mx-auto w-full flex items-center justify-center h-full">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-[1200px] mx-auto w-full">
        <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200">
          <p className="font-bold">Error loading history</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1200px] mx-auto w-full space-y-8 overflow-y-auto h-full no-scrollbar">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-primary mb-2">Order History</h1>
        <p className="text-stone-500 text-sm">View and manage your planned events and shopping lists.</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-surface-container-lowest p-12 rounded-3xl shadow-sm border border-stone-200/50 text-center">
          <ShoppingBasket size={48} className="text-stone-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-primary mb-2">No Orders Yet</h2>
          <p className="text-stone-500 text-sm">Go to the Events page and plan your first event to see it here.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => {
            const purchasedCount = getPurchasedCount(order.items);
            const totalItems = order.items.length;
            const isComplete = purchasedCount === totalItems && totalItems > 0;

            return (
              <div
                key={order.id}
                className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-stone-200/50 hover:border-primary/30 transition-all cursor-pointer group"
                onClick={() => onViewOrder(order)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-primary group-hover:text-primary transition-colors">
                        {order.event_name}
                      </h3>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary px-2 py-0.5 bg-secondary/30 rounded">
                        {eventTypeLabels[order.event_type] || order.event_type}
                      </span>
                      {isComplete && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-green-700 px-2 py-0.5 bg-green-100 rounded flex items-center gap-1">
                          <CheckCircle2 size={10} />
                          Complete
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-6 text-sm text-stone-500">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <span>{formatDate(order.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={14} />
                        <span>{order.adjusted_headcount} guests (adjusted)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShoppingBasket size={14} />
                        <span>
                          {purchasedCount}/{totalItems} items purchased
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isComplete ? (
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                        <CheckCircle2 size={20} />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-primary">
                        <Circle size={20} />
                      </div>
                    )}
                    <ArrowRight size={18} className="text-stone-400 group-hover:text-primary transition-colors" />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isComplete ? 'bg-green-500' : 'bg-primary'
                      }`}
                      style={{ width: `${totalItems > 0 ? (purchasedCount / totalItems) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
