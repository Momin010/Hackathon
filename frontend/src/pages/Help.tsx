import React, { useState } from 'react';
import { HelpCircle, Mail, FileText, MessageCircle, ArrowLeft, Send, ChevronRight, ChevronDown } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

type HelpSection = 'menu' | 'documentation' | 'chat' | 'email' | 'faq';

export default function Help() {
  const [activeSection, setActiveSection] = useState<HelpSection>('menu');
  const [activeDoc, setActiveDoc] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'agent', text: 'Hi there! How can we help you today?', time: '10:00 AM' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const userText = chatInput;
    const newMsg = { id: Date.now(), sender: 'user', text: userText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    
    const updatedMessages = [...chatMessages, newMsg];
    setChatMessages(updatedMessages);
    setChatInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const history = updatedMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: history,
        config: {
          systemInstruction: "You are a helpful support agent for Culinara, an event food logic app that connects Luma (for RSVPs) and S-kauppa (for food ordering). Keep answers concise, friendly, and helpful."
        }
      });

      const agentText = response.text || "I'm sorry, I couldn't process that.";
      
      setChatMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        sender: 'agent', 
        text: agentText, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        sender: 'agent', 
        text: "Sorry, I'm having trouble connecting to the support server right now.", 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
  };

  const renderMenu = () => (
    <div className="grid grid-cols-2 gap-6">
      <div onClick={() => setActiveSection('documentation')} className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-stone-200/50 flex flex-col items-start gap-4 hover:shadow-md transition-all cursor-pointer">
        <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center text-primary">
          <FileText size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-primary">Documentation</h3>
          <p className="text-sm text-stone-500 mt-1">Read guides on how to connect Luma and S-kauppa.</p>
        </div>
      </div>
      <div onClick={() => setActiveSection('chat')} className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-stone-200/50 flex flex-col items-start gap-4 hover:shadow-md transition-all cursor-pointer">
        <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center text-primary">
          <MessageCircle size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-primary">Chat Support</h3>
          <p className="text-sm text-stone-500 mt-1">Talk to our team for immediate assistance.</p>
        </div>
      </div>
      <div onClick={() => setActiveSection('email')} className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-stone-200/50 flex flex-col items-start gap-4 hover:shadow-md transition-all cursor-pointer">
        <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center text-primary">
          <Mail size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-primary">Email Us</h3>
          <p className="text-sm text-stone-500 mt-1">Send us a detailed query at support@culinara.ai.</p>
        </div>
      </div>
      <div onClick={() => setActiveSection('faq')} className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-stone-200/50 flex flex-col items-start gap-4 hover:shadow-md transition-all cursor-pointer">
        <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center text-primary">
          <HelpCircle size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-primary">FAQ</h3>
          <p className="text-sm text-stone-500 mt-1">Find answers to commonly asked questions.</p>
        </div>
      </div>
    </div>
  );

  const renderDocumentation = () => {
    if (activeDoc === 'luma') {
      return (
        <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-stone-200/50 space-y-6">
          <h2 className="text-2xl font-bold text-primary border-b border-stone-100 pb-4">Connecting Luma API</h2>
          <div className="space-y-4 text-sm text-stone-600 leading-relaxed">
            <p>Integrating Luma allows Culinara to automatically sync your events, RSVPs, and dietary requirements in real-time.</p>
            <h3 className="text-lg font-bold text-primary mt-6">Step 1: Generate API Key</h3>
            <p>Log in to your Luma account, navigate to <strong>Settings &gt; API</strong>, and click <strong>Generate New Key</strong>. Make sure to grant read access for Events and Guests.</p>
            <h3 className="text-lg font-bold text-primary mt-6">Step 2: Add to Culinara</h3>
            <p>Go to the <strong>Settings</strong> tab in Culinara, find the <strong>Integrations</strong> section, and paste your Luma API key into the designated field. Click Save.</p>
            <h3 className="text-lg font-bold text-primary mt-6">Step 3: Verify Connection</h3>
            <p>Once saved, you should see a green "Luma API Active" badge in your top navigation bar. Your upcoming events will automatically populate in the Dashboard.</p>
          </div>
        </div>
      );
    }
    
    if (activeDoc === 'billing') {
      return (
        <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-stone-200/50 space-y-6">
          <h2 className="text-2xl font-bold text-primary border-b border-stone-100 pb-4">Setting up S-kauppa Billing</h2>
          <div className="space-y-4 text-sm text-stone-600 leading-relaxed">
            <p>To enable automated food ordering, you need to connect your S-Yrityskortti or corporate billing details.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Navigate to <strong>Settings &gt; Billing</strong>.</li>
              <li>Select <strong>Corporate Invoicing (Verkkolasku)</strong> or <strong>Credit Card</strong>.</li>
              <li>Enter your company's VAT ID (Y-tunnus) and OVT code if using e-invoicing.</li>
              <li>Set a monthly budget limit to prevent accidental overspending.</li>
            </ul>
            <div className="bg-secondary/10 p-4 rounded-xl mt-4 border border-secondary/20">
              <p className="text-secondary font-bold text-xs uppercase tracking-widest mb-1">Note</p>
              <p>All S-kauppa orders generated by Culinara will automatically include your event name in the invoice reference field for easy accounting.</p>
            </div>
          </div>
        </div>
      );
    }

    if (activeDoc === 'dietary') {
      return (
        <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-stone-200/50 space-y-6">
          <h2 className="text-2xl font-bold text-primary border-b border-stone-100 pb-4">Managing Dietary Restrictions</h2>
          <div className="space-y-4 text-sm text-stone-600 leading-relaxed">
            <p>Culinara uses advanced natural language processing to read the dietary requirements submitted by your guests via Luma and maps them to safe products in S-kauppa.</p>
            <h3 className="text-lg font-bold text-primary mt-6">Supported Mappings</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Vegan / VG:</strong> Filters out all animal products, dairy, and honey.</li>
              <li><strong>Vegetarian / V:</strong> Allows dairy and eggs, filters out meat and seafood.</li>
              <li><strong>Gluten-Free / GF:</strong> Strictly selects products certified as gluten-free.</li>
              <li><strong>Lactose-Free / LF:</strong> Selects "laktoositon" variants of dairy products.</li>
            </ul>
            <p className="mt-4">If a guest submits a complex allergy (e.g., "Allergic to raw tomatoes and kiwi"), Planera AI will flag the event for manual review to ensure absolute safety.</p>
          </div>
        </div>
      );
    }

    if (activeDoc === 'prediction') {
      return (
        <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-stone-200/50 space-y-6">
          <h2 className="text-2xl font-bold text-primary border-b border-stone-100 pb-4">Understanding the Prediction Model</h2>
          <div className="space-y-4 text-sm text-stone-600 leading-relaxed">
            <p>Food waste is a major issue at free events. Culinara's prediction model helps you order exactly what you need by estimating the actual show-up rate.</p>
            <h3 className="text-lg font-bold text-primary mt-6">How it works</h3>
            <p>Our algorithm calculates a baseline show-up probability based on several factors:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Historical Data:</strong> Your organization's past event attendance rates.</li>
              <li><strong>Weather Forecast:</strong> Heavy rain or snow typically reduces attendance by 10-15%.</li>
              <li><strong>Time & Day:</strong> Friday evening events have different drop-off curves than Tuesday morning workshops.</li>
              <li><strong>Ticket Price:</strong> Free events average a 40-50% drop-off, while paid events are usually &lt;10%.</li>
            </ul>
            <p className="mt-4">You can always override the AI's prediction manually in the <strong>Plan Event</strong> screen if you expect a different turnout.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-stone-200/50 space-y-6">
        <h2 className="text-2xl font-bold text-primary border-b border-stone-100 pb-4">Documentation</h2>
        <div className="space-y-4">
          {[
            { id: 'luma', title: 'Connecting Luma API', desc: 'Learn how to sync your event RSVPs automatically.' },
            { id: 'billing', title: 'Setting up S-kauppa Billing', desc: 'Configure your company billing details for automated orders.' },
            { id: 'dietary', title: 'Managing Dietary Restrictions', desc: 'How Culinara maps dietary needs to available products.' },
            { id: 'prediction', title: 'Understanding the Prediction Model', desc: 'Deep dive into how we calculate no-show rates.' }
          ].map((doc) => (
            <div 
              key={doc.id}
              onClick={() => setActiveDoc(doc.id)}
              className="p-4 rounded-2xl border border-stone-100 hover:border-secondary/50 hover:bg-surface-container-low transition-all cursor-pointer flex justify-between items-center"
            >
              <div>
                <h4 className="font-bold text-primary">{doc.title}</h4>
                <p className="text-sm text-stone-500 mt-1">{doc.desc}</p>
              </div>
              <ChevronRight className="text-stone-400" size={20} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderChat = () => (
    <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-stone-200/50 flex flex-col h-[500px] overflow-hidden">
      <div className="p-6 border-b border-stone-100 bg-white flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
          <MessageCircle size={20} className="text-primary" />
        </div>
        <div>
          <h2 className="font-bold text-sm text-primary">Support Team</h2>
          <p className="text-[10px] text-secondary font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Online
          </p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-surface-container-lowest no-scrollbar">
        {chatMessages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-secondary/10 text-primary'}`}>
              {msg.sender === 'user' ? <span className="text-xs font-bold">U</span> : <MessageCircle size={16} />}
            </div>
            <div className={`space-y-2 ${msg.sender === 'user' ? 'items-end flex flex-col' : ''}`}>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
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
        {isTyping && (
          <div className="flex gap-4 max-w-[85%]">
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-secondary/10 text-primary">
              <MessageCircle size={16} />
            </div>
            <div className="space-y-2">
              <div className="p-4 rounded-2xl text-sm leading-relaxed bg-surface-container-low text-primary rounded-tl-none flex gap-1 items-center h-12">
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 bg-white border-t border-stone-100">
        <div className="relative flex items-center">
          <input 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
            className="w-full bg-surface-container-low border-none rounded-2xl py-4 pl-4 pr-12 text-sm focus:ring-2 focus:ring-secondary/50 transition-all outline-none" 
            placeholder="Type your message..." 
            type="text"
          />
          <button 
            onClick={handleSendChat}
            className="absolute right-3 w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-all"
          >
            <Send size={18} className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderEmail = () => (
    <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-stone-200/50 space-y-6">
      <h2 className="text-2xl font-bold text-primary border-b border-stone-100 pb-4">Email Us</h2>
      {emailSent ? (
        <div className="bg-green-50 text-green-700 p-6 rounded-2xl border border-green-200 flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
            <Send size={24} />
          </div>
          <h3 className="font-bold text-lg">Message Sent!</h3>
          <p className="text-sm">We'll get back to you within 24 hours.</p>
        </div>
      ) : (
        <form onSubmit={handleSendEmail} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Subject</label>
            <input required type="text" placeholder="How can we help?" className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm text-primary focus:ring-2 focus:ring-secondary outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Message</label>
            <textarea required rows={5} placeholder="Describe your issue in detail..." className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm text-primary focus:ring-2 focus:ring-secondary outline-none resize-none"></textarea>
          </div>
          <button type="submit" className="bg-primary text-white font-bold px-8 py-3 rounded-2xl shadow-md hover:shadow-xl hover:bg-primary/95 transition-all flex items-center gap-2">
            <Send size={18} /> Send Message
          </button>
        </form>
      )}
    </div>
  );

  const renderFaq = () => (
    <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-stone-200/50 space-y-6">
      <h2 className="text-2xl font-bold text-primary border-b border-stone-100 pb-4">Frequently Asked Questions</h2>
      <div className="space-y-4">
        {[
          { q: 'How do I update my billing information?', a: 'You can update your billing information in the Settings page under the Billing tab. We support all major credit cards and direct invoicing.' },
          { q: 'Can I export my event data?', a: 'Yes, you can export event data as a CSV file from the Events page by clicking the Export button in the top right corner.' },
          { q: 'What happens if an order fails?', a: 'If an automated S-kauppa order fails, you will receive an immediate email notification and an alert on your Dashboard. You can retry the order manually.' },
          { q: 'How accurate is the no-show prediction?', a: 'Our AI model analyzes historical attendance data, weather, and event type to predict no-shows with ~85% accuracy, helping you reduce food waste.' }
        ].map((faq, i) => (
          <div key={i} className="border border-stone-100 rounded-2xl overflow-hidden">
            <button 
              onClick={() => setFaqOpen(faqOpen === i ? null : i)}
              className="w-full p-4 flex justify-between items-center bg-white hover:bg-surface-container-low transition-colors text-left"
            >
              <span className="font-bold text-primary">{faq.q}</span>
              <ChevronDown className={`text-stone-400 transition-transform ${faqOpen === i ? 'rotate-180' : ''}`} size={20} />
            </button>
            {faqOpen === i && (
              <div className="p-4 bg-surface-container-low text-sm text-stone-600 border-t border-stone-100">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-[1000px] mx-auto w-full space-y-8 overflow-y-auto h-full no-scrollbar">
      <div className="flex items-center gap-4">
        {activeSection !== 'menu' && (
          <button 
            onClick={() => {
              if (activeDoc) setActiveDoc(null);
              else setActiveSection('menu');
            }}
            className="w-10 h-10 rounded-full bg-surface-container-lowest border border-stone-200 flex items-center justify-center text-stone-500 hover:text-primary hover:bg-stone-100 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-primary mb-2">Help & Support</h1>
          <p className="text-stone-500 text-sm">Get assistance with your event planning and integrations.</p>
        </div>
      </div>
      
      {activeSection === 'menu' && renderMenu()}
      {activeSection === 'documentation' && renderDocumentation()}
      {activeSection === 'chat' && renderChat()}
      {activeSection === 'email' && renderEmail()}
      {activeSection === 'faq' && renderFaq()}
    </div>
  );
}
