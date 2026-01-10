import { Agent, Transaction } from './types';

// API Configuration - Auto-switches between local and production
export const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? 'https://payperprompt-relay.onrender.com' // Production Render URL (update after deploy)
  : 'http://localhost:3000';

// Contract Configuration
export const CONTRACT_ADDRESS = '0xebbd28cf467283f883ea0d839cdd5d5baa33d8acb6466a65de8c2f52fdf6e684';
export const NETWORK = 'devnet';
export const APTOS_NODE_URL = 'https://fullnode.devnet.aptoslabs.com';
export const MOCK_AGENTS: Agent[] = [
  {
    id: 'agent-a',
    name: 'DevCore Alpha',
    role: 'Coder Agent',
    description: 'Expert in Move smart contracts, Rust, and secure blockchain architecture.',
    pricePerToken: 0.005,
    reputation: 98,
    tags: ['Coding', 'Security', 'Move'],
    imageUrl: 'https://picsum.photos/200/200?random=1',
    isOwned: true,
    totalEarnings: 124.50,
    activeStreams: 3,
    spendingCap: 50.0
  },
  {
    id: 'agent-b',
    name: 'DataSeeker V2',
    role: 'Research Agent',
    description: 'Real-time aggregator of blockchain standards and protocol updates.',
    pricePerToken: 0.002,
    reputation: 94,
    tags: ['Research', 'Data', 'Indexing'],
    imageUrl: 'https://picsum.photos/200/200?random=2',
    isOwned: false
  },
  {
    id: 'agent-c',
    name: 'PixelGen X',
    role: 'Design Agent',
    description: 'Generates UI components and assets optimized for Web3 dApps.',
    pricePerToken: 0.008,
    reputation: 89,
    tags: ['Design', 'UI/UX', 'Creative'],
    imageUrl: 'https://picsum.photos/200/200?random=3',
    isOwned: false
  },
  {
    id: 'agent-d',
    name: 'AuditShield',
    role: 'Security Agent',
    description: 'Automated vulnerability scanner for Move modules.',
    pricePerToken: 0.015,
    reputation: 99,
    tags: ['Audit', 'Security'],
    imageUrl: 'https://picsum.photos/200/200?random=4',
    isOwned: true,
    totalEarnings: 89.20,
    activeStreams: 0,
    spendingCap: 10.0
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    type: 'Prompt',
    amount: -0.05,
    timestamp: '2 mins ago',
    hash: '0x1a...4b2d',
    status: 'Completed',
    from: 'User',
    to: 'DevCore Alpha'
  },
  {
    id: 'tx-2',
    type: 'Agent-to-Agent',
    amount: -0.005,
    timestamp: '2 mins ago',
    hash: '0x8c...9e1f',
    status: 'Completed',
    from: 'DevCore Alpha',
    to: 'DataSeeker V2'
  },
  {
    id: 'tx-3',
    type: 'Top-up',
    amount: +10.00,
    timestamp: '1 day ago',
    hash: '0x3d...2a1c',
    status: 'Completed',
    from: 'Coinbase',
    to: 'Wallet'
  }
];

export const SCENARIO_PROMPT = "Please write a Move contract for a 15% fee splitter, but first, find the latest Move 2 standard syntax from DataSeeker V2.";