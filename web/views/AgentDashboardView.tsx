import React, { useState } from 'react';
import { Button } from '../components/Button';
import { MOCK_AGENTS } from '../constants';
import { Agent } from '../types';
import { Plus, Settings, DollarSign, Activity, Shield, Code, ChevronRight, CheckCircle2, Loader2, X } from 'lucide-react';

export const AgentDashboardView: React.FC = () => {
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState(0);

  const ownedAgents = MOCK_AGENTS.filter(a => a.isOwned);
  const totalEarnings = ownedAgents.reduce((acc, curr) => acc + (curr.totalEarnings || 0), 0);

  const handleDeploy = () => {
    setIsDeploying(true);
    setDeployStep(1);
    
    // Simulate deployment steps
    setTimeout(() => setDeployStep(2), 1500); // Compiling
    setTimeout(() => setDeployStep(3), 3000); // Deploying to Movement
    setTimeout(() => {
      setIsDeploying(false);
      setShowDeployModal(false);
      setDeployStep(0);
      alert("Agent Successfully Deployed to Movement Network!");
    }, 4500);
  };

  const handleOpenLogs = (agentName: string) => {
    alert(`Viewing server-side execution logs for ${agentName}...`);
  }

  const handleConfig = (agentName: string) => {
    alert(`Opening Fee & Spending Cap configuration for ${agentName}...`);
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">Agent Studio</h2>
          <p className="text-zinc-400">Build, deploy, and monetize your autonomous agents.</p>
        </div>
        <Button 
          variant="primary" 
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setShowDeployModal(true)}
        >
          Deploy New Agent
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <DollarSign className="w-32 h-32 text-neon" />
          </div>
          <p className="text-zinc-500 text-sm font-medium mb-1">Total Lifetime Earnings</p>
          <h3 className="text-4xl font-bold text-white">{totalEarnings.toFixed(2)} <span className="text-neon text-lg">MOVE</span></h3>
          <div className="mt-2 text-xs text-emerald-400 flex items-center">
            <Activity className="w-3 h-3 mr-1" /> +14% this week
          </div>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
          <p className="text-zinc-500 text-sm font-medium mb-1">Active Instances</p>
          <h3 className="text-4xl font-bold text-white">{ownedAgents.length}</h3>
          <div className="mt-2 text-xs text-zinc-400">Across 142 active user sessions</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
          <p className="text-zinc-500 text-sm font-medium mb-1">Avg. API Latency</p>
          <h3 className="text-4xl font-bold text-white">124 <span className="text-zinc-500 text-lg">ms</span></h3>
          <div className="mt-2 text-xs text-neon">Optimized for Real-time</div>
        </div>
      </div>

      {/* Agent List */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-zinc-800">
          <h3 className="text-xl font-bold text-white">My Deployed Agents</h3>
        </div>
        
        <div className="divide-y divide-zinc-800">
          {ownedAgents.map((agent) => (
            <div key={agent.id} className="p-6 flex flex-col md:flex-row items-center gap-6 hover:bg-zinc-800/30 transition-colors">
              <img 
                src={agent.imageUrl} 
                alt={agent.name} 
                className="w-16 h-16 rounded-xl border border-zinc-700 object-cover"
              />
              
              <div className="flex-1 w-full md:w-auto text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                  <h4 className="font-bold text-lg text-white">{agent.name}</h4>
                  <span className="px-2 py-0.5 rounded-full bg-neon/10 text-neon text-[10px] font-mono border border-neon/20">
                    Active
                  </span>
                </div>
                <p className="text-sm text-zinc-400 line-clamp-1">{agent.description}</p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3 text-xs font-mono text-zinc-500">
                  <span className="flex items-center"><DollarSign className="w-3 h-3 mr-1" /> {agent.pricePerToken} MOVE/tok</span>
                  <span className="flex items-center"><Activity className="w-3 h-3 mr-1" /> {agent.activeStreams || 0} active streams</span>
                  <span className="flex items-center text-zinc-300"><Shield className="w-3 h-3 mr-1 text-emerald-500" /> Cap: {agent.spendingCap} MOVE</span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  icon={<Code className="w-4 h-4" />}
                  onClick={() => handleOpenLogs(agent.name)}
                >
                  Logs
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  icon={<Settings className="w-4 h-4" />}
                  onClick={() => handleConfig(agent.name)}
                >
                  Config
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deploy Modal Overlay */}
      {showDeployModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Code className="text-neon" /> Register New Agent
              </h3>
              <button 
                onClick={() => !isDeploying && setShowDeployModal(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8">
              {!isDeploying ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400">Agent Name</label>
                      <input type="text" className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:border-neon focus:ring-1 focus:ring-neon outline-none" placeholder="e.g. FinanceWizard V1" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400">Role / Tag</label>
                      <select className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2.5 text-white outline-none">
                        <option>General Assistant</option>
                        <option>Coder</option>
                        <option>Researcher</option>
                        <option>DeFi Executer</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Description</label>
                    <textarea className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:border-neon outline-none h-24 resize-none" placeholder="Describe what your agent does..." />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400">Price per Token (MOVE)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                        <input type="number" className="w-full bg-black border border-zinc-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-neon outline-none" placeholder="0.005" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400 flex items-center gap-1">
                        Max Spending Cap <Shield className="w-3 h-3 text-emerald-500" />
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                        <input type="number" className="w-full bg-black border border-zinc-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-neon outline-none" placeholder="50.00 (Safety Limit)" />
                      </div>
                      <p className="text-[10px] text-zinc-500">Max amount this agent can pay other agents autonomously.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">API Endpoint (LLM Hook)</label>
                    <input type="text" className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:border-neon outline-none" placeholder="https://api.your-agent.com/v1/webhook" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 space-y-8">
                  {/* Deployment Steps Visualization */}
                  <div className="w-full max-w-sm space-y-4">
                    <div className={`flex items-center gap-4 ${deployStep >= 1 ? 'opacity-100' : 'opacity-30'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${deployStep > 1 ? 'bg-neon border-neon text-black' : 'border-neon text-neon'}`}>
                         {deployStep > 1 ? <CheckCircle2 className="w-5 h-5" /> : <Loader2 className="w-5 h-5 animate-spin" />}
                      </div>
                      <span className="font-mono text-sm">Compiling Move Contract...</span>
                    </div>
                    
                    <div className={`flex items-center gap-4 ${deployStep >= 2 ? 'opacity-100' : 'opacity-30'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${deployStep > 2 ? 'bg-neon border-neon text-black' : 'border-neon text-neon'}`}>
                         {deployStep > 2 ? <CheckCircle2 className="w-5 h-5" /> : (deployStep === 2 ? <Loader2 className="w-5 h-5 animate-spin" /> : <div className="w-2 h-2 rounded-full bg-current" />)}
                      </div>
                      <span className="font-mono text-sm">Verifying with AgentRegistry...</span>
                    </div>

                    <div className={`flex items-center gap-4 ${deployStep >= 3 ? 'opacity-100' : 'opacity-30'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${deployStep > 3 ? 'bg-neon border-neon text-black' : 'border-neon text-neon'}`}>
                         {deployStep > 3 ? <CheckCircle2 className="w-5 h-5" /> : (deployStep === 3 ? <Loader2 className="w-5 h-5 animate-spin" /> : <div className="w-2 h-2 rounded-full bg-current" />)}
                      </div>
                      <span className="font-mono text-sm">Deploying to Movement Testnet...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-zinc-800 bg-zinc-950 flex justify-end gap-3">
              {!isDeploying && (
                <>
                  <Button variant="ghost" onClick={() => setShowDeployModal(false)}>Cancel</Button>
                  <Button variant="primary" onClick={handleDeploy}>Register Agent</Button>
                </>
              )}
              {isDeploying && (
                <div className="text-xs text-zinc-500 font-mono animate-pulse">
                  Interacting with blockchain...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};