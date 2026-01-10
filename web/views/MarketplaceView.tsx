import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { Search, Filter, Star, Zap, Check, Info } from 'lucide-react';
import { Agent } from '../types';
import { API_URL, MOCK_AGENTS } from '../constants';

interface MarketplaceViewProps {
  onSelectAgent: (agent: Agent) => void;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({ onSelectAgent }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch(`${API_URL}/api/agents`);
        const data = await res.json();
        // Enrich agents with mock images if they don't have them
        const enriched = data.agents.map((a: any, i: number) => ({
          ...a,
          imageUrl: `https://picsum.photos/200/200?random=${i}`,
          description: a.description || "Autonomous agent specialized in Move smart contracts and x402 payments.",
          tags: a.tags || ['Move', 'x402', 'Defi'],
          isOwned: true
        }));
        setAgents(enriched);
      } catch (e) {
        console.error("Agents error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, []);

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFilter = () => {
    alert("Filter functionality active. Categories: AI, DeFi, Security.");
  };

  const handleAddToRoster = (agentName: string) => {
    alert(`${agentName} added to your personal roster!`);
  };

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neon border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 animate-in fade-in duration-500">
      <div className="mb-8 p-4 bg-gradient-to-r from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="flex items-start gap-3 relative z-10">
          <div className="bg-neon/10 p-2 rounded-lg">
            <Star className="w-5 h-5 text-neon" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">Recommended for You</h3>
            <p className="text-zinc-400 text-sm">Based on Movement network activity, we suggest <strong>DevCore Alpha</strong> for your next Move project.</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-xs"
            onClick={() => onSelectAgent(agents[0])}
          >
            Try Now <Zap className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">Agent Marketplace</h2>
          <p className="text-zinc-400">Discover and hire autonomous agents on the Movement network.</p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all"
            />
          </div>
          <Button variant="secondary" size="md" icon={<Filter className="w-4 h-4" />} onClick={handleFilter}>
            Filter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAgents.map((agent) => (
          <div
            key={agent.id}
            className="group relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-neon/50 hover:shadow-[0_0_20px_rgba(57,255,20,0.1)] transition-all duration-300 flex flex-col"
          >
            <div className="h-32 bg-gradient-to-br from-zinc-800 to-zinc-900 relative p-4 flex items-end">
              <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-2 py-1 rounded text-xs font-mono text-neon border border-neon/20">
                {agent.pricePerToken} MOVE/tok
              </div>
              <img
                src={agent.imageUrl}
                alt={agent.name}
                className="w-16 h-16 rounded-lg border-2 border-zinc-950 shadow-lg object-cover"
              />
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded text-[10px] text-zinc-300 border border-zinc-700">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                Live
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg text-white group-hover:text-neon transition-colors">
                    {agent.name}
                  </h3>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide font-mono">{agent.role || 'AI Agent'}</p>
                </div>
                <div className="flex items-center text-yellow-500 text-sm font-medium">
                  <Star className="w-3.5 h-3.5 fill-current mr-1" />
                  {agent.reputation}
                </div>
              </div>

              <p className="text-zinc-400 text-sm mb-4 line-clamp-2 flex-1">
                {agent.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                {agent.tags?.map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] border border-zinc-700">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-auto">
                <Button
                  variant="outline"
                  className="w-full border-neon/30 text-neon hover:bg-neon/5"
                  onClick={() => onSelectAgent(agent)}
                  icon={<Zap className="w-4 h-4" />}
                >
                  Open Terminal
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};