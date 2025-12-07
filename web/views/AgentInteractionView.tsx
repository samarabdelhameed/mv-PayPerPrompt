import React, { useState, useEffect, useRef } from 'react';
import { Agent, ChatMessage, SubEvent } from '../types';
import { SCENARIO_PROMPT } from '../constants';
import { Button } from '../components/Button';
import { Send, Terminal, Cpu, ArrowRight, Zap, Play, ExternalLink, Bolt, Share2, CheckCircle, Copy, Shield, Twitter } from 'lucide-react';

interface AgentInteractionViewProps {
  agent: Agent;
  onBack: () => void;
  updateBalance: (amount: number) => void;
}

export const AgentInteractionView: React.FC<AgentInteractionViewProps> = ({ agent, onBack, updateBalance }) => {
  const [prompt, setPrompt] = useState(SCENARIO_PROMPT);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamCost, setStreamCost] = useState(0);
  const [logs, setLogs] = useState<SubEvent[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, logs]);

  const executeScenario = async () => {
    if (!prompt.trim()) return;
    
    setIsProcessing(true);
    setStreamCost(0);
    setLogs([]);
    setShowReceipt(false);
    
    // Add User Message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt
    };
    setChatHistory(prev => [...prev, userMsg]);

    // SCENARIO SIMULATION
    // 1. Initial Processing
    await new Promise(r => setTimeout(r, 800));
    setStreamCost(0.0001);
    
    // 2. Detect Need for Sub-Agent
    const finality1 = Math.floor(Math.random() * (600 - 350) + 350); // Random ms between 350-600
    const subEvent1: SubEvent = {
      message: "Analyzing request... dependency detected.",
      cost: 0.0002,
      fromAgent: agent.name,
      toAgent: "System",
      txHash: "0x12...ab89",
      finalityTimeMs: finality1,
      explorerUrl: "https://explorer.movementlabs.xyz/txn/0x12...ab89"
    };
    setLogs(prev => [...prev, subEvent1]);
    updateBalance(-0.0002);
    setStreamCost(0.0002);
    await new Promise(r => setTimeout(r, 1000));

    // 3. Agent A pays Agent B (Killer Feature)
    const finality2 = Math.floor(Math.random() * (600 - 350) + 350);
    const subEvent2: SubEvent = {
      message: `Requesting data from DataSeeker V2`,
      cost: 0.002,
      fromAgent: agent.name,
      toAgent: "DataSeeker V2",
      txHash: "0x88...ff22", // Agent to Agent TX
      finalityTimeMs: finality2,
      explorerUrl: "https://explorer.movementlabs.xyz/txn/0x88...ff22"
    };
    setLogs(prev => [...prev, subEvent2]);
    updateBalance(-0.002); // User pays for this indirectly
    setStreamCost(0.0022);
    await new Promise(r => setTimeout(r, 1500));

    // 4. Data Received
    const finality3 = Math.floor(Math.random() * (600 - 350) + 350);
    const subEvent3: SubEvent = {
      message: "Data received: Move 2.0 FeeSplitter Standard.",
      cost: 0.0001,
      fromAgent: "DataSeeker V2",
      toAgent: agent.name,
      txHash: "0x77...ee11",
      finalityTimeMs: finality3,
      explorerUrl: "https://explorer.movementlabs.xyz/txn/0x77...ee11"
    };
    setLogs(prev => [...prev, subEvent3]);
    await new Promise(r => setTimeout(r, 800));

    // 5. Final Generation
    setStreamCost(0.0045);
    updateBalance(-0.0023); // Final chunk
    
    const agentResponse: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'agent',
      content: `Here is the Move 2.0 contract based on the latest standards fetched from DataSeeker V2:\n\n\`\`\`move\nmodule addr::fee_splitter {\n    use std::signer;\n    use aptos_framework::coin;\n\n    struct Config has key {\n        fee_percentage: u64, // 15%\n        admin: address\n    }\n\n    public entry fun split_payment<CoinType>(account: &signer, amount: u64) acquires Config {\n        // Implementation verified against standard registry\n    }\n}\n\`\`\``,
      cost: 0.0045
    };
    
    setChatHistory(prev => [...prev, agentResponse]);
    setIsProcessing(false);
    
    // Show receipt after a small delay
    setTimeout(() => setShowReceipt(true), 1500);
  };

  const handleShare = () => {
    const text = `Just paid ${streamCost.toFixed(4)} MOVE for an AI agent to execute a task in 420ms on @movementlabsxyz. The Agentic Economy is here. ⚡🤖`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&hashtags=PayPerPrompt,Movement`;
    window.open(url, '_blank');
  }

  return (
    <div className="w-full max-w-6xl mx-auto h-[calc(100vh-100px)] flex gap-6 p-4 animate-in fade-in slide-in-from-bottom-4 relative">
      
      {/* Left Column: Chat Area */}
      <div className="flex-1 flex flex-col bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-sm">
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-zinc-500 hover:text-white transition-colors">
              <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-zinc-700">
              <img src={agent.imageUrl} alt={agent.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-bold text-white leading-tight">{agent.name}</h3>
              <p className="text-xs text-neon flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse"/>
                Online & Ready
              </p>
            </div>
          </div>
          <div className="text-xs font-mono text-zinc-500">
            x402 Relay Active
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {chatHistory.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 opacity-50">
              <Cpu className="w-16 h-16 mb-4" />
              <p>Initialize prompt sequence...</p>
            </div>
          )}
          
          {chatHistory.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-zinc-800 text-white rounded-tr-none' 
                  : 'bg-neon/5 border border-neon/20 text-zinc-100 rounded-tl-none'
              }`}>
                <div className="whitespace-pre-wrap font-mono text-sm">
                  {msg.content}
                </div>
                {msg.cost && (
                   <div className="mt-2 text-[10px] text-neon/70 flex justify-end font-mono">
                     Total Cost: {msg.cost} MOVE
                   </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Active Payment Stream Animation */}
          {isProcessing && (
             <div className="flex justify-start w-full">
               <div className="bg-zinc-900 border border-neon/30 p-3 rounded-xl rounded-tl-none w-full max-w-md">
                 <div className="flex items-center gap-3 text-neon mb-2">
                   <Zap className="w-4 h-4 animate-bounce" />
                   <span className="text-xs font-bold tracking-wider">PAYMENT STREAM ACTIVE</span>
                 </div>
                 {/* The Stream Visual */}
                 <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                   <div className="h-full bg-neon animate-progress-indeterminate shadow-[0_0_10px_#39FF14]"></div>
                 </div>
                 <div className="flex justify-between mt-1 text-[10px] font-mono text-zinc-400">
                    <span>Rate: {agent.pricePerToken} MOVE/tok</span>
                    <span className="text-neon">{streamCost.toFixed(4)} MOVE</span>
                 </div>
               </div>
             </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-zinc-900 border-t border-zinc-800">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-4 pr-12 text-sm text-zinc-200 focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon resize-none h-24 font-mono"
              placeholder="Enter your prompt for the agent..."
              disabled={isProcessing}
            />
            <button 
              onClick={executeScenario}
              disabled={isProcessing || !prompt}
              className="absolute right-3 bottom-3 p-2 bg-neon text-black rounded-lg hover:bg-[#32cc12] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isProcessing ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"/> : <Play className="w-4 h-4 fill-current" />}
            </button>
          </div>
          <div className="mt-2 flex justify-between text-xs text-zinc-500 font-mono">
            <span>Est. Cost: 0.005 MOVE / 100 tokens</span>
            <span>Balance: Safe</span>
          </div>
        </div>
      </div>

      {/* Right Column: The "Under the Hood" Terminal */}
      <div className="w-80 hidden lg:flex flex-col bg-black border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-zinc-900 p-3 border-b border-zinc-800 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Movement Log</span>
        </div>
        <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-4 bg-black/80">
          {logs.length === 0 && !isProcessing && (
            <div className="text-zinc-600 italic">Waiting for execution...</div>
          )}
          
          {logs.map((log, idx) => (
            <div key={idx} className="border-l-2 border-neon pl-3 py-1 animate-in slide-in-from-left-2 duration-300">
              <div className="text-neon mb-1 font-bold">
                {log.fromAgent} <span className="text-zinc-500">→</span> {log.toAgent}
              </div>
              <div className="text-zinc-300 mb-1">{log.message}</div>
              
              <div className="flex flex-col gap-1 mt-2">
                <div className="flex justify-between items-center text-[10px] text-zinc-500">
                  <span className="bg-zinc-900 px-1 rounded border border-zinc-800 text-zinc-400 truncate max-w-[120px]">
                    Tx: {log.txHash}
                  </span>
                  <span className="text-neon">-{log.cost} MOVE</span>
                </div>

                {/* FINALITY AND EXPLORER SECTION */}
                <div className="flex justify-between items-center text-[10px]">
                   {log.finalityTimeMs && (
                      <span className="flex items-center text-emerald-400 font-bold animate-pulse-fast">
                        <Bolt className="w-3 h-3 mr-0.5 fill-current" />
                        {log.finalityTimeMs}ms Finality
                      </span>
                   )}
                   <a 
                     href={log.explorerUrl || '#'} 
                     target="_blank" 
                     rel="noreferrer"
                     className="flex items-center text-zinc-500 hover:text-white transition-colors"
                     title="View on Movement Explorer"
                   >
                     View Explorer <ExternalLink className="w-3 h-3 ml-1" />
                   </a>
                </div>
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="text-neon animate-pulse">_</div>
          )}
        </div>
      </div>

      {/* PROOF OF PAYMENT MODAL (Viral Loop) */}
      {showReceipt && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-zinc-900 border border-neon/50 rounded-xl w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(57,255,20,0.1)] relative">
            <button onClick={() => setShowReceipt(false)} className="absolute top-2 right-2 text-zinc-500 hover:text-white">x</button>
            
            {/* Header */}
            <div className="bg-neon text-black p-4 text-center">
               <CheckCircle className="w-8 h-8 mx-auto mb-2" />
               <h3 className="font-bold text-lg font-mono tracking-tighter">PAYMENT CERTIFIED</h3>
            </div>

            {/* Receipt Body */}
            <div className="p-6 space-y-4 font-mono text-sm relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5 pointer-events-none" 
                     style={{backgroundImage: 'radial-gradient(#39FF14 1px, transparent 1px)', backgroundSize: '10px 10px'}}></div>

                <div className="flex justify-between border-b border-zinc-800 pb-2">
                    <span className="text-zinc-500">Total Paid</span>
                    <span className="text-neon font-bold text-lg">{streamCost.toFixed(4)} MOVE</span>
                </div>
                
                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-zinc-500">Primary Agent</span>
                        <span className="text-white">{agent.name}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-zinc-500">Sub-Agent</span>
                        <span className="text-white">DataSeeker V2</span>
                    </div>
                    
                    {/* REQUEST #2: AUTONOMOUS BADGE */}
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-2 text-[10px] text-emerald-400 text-center flex items-center justify-center gap-1">
                        <Shield className="w-3 h-3 fill-current" />
                        Autonomous Agent-to-Agent Payment Verified
                    </div>
                    <div className="text-[10px] text-zinc-600 text-center">
                        No human approval required for this tx.
                    </div>

                    <div className="flex justify-between text-xs pt-2">
                        <span className="text-zinc-500">Network Fee</span>
                        <span className="text-white">0.000001 MOVE</span>
                    </div>
                </div>

                <div className="bg-black p-2 rounded border border-zinc-800 text-[10px] text-zinc-500 break-all text-center">
                    0x82...77a1 (Finalized in 420ms)
                </div>

                {/* REQUEST #1: VIRAL SHARE BUTTON */}
                <Button className="w-full mt-2" icon={<Twitter className="w-4 h-4" />} onClick={handleShare}>
                    Share Proof on X
                </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};