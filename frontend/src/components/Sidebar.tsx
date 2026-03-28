import React from 'react';
import { Utensils, LayoutDashboard, Calendar, History, Settings as SettingsIcon, HelpCircle, LogOut } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSignOut: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, onSignOut }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'events', icon: Calendar, label: 'Events' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' },
  ];

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 border-stone-200/60 flex flex-col p-4 gap-y-2 z-50 border-r border-white/10 bg-sidebar">
      <div className="flex items-center gap-3 px-2 mb-8 mt-2">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary">
          <Utensils size={20} className="fill-current" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tighter text-white">Planera</h1>
          <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Event Planning</p>
        </div>
      </div>
      
      <nav className="flex flex-col gap-1">
        {navItems.map(item => (
          <button 
            key={item.id} 
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ease-in-out font-sans text-sm font-medium w-full text-left ${
              activeTab === item.id 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-stone-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="mt-auto flex flex-col gap-1 border-t border-white/10 pt-4">
        <button 
          onClick={() => setActiveTab('help')}
          className={`flex items-center gap-3 px-3 py-2 font-sans text-sm font-medium rounded-lg w-full text-left transition-all duration-200 ease-in-out ${
            activeTab === 'help'
              ? 'bg-primary text-white shadow-sm'
              : 'text-stone-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <HelpCircle size={18} />
          <span>Help</span>
        </button>
        <button 
          onClick={onSignOut}
          className="flex items-center gap-3 px-3 py-2 font-sans text-sm font-medium text-stone-400 hover:text-white hover:bg-white/10 rounded-lg w-full text-left transition-all duration-200 ease-in-out"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
