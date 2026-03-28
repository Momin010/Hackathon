import React, { useState } from 'react';
import { Key, Bell } from 'lucide-react';

export default function Settings() {
  const [notifyNewEvent, setNotifyNewEvent] = useState(true);
  const [notifyCartReady, setNotifyCartReady] = useState(true);

  return (
    <div className="p-8 max-w-[1000px] mx-auto w-full space-y-8 overflow-y-auto h-full no-scrollbar">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-primary mb-2">Settings</h1>
        <p className="text-stone-500 text-sm">Manage your account, integrations, and preferences.</p>
      </div>

      <div className="grid gap-8">
        {/* Integrations */}
        <section className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-stone-200/50">
          <div className="flex items-center gap-3 mb-6">
            <Key className="text-secondary" size={24} />
            <h2 className="text-xl font-bold text-primary">API Integrations</h2>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Luma API Key</label>
              <input type="password" value="••••••••••••••••" readOnly className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm text-primary focus:ring-2 focus:ring-secondary outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">S-kauppa Token</label>
              <input type="password" value="••••••••••••••••" readOnly className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm text-primary focus:ring-2 focus:ring-secondary outline-none" />
            </div>
            <button className="bg-surface-container-low text-primary text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-secondary/20 transition-all">
              Update Keys
            </button>
          </div>
        </section>

        {/* Preferences */}
        <section className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-stone-200/50">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="text-secondary" size={24} />
            <h2 className="text-xl font-bold text-primary">Notifications</h2>
          </div>
          <div className="space-y-4">
            <label 
              className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl cursor-pointer"
              onClick={() => setNotifyNewEvent(!notifyNewEvent)}
            >
              <div>
                <p className="font-bold text-primary text-sm">New Event Detected</p>
                <p className="text-xs text-stone-500">Get notified when Luma API finds a new event.</p>
              </div>
              <div className={`w-10 h-6 rounded-full relative transition-colors duration-300 ${notifyNewEvent ? 'bg-primary' : 'bg-stone-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 ${notifyNewEvent ? 'right-1' : 'left-1'}`}></div>
              </div>
            </label>
            <label 
              className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl cursor-pointer"
              onClick={() => setNotifyCartReady(!notifyCartReady)}
            >
              <div>
                <p className="font-bold text-primary text-sm">Cart Ready for Review</p>
                <p className="text-xs text-stone-500">Get notified when AI generates a grocery cart.</p>
              </div>
              <div className={`w-10 h-6 rounded-full relative transition-colors duration-300 ${notifyCartReady ? 'bg-primary' : 'bg-stone-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 ${notifyCartReady ? 'right-1' : 'left-1'}`}></div>
              </div>
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}
