import React from 'react';
import { Search, ShoppingCart } from 'lucide-react';
import NotificationCenter from './NotificationCenter';

export default function Header() {
  return (
    <header className="flex justify-between items-center w-full px-6 py-3 bg-surface/80 backdrop-blur-xl sticky top-0 z-40 border-b border-stone-200/50 shrink-0">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
          <input 
            className="bg-surface-container-low border-none rounded-full pl-10 pr-4 py-1.5 text-sm w-64 focus:ring-2 focus:ring-secondary transition-all outline-none" 
            placeholder="Search events..." 
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-3 py-1 bg-secondary/20 rounded-full border border-secondary/30">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
          <span className="text-xs font-semibold text-primary tracking-tight">Luma API Active</span>
        </div>
        <div className="flex items-center gap-4 text-stone-500">
          <NotificationCenter />
          <button className="relative hover:text-primary transition-colors">
            <ShoppingCart size={20} />
            <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              2
            </span>
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden bg-stone-200 ring-2 ring-secondary/30">
            <img 
              alt="User profile avatar" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAEvgYxGAHNVOxl6Dw629_f0k8gxMpROLTx035HuDKBWm5WbAS98kL_xC-E18U-kikx3FokKi6PvqNj3VvxcWgSAhZBZW0Drvp_8nr5gy6UDzztjp-TK6E71NSWSu6U9F_mZn6lo4WQSkUl4hVQursGB3YugEKhpCxYk-Twd8DlHlcEVLoD4pMwzqKWDPCJBiDj35JnX18G6P9g5wltTl4F7Qxypf9MMmF6D1KIOj5PNoUQvLhey1RGU8EoKRLyGqHR79hrjvVmQRM"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
