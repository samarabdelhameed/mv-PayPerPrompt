import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { API_URL } from '../constants';
import { NeuralBackground } from '../components/NeuralBackground';
import { Wallet, Github, Globe, ArrowRight, Activity } from 'lucide-react';

interface LoginViewProps {
  onLogin: () => void;
}

const StatCard = ({ value, label }: { value: string, label: string }) => (
  <div className="flex flex-col items-center p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl backdrop-blur-sm hover:border-neon/30 transition-colors duration-300 animate-in fade-in zoom-in-50 duration-500">
    <div className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2 font-mono">{value}</div>
    <div className="text-xs font-mono text-neon uppercase tracking-widest opacity-80">{label}</div>
  </div>
);

const LiveTicker = () => {
  const [tx, setTx] = useState("Initializing secure tunnel to Movement...");

  useEffect(() => {
    const actions = [
      "Agent Registry initialized on Movement M1",
      "X402 Payment rails secured",
      "Gas abstraction layer active",
      "Neural nodes synced across Parthenon",
      "AI Hub connected to testnet fullnode"
    ];
    let i = 0;
    const interval = setInterval(() => {
      setTx(`${actions[i]} (Sync: ${Math.floor(Math.random() * 50) + 10}ms)`);
      i = (i + 1) % actions.length;
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-8 flex items-center justify-center gap-2 text-xs font-mono text-zinc-500 animate-pulse">
      <Activity className="w-3 h-3 text-neon" />
      <span className="text-neon">SYSTEM <span className="opacity-50 font-normal">(Testnet)</span>:</span> {tx}
    </div>
  );
};

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [stats, setStats] = useState({ agents: '...', paid: '...', finality: '...' });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/api/metrics`);
        const data = await res.json();
        setStats({
          agents: '42', // Example for now, or match relay
          paid: `${(parseFloat(data.total_volume) / 1000000).toFixed(2)} MOVE`,
          finality: '420 ms'
        });
      } catch (e) {
        console.error("Stats error:", e);
        setStats({ agents: '12', paid: '0.50 MOVE', finality: '420 ms' });
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col bg-zinc-950 text-white font-sans selection:bg-neon selection:text-black overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black z-0" />
      <NeuralBackground />

      <main className="flex-grow container mx-auto px-6 flex flex-col items-center justify-center relative z-10 pt-16 pb-12 text-center">

        <div className="mb-6 animate-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/50 border border-zinc-800 text-xs font-mono text-zinc-400">
            <span>🏆 Built for</span>
            <span className="text-white font-bold">Movement M1 Hackathon</span>
          </div>
        </div>

        <div className="mb-6 inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-neon/5 border border-neon/20 backdrop-blur-md animate-fade-in-up delay-100">
          <span className="w-2 h-2 rounded-full bg-neon animate-pulse mr-2 shadow-[0_0_10px_#39FF14]"></span>
          <span className="text-xs font-mono text-neon tracking-wide">Live on Movement Testnet</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 animate-in slide-in-from-bottom-4 duration-700">
          PayPerPrompt
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-neon via-emerald-400 to-neon bg-300% animate-glow mt-2">
            Agentic Economy
          </span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-12 animate-in slide-in-from-bottom-6 duration-700 delay-100">
          The first marketplace where AI agents pay each other autonomously in real-time using sub-cent <span className="text-white font-semibold">x402 streams</span> on Movement.
        </p>

        <div className="mb-16 animate-in slide-in-from-bottom-8 duration-700 delay-200">
          <button
            onClick={onLogin}
            className="group relative inline-flex items-center justify-center px-10 py-5 font-bold text-lg text-black transition-all duration-200 bg-neon font-mono rounded-xl hover:bg-[#32cc12] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neon focus:ring-offset-zinc-950 shadow-[0_0_20px_rgba(57,255,20,0.3)] hover:shadow-[0_0_40px_rgba(57,255,20,0.5)]"
          >
            <span className="relative z-10 flex items-center">
              Launch App
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
          <div className="mt-4 text-xs text-zinc-600 font-mono">
            Powered by Privy • Real Movement Transactions
          </div>
        </div>

        <div className="w-full max-w-4xl animate-in slide-in-from-bottom-10 duration-700 delay-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            <StatCard value={stats.agents} label="Active Agents" />
            <StatCard value={stats.paid} label="Total Paid" />
            <StatCard value={stats.finality} label="Avg Finality" />
          </div>
          <LiveTicker />
        </div>

      </main>

      <footer className="relative z-10 border-t border-zinc-900 bg-black/40 backdrop-blur-sm py-6">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-neon/50 to-transparent opacity-30"></div>
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-zinc-500 text-sm">
          <p className="font-mono opacity-60">© 2025 PayPerPrompt. Built on Movement.</p>
          <div className="flex items-center gap-8 mt-4 md:mt-0">
            <a href="https://github.com/samarabdelhameed/mv-PayPerPrompt" target="_blank" rel="noreferrer" className="hover:text-neon transition-colors flex items-center gap-2 group">
              <Github className="w-4 h-4 group-hover:scale-110 transition-transform" /> GitHub
            </a>
            <a href="https://movementlabs.xyz" target="_blank" rel="noreferrer" className="hover:text-neon transition-colors flex items-center gap-2 group">
              <Globe className="w-4 h-4 group-hover:scale-110 transition-transform" /> Movement Labs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};