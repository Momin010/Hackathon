import React from 'react';
import { Utensils } from 'lucide-react';

export default function Login({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4">
      <div className="bg-surface-container-lowest p-10 rounded-3xl shadow-sm border border-stone-200/50 w-full max-w-md flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-on-primary mb-6">
          <Utensils size={32} className="fill-current" />
        </div>
        <h1 className="text-3xl font-bold tracking-tighter text-primary mb-1">Culinara</h1>
        <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-8">Event Food Logic</p>

        <div className="w-full space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Email</label>
            <input type="email" placeholder="hello@culinara.ai" className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm text-primary focus:ring-2 focus:ring-secondary outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Password</label>
            <input type="password" placeholder="••••••••" className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm text-primary focus:ring-2 focus:ring-secondary outline-none" />
          </div>
          <button onClick={onLogin} className="w-full bg-primary text-white font-bold px-8 py-3 rounded-2xl shadow-md hover:shadow-xl hover:bg-primary/95 transition-all mt-4">
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
