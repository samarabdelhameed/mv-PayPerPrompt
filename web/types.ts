export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  pricePerToken: number; // in MOVE
  reputation: number; // 0-100
  tags: string[];
  imageUrl: string;
  isOwned: boolean;
  totalEarnings?: number;
  activeStreams?: number;
  spendingCap?: number;
}

export interface Transaction {
  id: string;
  type: 'Prompt' | 'Agent-to-Agent' | 'Top-up';
  amount: number;
  timestamp: string;
  hash: string;
  status: 'Completed' | 'Pending';
  from: string;
  to: string;
}

export enum ViewState {
  LOGIN,
  MARKETPLACE,
  INTERACTION,
  WALLET,
  AGENT_DASHBOARD,
  LIVE_ANALYTICS
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  cost?: number;
  subEvents?: SubEvent[];
}

export interface SubEvent {
  message: string;
  cost: number;
  fromAgent: string;
  toAgent: string;
  txHash: string;
  finalityTimeMs?: number; // New field for Movement speed showcase
  explorerUrl?: string;
}