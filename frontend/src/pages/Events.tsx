import React, { useEffect, useState } from 'react';
import { Users, MapPin, ChevronRight, Loader2 } from 'lucide-react';
import { fetchEvents, ApiEvent } from '../services/api';

interface EventsProps {
  onPlanEvent: (event: ApiEvent) => void;
}

const eventTypeLabels: Record<string, string> = {
  pizza_event: 'Pizza Night',
  snacks_event: 'Workshop / Snacks',
  sandwich_event: 'Fireside Chat',
};

export default function Events({ onPlanEvent }: EventsProps) {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents()
      .then(setEvents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'TBD';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto w-full space-y-8 overflow-y-auto h-full no-scrollbar">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-primary mb-2">Events</h1>
          <p className="text-stone-500 text-sm">Manage your upcoming events and food orders.</p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 gap-3 text-stone-500">
          <Loader2 size={20} className="animate-spin" />
          <span>Loading events from Luma...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200">
          <p className="font-bold">Failed to load events</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="text-center py-20 text-stone-500">
          <p className="text-lg font-bold">No events found</p>
          <p className="text-sm mt-1">Events from Luma will appear here.</p>
        </div>
      )}

      {!loading && !error && (
        <div className="grid gap-4">
          {events.map((event) => (
            <div
              key={event.id}
              onClick={() => onPlanEvent(event)}
              className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-stone-200/50 flex items-center justify-between hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex flex-col items-center justify-center text-primary">
                  <span className="text-[10px] font-bold uppercase">
                    {event.start_at ? new Date(event.start_at).toLocaleDateString('en-US', { month: 'short' }) : '?'}
                  </span>
                  <span className="text-xl font-black leading-none">
                    {event.start_at ? new Date(event.start_at).getDate() : '?'}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary mb-1">{event.name}</h3>
                  <div className="flex items-center gap-4 text-xs text-stone-500 font-medium">
                    {event.start_at && (
                      <span className="flex items-center gap-1">
                        <MapPin size={14} /> {formatDate(event.start_at)}
                      </span>
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-secondary/20 rounded">
                      {eventTypeLabels[event.event_type] || event.event_type}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlanEvent(event);
                  }}
                  className="bg-primary text-white text-xs font-bold uppercase tracking-widest px-5 py-2 rounded-full hover:bg-primary/90 shadow-md transition-all"
                >
                  Plan Food
                </button>
                <ChevronRight className="text-stone-300 group-hover:text-primary transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
