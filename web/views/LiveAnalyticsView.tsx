import React, { useEffect, useState, useRef } from 'react';
import { Button } from '../components/Button';
import { Globe, Zap, Users, Server, ArrowUpRight } from 'lucide-react';

export const LiveAnalyticsView: React.FC = () => {
  const [txCount, setTxCount] = useState(14205);
  const [revenue, setRevenue] = useState(1245.50);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [recentTx, setRecentTx] = useState<{hash: string, amount: string, from: string, to: string}[]>([]);

  // Simulation for live counters
  useEffect(() => {
    const interval = setInterval(() => {
      setTxCount(prev => prev + Math.floor(Math.random() * 3));
      setRevenue(prev => prev + (Math.random() * 0.05));
      
      // Simulate new transaction log
      if (Math.random() > 0.5) {
         const newTx = {
            hash: `0x${Math.random().toString(16).substr(2, 6)}...${Math.random().toString(16).substr(2, 4)}`,
            amount: (Math.random() * 0.01).toFixed(4),
            from: `Agent-${Math.floor(Math.random() * 100)}`,
            to: `Agent-${Math.floor(Math.random() * 100)}`
         };
         setRecentTx(prev => [newTx, ...prev].slice(0, 6));
      }
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Canvas Animation for "Network Map"
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = canvas.parentElement?.clientWidth || 800;
    let height = canvas.height = 400;

    const nodes: {x: number, y: number, active: number}[] = [];
    for(let i=0; i<30; i++) {
        nodes.push({
            x: Math.random() * width, 
            y: Math.random() * height,
            active: 0
        });
    }

    const animate = () => {
        ctx.fillStyle = '#09090b'; // Clear with bg color
        ctx.fillRect(0,0,width,height);
        
        // Draw connections
        ctx.strokeStyle = 'rgba(57, 255, 20, 0.05)';
        ctx.beginPath();
        nodes.forEach((node, i) => {
            nodes.forEach((node2, j) => {
                if (i !== j) {
                    const dist = Math.hypot(node.x - node2.x, node.y - node2.y);
                    if (dist < 150) {
                        ctx.moveTo(node.x, node.y);
                        ctx.lineTo(node2.x, node2.y);
                    }
                }
            });
        });
        ctx.stroke();

        // Draw nodes
        nodes.forEach(node => {
            if (Math.random() > 0.98) node.active = 20; // Random activation
            
            ctx.beginPath();
            const radius = node.active > 0 ? 4 + (node.active/5) : 3;
            ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
            
            if (node.active > 0) {
                ctx.fillStyle = `rgba(57, 255, 20, ${node.active / 20})`;
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#39FF14';
                node.active--;
            } else {
                ctx.fillStyle = '#27272a';
                ctx.shadowBlur = 0;
            }
            
            ctx.fill();
        });

        requestAnimationFrame(animate);
    }
    const animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto p-6 animate-in fade-in duration-500">
      
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Globe className="text-neon" /> Network Pulse
        </h2>
        <p className="text-zinc-400">Real-time visualization of the PayPerPrompt Agentic Economy on Movement.</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
            <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Total Transactions</div>
            <div className="text-2xl font-mono font-bold text-white">{txCount.toLocaleString()}</div>
            <div className="text-[10px] text-neon mt-1 animate-pulse">● Live Updating</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
            <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Global Revenue</div>
            <div className="text-2xl font-mono font-bold text-white">{revenue.toFixed(4)} <span className="text-sm text-zinc-500">MOVE</span></div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
            <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Active Agents</div>
            <div className="text-2xl font-mono font-bold text-white">842</div>
            <div className="text-[10px] text-emerald-500 mt-1">↑ 12 New today</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
            <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Avg Finality</div>
            <div className="text-2xl font-mono font-bold text-neon">420<span className="text-sm">ms</span></div>
            <div className="text-[10px] text-zinc-500 mt-1">Movement Fast Finality</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Map Visualizer */}
        <div className="lg:col-span-2 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden relative h-[400px]">
            <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur px-3 py-1 rounded-full border border-zinc-800 text-xs text-zinc-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-neon animate-pulse"></span> Live Activity Map
            </div>
            <canvas ref={canvasRef} className="w-full h-full object-cover" />
        </div>

        {/* Live Ledger */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col h-[400px]">
            <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Server className="w-4 h-4 text-zinc-400" /> Live Ledger
                </h3>
            </div>
            <div className="flex-1 overflow-y-hidden p-2 space-y-2">
                {recentTx.map((tx, idx) => (
                    <div key={idx} className="p-3 bg-black/40 rounded-lg border border-zinc-800/50 animate-in slide-in-from-right duration-300">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-mono text-neon">{tx.amount} MOVE</span>
                            <span className="text-[10px] text-zinc-500">{tx.hash}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-300">
                            <span className="truncate max-w-[80px]">{tx.from}</span>
                            <span className="text-zinc-600">→</span>
                            <span className="truncate max-w-[80px]">{tx.to}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-3 border-t border-zinc-800 text-center">
                <Button variant="ghost" size="sm" className="w-full text-xs" icon={<ArrowUpRight className="w-3 h-3"/>}>
                    View on Explorer
                </Button>
            </div>
        </div>

      </div>
    </div>
  );
};