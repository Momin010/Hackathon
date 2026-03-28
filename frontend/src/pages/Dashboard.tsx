import React, { useEffect, useState } from 'react';
import { Zap, Bot, Send, Users, BarChart2, ShoppingBasket, Loader2 } from 'lucide-react';
import { fetchEvents, postRecommend, sendChatMessage, ApiEvent, RecommendResponse, ChatMessage } from '../services/api';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  onPlanEvent: (event: ApiEvent) => void;
}

interface ChatMessageUI {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

const eventTypeLabels: Record<string, string> = {
  pizza_event: 'Pizza Night',
  snacks_event: 'Workshop / Snacks',
  sandwich_event: 'Fireside Chat',
};

export default function Dashboard({ setActiveTab, onPlanEvent }: DashboardProps) {
  const [chatInput, setChatInput] = useState('');
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [recommending, setRecommending] = useState(false);
  const [recommendation, setRecommendation] = useState<RecommendResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    fetchEvents()
      .then((evts) => {
        setEvents(evts);
        if (evts.length > 0) {
          setMessages([
            {
              id: 1,
              sender: 'ai',
              text: `Found ${evts.length} upcoming event${evts.length > 1 ? 's' : ''} from Luma. "${evts[0].name}" is the next event — classified as ${eventTypeLabels[evts[0].event_type] || evts[0].event_type}. Should I generate the S-kauppa cart?`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        } else {
          setMessages([
            {
              id: 1,
              sender: 'ai',
              text: 'No upcoming events found in Luma. Events will appear here once they are created.',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      })
      .catch((err) => setEventsError(err.message))
      .finally(() => setLoadingEvents(false));
  }, []);

  const upcomingEvent = events[0];

  const handleGenerateCart = async () => {
    if (!upcomingEvent) return;

    setRecommending(true);
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: 'user', text: 'Yes, generate cart', time },
    ]);

    try {
      const result = await postRecommend(upcomingEvent.id);
      setRecommendation(result);

      const itemsList = result.items.map((i) => `${i.quantity}x ${i.name}`).join(', ');
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: `Cart generated via Vertex AI! ${result.registered} registered, predicted ${result.adjusted_headcount} attendees (${Math.round(result.no_show_rate * 100)}% no-show rate). Dietary: ${result.dietary_breakdown.vegan} vegan, ${result.dietary_breakdown.lactoseFree} lactose-free, ${result.dietary_breakdown.glutenFree} gluten-free.\n\nItems: ${itemsList}\n\nReasoning: ${result.reasoning}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: `Failed to generate cart: ${err instanceof Error ? err.message : 'Unknown error'}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setRecommending(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Add user message to UI
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: 'user', text: userMessage, time },
    ]);
    setChatInput('');
    setIsChatLoading(true);

    // Check for quick commands
    const lowerInput = userMessage.toLowerCase();
    if (lowerInput.includes('generate') || lowerInput.includes('cart') || lowerInput.includes('yes')) {
      await handleGenerateCart();
      setIsChatLoading(false);
      return;
    }

    if (lowerInput.includes('details') || lowerInput.includes('more')) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: upcomingEvent
            ? `Event: ${upcomingEvent.name}\nType: ${eventTypeLabels[upcomingEvent.event_type] || upcomingEvent.event_type}\nDate: ${upcomingEvent.start_at ? new Date(upcomingEvent.start_at).toLocaleDateString() : 'TBD'}\n${upcomingEvent.description || 'No description available.'}`
            : 'No events available to show details for.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsChatLoading(false);
      return;
    }

    // Send to Vertex AI via backend
    try {
      const response = await sendChatMessage(userMessage, chatHistory);
      
      // Update chat history
      setChatHistory((prev) => [
        ...prev,
        { role: 'user', text: userMessage },
        { role: 'model', text: response.response },
      ]);

      // Add AI response to UI
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: response.response,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: `Sorry, I encountered an error: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {upcomingEvent && (
        <section className="bg-secondary/20 text-primary px-6 py-3.5 flex items-center justify-between border-b border-secondary/30 shrink-0">
          <div className="flex items-center gap-3">
            <Zap size={18} className="text-primary fill-current" />
            <p className="text-sm font-medium tracking-tight">
              New Event: <span className="font-bold">{upcomingEvent.name}</span>
              {upcomingEvent.start_at && ` — ${new Date(upcomingEvent.start_at).toLocaleDateString()}`}
              . Classified as {eventTypeLabels[upcomingEvent.event_type] || upcomingEvent.event_type}.
            </p>
          </div>
          <button
            onClick={() => onPlanEvent(upcomingEvent)}
            className="bg-primary text-white text-xs font-bold uppercase tracking-widest px-6 py-2 rounded-full hover:bg-primary/90 shadow-md transition-all active:scale-95"
          >
            Start Planning
          </button>
        </section>
      )}

      <div className="flex-1 overflow-hidden flex gap-8 p-8 max-w-[1600px] mx-auto w-full">
        <section className="w-[45%] flex flex-col bg-surface-container-lowest rounded-3xl shadow-sm border border-stone-200/50 overflow-hidden">
          <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                <Bot size={20} className="text-primary fill-current" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-primary">Planera AI</h2>
                <p className="text-[10px] text-secondary font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Online — Vertex AI
                </p>
              </div>
            </div>
          </div>

          {loadingEvents && (
            <div className="flex-1 flex items-center justify-center gap-3 text-stone-500">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Loading events...</span>
            </div>
          )}

          {eventsError && (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-sm">
                Failed to load events: {eventsError}
              </div>
            </div>
          )}

          {!loadingEvents && !eventsError && (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-4 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-secondary/10 text-primary'}`}>
                      {msg.sender === 'user' ? <span className="text-xs font-bold">U</span> : <Bot size={16} />}
                    </div>
                    <div className={`space-y-2 ${msg.sender === 'user' ? 'items-end flex flex-col' : ''}`}>
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.sender === 'user'
                          ? 'bg-primary text-white rounded-tr-none'
                          : 'bg-surface-container-low text-primary rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                      <div className="text-[10px] text-stone-400 px-1">{msg.time}</div>
                    </div>
                  </div>
                ))}

                {recommending && (
                  <div className="flex gap-4 max-w-[85%]">
                    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-secondary/10 text-primary">
                      <Bot size={16} />
                    </div>
                    <div className="p-4 rounded-2xl text-sm bg-surface-container-low text-primary rounded-tl-none flex gap-1 items-center">
                      <Loader2 size={14} className="animate-spin" />
                      <span className="text-xs text-stone-500">Vertex AI is generating recommendation...</span>
                    </div>
                  </div>
                )}

                {isChatLoading && (
                  <div className="flex gap-4 max-w-[85%]">
                    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-secondary/10 text-primary">
                      <Bot size={16} />
                    </div>
                    <div className="p-4 rounded-2xl text-sm bg-surface-container-low text-primary rounded-tl-none flex gap-1 items-center">
                      <Loader2 size={14} className="animate-spin" />
                      <span className="text-xs text-stone-500">Planera AI is thinking...</span>
                    </div>
                  </div>
                )}

                {upcomingEvent && !recommending && recommendation === null && (
                  <div className="flex flex-wrap gap-2 justify-end pt-4">
                    <button
                      onClick={handleGenerateCart}
                      className="text-xs font-bold py-2 px-4 rounded-full border border-secondary text-primary hover:bg-secondary/10 transition-colors"
                    >
                      Yes, generate cart
                    </button>
                    <button
                      onClick={() => setChatInput('Show more details')}
                      className="text-xs font-bold py-2 px-4 rounded-full border border-secondary text-primary hover:bg-secondary/10 transition-colors"
                    >
                      Show more details
                    </button>
                  </div>
                )}
              </div>

              <div className="p-4 bg-white border-t border-stone-100">
                <div className="relative flex items-center">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-surface-container-low border-none rounded-2xl py-4 pl-4 pr-12 text-sm focus:ring-2 focus:ring-secondary/50 transition-all outline-none"
                    placeholder="Type a message..."
                    type="text"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="absolute right-3 w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-all"
                  >
                    <Send size={18} className="ml-1" />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        <section className="flex-1 space-y-8 overflow-y-auto no-scrollbar pr-2 pb-8">
          {loadingEvents && (
            <div className="flex items-center justify-center py-20 gap-3 text-stone-500">
              <Loader2 size={20} className="animate-spin" />
              <span>Loading event data...</span>
            </div>
          )}

          {!loadingEvents && eventsError && (
            <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200">
              <p className="font-bold">Failed to load events</p>
              <p className="text-sm mt-1">{eventsError}</p>
            </div>
          )}

          {!loadingEvents && !eventsError && !upcomingEvent && (
            <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-stone-200/50 text-center">
              <h2 className="text-xl font-bold text-primary mb-2">No Events Found</h2>
              <p className="text-stone-500 text-sm">Upcoming events from Luma will appear here.</p>
            </div>
          )}

          {!loadingEvents && upcomingEvent && (
            <>
              <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-stone-200/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary px-2 py-0.5 bg-secondary/30 rounded">
                      {eventTypeLabels[upcomingEvent.event_type] || upcomingEvent.event_type}
                    </span>
                    {upcomingEvent.start_at && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                        {new Date(upcomingEvent.start_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <h1 className="text-4xl font-bold tracking-tight text-primary mb-2">{upcomingEvent.name}</h1>
                  <p className="text-stone-500 text-sm max-w-md leading-relaxed">
                    {upcomingEvent.description || 'No description available.'}
                  </p>
                </div>
              </div>

              {recommendation && (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-stone-200/50">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500">RSVP Analysis</h3>
                        <Users size={20} className="text-secondary" />
                      </div>
                      <div className="flex items-end gap-4 mb-4">
                        <span className="text-5xl font-bold tracking-tighter text-primary">{recommendation.registered}</span>
                        <span className="text-sm font-medium text-stone-400 pb-1">Registered</span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-stone-500">
                            Predicted Show-up ({Math.round((1 - recommendation.no_show_rate) * 100)}%)
                          </span>
                          <span className="font-bold text-primary">{recommendation.adjusted_headcount} guests</span>
                        </div>
                        <div className="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-secondary h-full rounded-full"
                            style={{ width: `${Math.round((1 - recommendation.no_show_rate) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-stone-200/50">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500">Dietary Profile</h3>
                        <BarChart2 size={20} className="text-secondary" />
                      </div>
                      <div className="space-y-4">
                        {[
                          { label: 'No Restrictions', value: recommendation.dietary_breakdown.noRestrictions, color: 'bg-primary' },
                          { label: 'Vegan', value: recommendation.dietary_breakdown.vegan, color: 'bg-secondary' },
                          { label: 'Lactose-Free', value: recommendation.dietary_breakdown.lactoseFree, color: 'bg-stone-400' },
                          { label: 'Gluten-Free', value: recommendation.dietary_breakdown.glutenFree, color: 'bg-stone-300' },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${item.color}`}></span>
                              <span className="text-xs font-medium">{item.label}</span>
                            </div>
                            <span className="text-xs font-bold">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-stone-200/50 overflow-hidden">
                    <div className="p-6 bg-surface-container-low border-b border-stone-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                          <ShoppingBasket size={16} className="text-primary" />
                        </div>
                        <h3 className="text-sm font-bold tracking-tight text-primary">S-kauppa Cart (Vertex AI)</h3>
                      </div>
                    </div>
                    <div className="p-6">
                      <ul className="space-y-4">
                        {recommendation.items?.map((item, idx) => (
                          <li key={idx} className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl">
                            <div>
                              <p className="text-sm font-bold text-primary">{item.name}</p>
                              {item.notes && <p className="text-[10px] text-stone-500">{item.notes}</p>}
                            </div>
                            <span className="text-sm font-bold text-primary">x{item.quantity}</span>
                          </li>
                        ))}
                      </ul>

                      {recommendation.reasoning && (
                        <div className="mt-6 p-4 bg-secondary/10 rounded-xl border border-secondary/20">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1">AI Reasoning</p>
                          <p className="text-sm text-primary">{recommendation.reasoning}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {!recommendation && (
                <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-stone-200/50 text-center">
                  <ShoppingBasket size={32} className="text-stone-300 mx-auto mb-3" />
                  <p className="text-stone-500 text-sm">Use the AI chat to generate a food cart for this event.</p>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
