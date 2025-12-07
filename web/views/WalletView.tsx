import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MOCK_TRANSACTIONS } from '../constants';
import { Button } from '../components/Button';
import { ArrowUpRight, ArrowDownLeft, Wallet as WalletIcon, ExternalLink, Download } from 'lucide-react';

const areaData = [
  { name: 'Mon', spend: 0.05 },
  { name: 'Tue', spend: 0.12 },
  { name: 'Wed', spend: 0.08 },
  { name: 'Thu', spend: 0.25 },
  { name: 'Fri', spend: 0.15 },
  { name: 'Sat', spend: 0.02 },
  { name: 'Sun', spend: 0.18 },
];

const pieData = [
  { name: 'Code', value: 65, color: '#39FF14' },
  { name: 'Research', value: 25, color: '#10B981' },
  { name: 'Design', value: 10, color: '#065F46' },
];

export const WalletView: React.FC = () => {

  const handleTopUp = () => {
    alert("Opening Privy On-Ramp... (Simulated)");
  };

  const handleWithdraw = () => {
    alert("Initiating withdrawal to your connected wallet... (Simulated)");
  };

  const handleExport = () => {
    alert("Exporting CSV report of your agent interactions...");
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white">Asset Management</h2>
        <Button variant="ghost" size="sm" icon={<Download className="w-4 h-4"/>} onClick={handleExport}>Export CSV</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Balance Card */}
        <div className="col-span-1 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <WalletIcon className="w-24 h-24 text-neon" />
          </div>
          <p className="text-zinc-400 text-sm mb-1">Total Balance</p>
          <h3 className="text-4xl font-bold text-white mb-4">5.427 <span className="text-neon text-lg">MOVE</span></h3>
          <div className="flex gap-2">
            <Button size="sm" variant="primary" className="flex-1" onClick={handleTopUp}>Top Up</Button>
            <Button size="sm" variant="secondary" className="flex-1" onClick={handleWithdraw}>Withdraw</Button>
          </div>
        </div>

        {/* Chart Card */}
        <div className="col-span-1 md:col-span-2 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-4">
            <div>
               <h4 className="font-bold text-zinc-200">Agent Spending (7 Days)</h4>
               <span className="text-xs text-neon">+12% activity</span>
            </div>
            <div className="flex items-center gap-4">
               {/* Mini Pie Legend */}
               <div className="flex gap-2 text-[10px] text-zinc-400">
                 <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-neon mr-1"></div> Code</span>
                 <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-emerald-500 mr-1"></div> Research</span>
               </div>
            </div>
          </div>
          <div className="flex gap-4 h-32 w-full">
            <div className="flex-1 h-full">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={areaData}>
                   <defs>
                     <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#39FF14" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#39FF14" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', borderRadius: '8px' }}
                     itemStyle={{ color: '#39FF14' }}
                   />
                   <Area type="monotone" dataKey="spend" stroke="#39FF14" fillOpacity={1} fill="url(#colorSpend)" strokeWidth={2} />
                 </AreaChart>
               </ResponsiveContainer>
            </div>
            {/* Simple Pie Chart for Category Distribution */}
            <div className="w-32 h-full hidden sm:block">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={40}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                     contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', borderRadius: '8px', fontSize: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <h4 className="font-bold text-zinc-200">Recent Transactions</h4>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs" 
            onClick={() => window.open('https://explorer.movementlabs.xyz/', '_blank')}
          >
            View Explorer <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        </div>
        <div className="divide-y divide-zinc-800">
          {MOCK_TRANSACTIONS.map((tx) => (
            <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  tx.amount > 0 ? 'bg-emerald-900/30 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {tx.amount > 0 ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{tx.type}</div>
                  <div className="text-xs text-zinc-500 font-mono">{tx.timestamp} • {tx.hash}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-mono font-medium ${tx.amount > 0 ? 'text-emerald-400' : 'text-zinc-200'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount} MOVE
                </div>
                <div className="text-xs text-zinc-500">
                  {tx.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};