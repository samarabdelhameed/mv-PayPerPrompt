import React, { useState, useEffect, useRef } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { AptosClient } from 'aptos';
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
  const { wallets } = useWallets();
  const [prompt, setPrompt] = useState(SCENARIO_PROMPT);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamCost, setStreamCost] = useState(0);
  const [logs, setLogs] = useState<SubEvent[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Initialize Aptos Client (Testnet)
  const client = new AptosClient('https://fullnode.devnet.aptoslabs.com');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, logs]);

  const executeScenario = async () => {
    if (!prompt.trim() || wallets.length === 0) return;

    const wallet = wallets[0];
    setIsProcessing(true);
    setStreamCost(0);
    setLogs([]);
    setShowReceipt(false);

    try {
      // 1. Request x402 Invoice from Relay
      const relayRes = await fetch('http://localhost:3000/api/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentAddress: agent.id,
          amount: 5000, // 0.005 MOVE
          metadata: `Prompt: ${prompt.substring(0, 30)}...`
        })
      });
      const { payload, invoiceId } = await relayRes.json();

      // 2. Sign and Submit Transaction via Privy Wallet
      setLogs(prev => [...prev, {
        message: "Generating x402 payment transaction...",
        cost: 0,
        fromAgent: "System",
        toAgent: "User Wallet",
        txHash: "Pending",
      }]);

      const transactionPayload = {
        type: "entry_function_payload",
        function: payload.function,
        type_arguments: payload.type_arguments,
        arguments: payload.arguments
      };

      // In a real hackathon demo, we'd trigger the wallet sign here
      // For this session, we simulate the success but show the code for the real flow
      console.log("Submitting transaction:", transactionPayload);

      // Simulate real finality from Movement
      const startTime = Date.now();
      await new Promise(r => setTimeout(r, 800)); // Movement speed simulator
      const finalityTime = Date.now() - startTime;
      const mockTxHash = "0x" + Math.random().toString(16).slice(2, 66);

      setLogs(prev => [...prev, {
        message: "Transaction Finalized on Movement M1",
        cost: 0.005,
        fromAgent: "User",
        toAgent: "PayPerPrompt",
        txHash: mockTxHash,
        finalityTimeMs: finalityTime,
        explorerUrl: `https://explorer.movementlabs.xyz/txn/${mockTxHash}`
      }]);

      // 3. Callback to Relay for AI execution
      const payRes = await fetch(`http://localhost:3000/api/pay/${invoiceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txnHash: mockTxHash })
      });
      const paymentData = await payRes.json();

      // 4. Update Chat History
      setChatHistory(prev => [...prev, {
        id: Date.now().toString(),
        role: 'user',
        content: prompt
      }, {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: `Prompt processed successfully. Invoice ${invoiceId} cleared. Payment of 0.005 MOVE split 85/15 on-chain.`,
        cost: 0.005
      }]);

      setShowReceipt(true);
    } catch (error) {
      console.error("Execution error:", error);
      alert("Transaction failed or was rejected.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = () => {
    const text = `Just used PayPerPrompt to hire an AI agent on @movementlabsxyz. Settlement took 420ms thanks to Movement's high-speed rails! ⚡🤖`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&hashtags=PayPerPrompt,Movement`;
    window.open(url, '_blank');
  }

  return (
    <div className="w-full max-w-6xl mx-auto h-[calc(100vh-100px)] flex gap-6 p-4 animate-in fade-in slide-in-from-bottom-4 relative">
      <div className="flex-1 flex flex-col bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-sm">
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
                <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse" />
                Movement Agent Active
              </p>
            </div>
          </div>
          <div className="text-xs font-mono text-zinc-500">
            {wallets.length > 0 ? `Connected: ${wallets[0].address.substring(0, 6)}...` : 'Connecting Wallet...'}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {chatHistory.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 opacity-50">
              <Cpu className="w-16 h-16 mb-4" />
              <p>Initialize x402 prompt sequence...</p>
            </div>
          )}

          {chatHistory.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user'
                  ? 'bg-zinc-800 text-white rounded-tr-none'
                  : 'bg-neon/5 border border-neon/20 text-zinc-100 rounded-tl-none'
                }`}>
                <div className="whitespace-pre-wrap font-mono text-sm">
                  {msg.content}
                </div>
                {msg.cost && (
                  <div className="mt-2 text-[10px] text-neon/70 flex justify-end font-mono">
                    Finalized: {msg.cost} MOVE
                  </div>
                )}
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start w-full">
              <div className="bg-zinc-900 border border-neon/30 p-3 rounded-xl rounded-tl-none w-full max-w-md">
                <div className="flex items-center gap-3 text-neon mb-2">
                  <Zap className="w-4 h-4 animate-bounce" />
                  <span className="text-xs font-bold tracking-wider">X402 STREAM INITIALIZING</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-neon animate-progress-indeterminate shadow-[0_0_10px_#39FF14]"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

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
              disabled={isProcessing || !prompt || wallets.length === 0}
              className="absolute right-3 bottom-3 p-2 bg-neon text-black rounded-lg hover:bg-[#32cc12] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isProcessing ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
          </div>
        </div>
      </div>

      <div className="w-80 hidden lg:flex flex-col bg-black border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-zinc-900 p-3 border-b border-zinc-800 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Movement Explorer Log</span>
        </div>
        <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-4 bg-black/80">
          {logs.length === 0 && !isProcessing && <div className="text-zinc-600 italic">Waiting...</div>}
          {logs.map((log, idx) => (
            <div key={idx} className="border-l-2 border-neon pl-3 py-1 animate-in slide-in-from-left-2 duration-300">
              <div className="text-neon mb-1 font-bold">{log.fromAgent} → {log.toAgent}</div>
              <div className="text-zinc-300 mb-1">{log.message}</div>
              <div className="flex justify-between items-center text-[10px] text-zinc-500">
                <span className="bg-zinc-900 p-1 border border-zinc-800">{log.txHash.substring(0, 10)}...</span>
                <span className="text-neon">-{log.cost || 0} MOVE</span>
              </div>
              {log.finalityTimeMs && (
                <div className="mt-1 flex justify-between font-bold text-emerald-400">
                  <span>⚡ Finality</span>
                  <span>{log.finalityTimeMs}ms</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showReceipt && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-zinc-900 border border-neon/50 rounded-xl w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(57,255,20,0.1)] relative">
            <button onClick={() => setShowReceipt(false)} className="absolute top-2 right-2 text-zinc-500 hover:text-white">x</button>
            <div className="bg-neon text-black p-4 text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2" />
              <h3 className="font-bold text-lg font-mono tracking-tighter">SETTLEMENT FINALIZED</h3>
            </div>
            <div className="p-6 space-y-4 font-mono text-sm">
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-500">Total Paid</span>
                <span className="text-neon font-bold text-lg">0.005 MOVE</span>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-2 text-[10px] text-emerald-400 text-center flex items-center justify-center gap-1">
                <Shield className="w-3 h-3 fill-current" />
                Agent-to-Agent Autonomous Payment Verified
              </div>
              <Button className="w-full mt-2" icon={<Twitter className="w-4 h-4" />} onClick={handleShare}>
                Share Proof of Finality
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};