import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Circle, ShoppingBasket, Calendar, Users, Loader2 } from 'lucide-react';
import { OrderRecord, FoodItem, updateItemPurchased } from '../services/api';

interface OrderDetailProps {
  order: OrderRecord | null;
  onBack: () => void;
}

const eventTypeLabels: Record<string, string> = {
  pizza_event: 'Pizza Night',
  snacks_event: 'Workshop / Snacks',
  sandwich_event: 'Fireside Chat',
};

export default function OrderDetail({ order, onBack }: OrderDetailProps) {
  const [items, setItems] = useState<FoodItem[]>(order?.items || []);
  const [updating, setUpdating] = useState<string | null>(null);

  if (!order) {
    return (
      <div className="p-8 max-w-[1000px] mx-auto w-full flex items-center justify-center h-full">
        <p className="text-stone-500">No order selected</p>
      </div>
    );
  }

  const handleTogglePurchased = async (itemId: string, currentPurchased: boolean) => {
    if (!order.id || !itemId) return;
    
    setUpdating(itemId);
    try {
      await updateItemPurchased(order.id, itemId, !currentPurchased);
      setItems((prev) =>
        prev.map((item) =
          item.id === itemId ? { ...item, purchased: !currentPurchased } : item
        )
      );
    } catch (err) {
      console.error('Failed to update item:', err);
    } finally {
      setUpdating(null);
    }
  };

  const purchasedCount = items.filter((item) => item.purchased).length;
  const totalItems = items.length;
  const isComplete = purchasedCount === totalItems && totalItems > 0;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown date';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="p-8 max-w-[1000px] mx-auto w-full space-y-8 overflow-y-auto h-full no-scrollbar">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-stone-600 hover:text-primary hover:bg-stone-100 rounded-lg transition-all"
        >
          <ArrowLeft size={18} />
          Back to History
        </button>
      </div>

      {/* Order Info */}
      <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-stone-200/50 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight text-primary">{order.event_name}</h1>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary px-2 py-0.5 bg-secondary/30 rounded">
                {eventTypeLabels[order.event_type] || order.event_type}
              </span>
            </div>
            <p className="text-stone-500">{formatDate(order.created_at)}</p>
          </div>

          <div className="flex items-center gap-3">
            {isComplete ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full">
                <CheckCircle2 size={18} />
                <span className="font-bold text-sm">All Items Purchased</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-secondary/20 text-primary rounded-full">
                <ShoppingBasket size={18} />
                <span className="font-bold text-sm">{purchasedCount}/{totalItems} Purchased</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-stone-100">
          <div className="bg-surface-container-low p-4 rounded-xl text-center">
            <p className="text-2xl font-bold text-primary">{order.registered}</p>
            <p className="text-xs text-stone-500 uppercase tracking-wider">Registered</p>
          </div>
          <div className="bg-surface-container-low p-4 rounded-xl text-center">
            <p className="text-2xl font-bold text-primary">{order.adjusted_headcount}</p>
            <p className="text-xs text-stone-500 uppercase tracking-wider">Adjusted Headcount</p>
          </div>
          <div className="bg-surface-container-low p-4 rounded-xl text-center">
            <p className="text-2xl font-bold text-primary">{totalItems}</p>
            <p className="text-xs text-stone-500 uppercase tracking-wider">Items to Buy</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Purchase Progress</span>
            <span className="font-bold text-primary">{Math.round((purchasedCount / totalItems) * 100) || 0}%</span>
          </div>
          <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isComplete ? 'bg-green-500' : 'bg-primary'}`}
              style={{ width: `${totalItems > 0 ? (purchasedCount / totalItems) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Shopping List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-primary">Shopping List</h2>

        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-stone-200/50 overflow-hidden">
          {items.length === 0 ? (
            <div className="p-8 text-center text-stone-500">No items in this order</div>
          ) : (
            <div className="divide-y divide-stone-100">
              {items.map((item) => (
                <div
                  key={item.id || item.name}
                  className={`p-4 flex items-center gap-4 transition-all ${
                    item.purchased ? 'bg-green-50/50' : 'hover:bg-stone-50'
                  }`}
                >
                  <button
                    onClick={() => handleTogglePurchased(item.id || '', item.purchased || false)}
                    disabled={updating === item.id}
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      item.purchased
                        ? 'bg-green-500 text-white'
                        : 'border-2 border-stone-300 hover:border-primary'
                    }`}
                  >
                    {updating === item.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : item.purchased ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <Circle size={16} className="text-transparent" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-medium truncate ${
                        item.purchased ? 'text-stone-400 line-through' : 'text-primary'
                      }`}
                    >
                      {item.name}
                    </p>
                    {item.notes && (
                      <p className="text-sm text-stone-500 truncate">{item.notes}</p>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    <span
                      className={`text-sm font-bold ${
                        item.purchased ? 'text-stone-400' : 'text-primary'
                      }`}
                    >
                      {item.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Buy Button */}
      {!isComplete && (
        <div className="fixed bottom-8 right-8">
          <button
            onClick={() => {
              // Open S-kauppa or other shopping site
              window.open('https://www.s-kaupat.fi', '_blank');
            }}
            className="flex items-center gap-2 px-6 py-4 bg-primary text-white font-bold rounded-full shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
          >
            <ShoppingBasket size={20} />
            Buy on S-kauppa
          </button>
        </div>
      )}
    </div>
  );
}
