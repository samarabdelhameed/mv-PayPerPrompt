import React from 'react';
import { ViewState } from '../types';
import { Wallet, Grid, LayoutDashboard, LogOut, Bot, Activity, Heart } from 'lucide-react';

interface NavbarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  balance: number;
  onLogout: () => void;
}

// Custom Movement Logo SVG
const MovementLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-2">
    <path d="M12 2L2 22H22L12 2Z" fill="#FAFF00" />
    <path d="M12 6L4.5 21H19.5L12 6Z" fill="black" />
  </svg>
);

export const Navbar: React.FC<NavbarProps> = ({ currentView, onChangeView, balance, onLogout }) => {
  const NavItem = ({ view, icon, label }: { view: ViewState, icon: React.ReactNode, label: string }) => (
    <button
      onClick={() => onChangeView(view)}
      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm font-medium ${
        currentView === view 
          ? 'bg-zinc-800 text-white shadow-[0_0_10px_rgba(0,0,0,0.5)] border border-zinc-700' 
          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <nav className="h-16 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => onChangeView(ViewState.MARKETPLACE)}>
        <div className="w-8 h-8 rounded bg-gradient-to-tr from-neon to-emerald-600 flex items-center justify-center font-bold text-black font-mono shadow-[0_0_15px_rgba(57,255,20,0.3)]">
          P3
        </div>
        <div className="flex flex-col">
            <div className="flex items-center">
                <span className="font-bold text-lg text-white tracking-tight leading-none">PayPerPrompt</span>
                <MovementLogo />
            </div>
            <span className="text-[9px] text-zinc-500 font-mono tracking-widest leading-none mt-0.5">BUILT ON MOVEMENT</span>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-2 bg-zinc-900/50 p-1 rounded-full border border-zinc-800/50">
        <NavItem view={ViewState.MARKETPLACE} icon={<Grid className="w-4 h-4" />} label="Marketplace" />
        <NavItem view={ViewState.LIVE_ANALYTICS} icon={<Activity className="w-4 h-4" />} label="Live Net" />
        <NavItem view={ViewState.AGENT_DASHBOARD} icon={<Bot className="w-4 h-4" />} label="Agent Studio" />
        <NavItem view={ViewState.WALLET} icon={<LayoutDashboard className="w-4 h-4" />} label="Wallet" />
      </div>

      <div className="flex items-center gap-4">
        {/* Parthenon Vote Button */}
        <a 
          href="https://parthenon.movementlabs.xyz" 
          target="_blank" 
          rel="noreferrer"
          className="hidden md:flex items-center gap-2 bg-[#FF0055]/10 hover:bg-[#FF0055]/20 text-[#FF0055] px-3 py-1.5 rounded-full border border-[#FF0055]/20 transition-all text-xs font-bold"
        >
            <Heart className="w-3 h-3 fill-current animate-pulse" /> Vote on Parthenon
        </a>

        <div className="hidden sm:flex items-center gap-2 bg-black border border-neon/30 rounded-lg px-3 py-1.5 shadow-[0_0_10px_rgba(57,255,20,0.15)]">
          <div className="w-2 h-2 rounded-full bg-neon animate-pulse"></div>
          <span className="font-mono text-sm font-bold text-neon">{balance.toFixed(4)} MOVE</span>
        </div>
        
        <button onClick={onLogout} className="text-zinc-500 hover:text-red-400 transition-colors p-2">
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
};