import React, { useState } from 'react';
import { Calendar, Loader2, CheckCircle2, ArrowLeft, ShoppingBasket } from 'lucide-react';
import { postRecommend, ApiEvent, RecommendResponse } from '../services/api';

interface PlanningProps {
  event: ApiEvent | null;
  onRecommendation: (rec: RecommendResponse) => void;
}

const eventTypeLabels: Record<string, string> = {
  pizza_event: 'Pizza Night',
  snacks_event: 'Workshop / Snacks',
  sandwich_event: 'Fireside Chat',
};

export default function Planning({ event, onRecommendation }: PlanningProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendResponse | null>(null);

  const handleGenerate = async () => {
    if (!event) return;
    setLoading(true);
    setError(null);

    try {
      const result = await postRecommend(event.id);
      setRecommendation(result);
      onRecommendation(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate order');
    } finally {
      setLoading(false);
    }
  };

  if (!event) {
    return (
      <div className="p-8 max-w-[1000px] mx-auto w-full space-y-8 overflow-y-auto h-full no-scrollbar">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-primary mb-2">Plan Event</h1>
          <p className="text-stone-500 text-sm">Select an event from the Events page to start planning.</p>
        </div>
        <div className="bg-surface-container-lowest p-12 rounded-3xl shadow-sm border border-stone-200/50 text-center">
          <Calendar size={48} className="text-stone-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-primary mb-2">No Event Selected</h2>
          <p className="text-stone-500 text-sm">Go to the Events page and click "Plan Food" on an event.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1000px] mx-auto w-full space-y-8 overflow-y-auto h-full no-scrollbar">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-primary mb-2">Plan Event</h1>
        <p className="text-stone-500 text-sm">Generate a food order using Vertex AI for this event.</p>
      </div>

      <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-stone-200/50 space-y-8">
        <div className="flex items-center gap-4 border-b border-stone-100 pb-6">
          <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center text-primary">
            <Calendar size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary">{event.name}</h2>
            <p className="text-sm text-stone-500">
              {event.start_at ? new Date(event.start_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Date TBD'}
              {event.description && ` — ${event.description}`}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary px-2 py-0.5 bg-secondary/30 rounded">
              {eventTypeLabels[event.event_type] || event.event_type}
            </span>
          </div>
          <p className="text-sm text-stone-500">
            Click "Generate Order" to send this event to the backend, which will use Vertex AI (Gemini 2.5 Pro) to generate a complete food order based on the event type, expected attendance, and dietary requirements from Luma RSVPs.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
            <p className="font-bold text-sm">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {recommendation && (
          <div className="space-y-6 pt-4 border-t border-stone-100">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 size={20} />
              <span className="font-bold text-sm">Order Generated via Vertex AI</span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-surface-container-low p-4 rounded-xl text-center">
                <p className="text-2xl font-bold text-primary">{recommendation.registered}</p>
                <p className="text-[10px] text-stone-500 uppercase font-bold tracking-widest">Registered</p>
              </div>
              <div className="bg-surface-container-low p-4 rounded-xl text-center">
                <p className="text-2xl font-bold text-primary">{recommendation.adjusted_headcount}</p>
                <p className="text-[10px] text-stone-500 uppercase font-bold tracking-widest">Expected</p>
              </div>
              <div className="bg-surface-container-low p-4 rounded-xl text-center">
                <p className="text-2xl font-bold text-primary">{Math.round(recommendation.no_show_rate * 100)}%</p>
                <p className="text-[10px] text-stone-500 uppercase font-bold tracking-widest">No-Show</p>
              </div>
            </div>

            <div className="bg-surface-container-low p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-stone-500">Dietary Breakdown</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span>No restrictions: <strong>{recommendation.dietary_breakdown.noRestrictions}</strong></span>
                <span>Vegan: <strong>{recommendation.dietary_breakdown.vegan}</strong></span>
                <span>Lactose-free: <strong>{recommendation.dietary_breakdown.lactoseFree}</strong></span>
                <span>Gluten-free: <strong>{recommendation.dietary_breakdown.glutenFree}</strong></span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4 flex items-center gap-2">
                <ShoppingBasket size={14} />
                Recommended Items ({recommendation.items?.length || 0})
              </h4>
              <ul className="space-y-3">
                {recommendation.items?.map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
                    <div>
                      <p className="text-sm font-bold text-primary">{item.name}</p>
                      {item.notes && <p className="text-[10px] text-stone-500 mt-0.5">{item.notes}</p>}
                    </div>
                    <span className="text-sm font-bold text-primary">x{item.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>

            {recommendation.reasoning && (
              <div className="bg-secondary/10 p-4 rounded-xl border border-secondary/20">
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1">AI Reasoning</p>
                <p className="text-sm text-primary leading-relaxed">{recommendation.reasoning}</p>
              </div>
            )}
          </div>
        )}

        <div className="pt-6 border-t border-stone-100 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-primary text-white px-8 py-3 rounded-xl text-sm font-bold shadow-md hover:shadow-xl hover:bg-primary/95 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating via Vertex AI...
              </>
            ) : (
              'Generate Order'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
