# PayPerPrompt

A decentralized AI payment infrastructure built on Move 2, implementing the x402 payment standard for seamless AI agent monetization.

## 🏗️ Architecture

- **contract/**: Move 2 smart contracts (agent registry, payment splitting, fee management, x402 invoice handling)
- **web/**: Web 2.5 user interface (React + TypeScript + Vite)
- **relay/**: AI-to-blockchain gateway with x402 routing
- **analytics/**: Real-time indexing and metrics dashboard
- **mobile/**: Telegram bot and PWA for mobile-first adoption
- **audit/**: Security documentation and risk mitigation
- **monitoring/**: Uptime monitoring and health checks
- **docs/**: Architecture diagrams and workflow documentation

## ✨ Key Features

- **Agent Registry**: Entity registration with reputation tracking
- **Payment Splitting**: Automated 85/15 revenue distribution
- **x402 Standard**: Full invoice handling implementation
- **Rate Limiting**: Spam protection and abuse prevention
- **Live Analytics**: Real-time metrics and event indexing

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Aptos CLI (for smart contract deployment)
- Python 3 (for Aptos CLI installation)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd PayPerPrompt
```

2. **Install dependencies for all components**
```bash
# Install Relay Server dependencies
cd relay && npm install && cd ..

# Install Web Interface dependencies
cd web && npm install && cd ..

# Install Analytics dependencies
cd analytics && npm install && cd ..

# Install Telegram Bot dependencies
cd mobile/telegram_bot && npm install && cd ..
```

3. **Install Aptos CLI** (for smart contracts)
```bash
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3
```

### Configuration

1. **Setup Relay Server environment**
```bash
cd relay
cp .env.example .env
# Edit .env with your configuration:
# - APTOS_NODE_URL
# - CONTRACT_ADDRESS
# - PLATFORM_ADDRESS
```

2. **Setup Telegram Bot** (optional)
```bash
cd mobile/telegram_bot
cp .env.example .env
# Add your TELEGRAM_BOT_TOKEN
```

### Running the Project

#### Option 1: Start All Services at Once
```bash
./START_ALL.sh
```

#### Option 2: Start Services Individually

**1. Deploy Smart Contracts**
```bash
cd contract
aptos move compile
aptos move test
./scripts/verify_all.sh
# Deploy to testnet/mainnet
aptos move publish --package-dir .
```

**2. Start Relay Server**
```bash
cd relay
npm start
# Server runs on http://localhost:3000
```

**3. Start Web Interface**
```bash
cd web
npm run dev
# Interface runs on http://localhost:5173
```

**4. Start Analytics Indexer**
```bash
cd analytics
npm start
# Indexer starts monitoring blockchain events
```

**5. Start Telegram Bot** (optional)
```bash
cd mobile/telegram_bot
npm start
```

## 📡 API Endpoints

### Relay Server (Port 3000)

- `GET /health` - Health check
- `POST /api/invoice` - Create x402 invoice
- `POST /api/pay/:invoiceId` - Process payment
- `GET /api/agents` - List registered agents
- `GET /api/metrics` - Get platform metrics

### Web Interface (Port 5173)

- Dashboard for agent discovery
- Wallet connection (Aptos)
- Payment processing UI
- Analytics visualization

## 🧪 Testing

Run all tests:
```bash
./TEST_ALL.sh
```

Or test individual components:
```bash
# Test smart contracts
cd contract && aptos move test

# Test relay server
cd relay && npm test

# Test web build
cd web && npm run build
```

## 📊 Project Structure

```
PayPerPrompt/
├── contract/              # Move 2 Smart Contracts
│   ├── sources/
│   │   ├── AgentRegistry.move
│   │   ├── PaymentSplitter.move
│   │   ├── FeeManager.move
│   │   └── X402InvoiceHandler.move
│   ├── tests/
│   └── scripts/
├── relay/                 # Backend Gateway
│   └── src/
│       ├── x402Router.js
│       ├── AgentAPI.js
│       ├── rate_limiter.ts
│       └── abuse_protection.ts
├── web/                   # Frontend Interface
│   └── src/
│       ├── App.tsx
│       └── main.tsx
├── analytics/             # Event Indexing
│   ├── indexer.ts
│   └── dashboard/
├── mobile/
│   ├── telegram_bot/      # Telegram Integration
│   └── pwa/               # Progressive Web App
├── audit/                 # Security Documentation
├── monitoring/            # Uptime Monitoring
└── docs/                  # Architecture Docs
```

## 🔐 Security

- Rate limiting: 100 requests/minute per IP
- Spending caps: Daily limits per user
- Abuse protection: Auto-blocking after 5 failed attempts
- Smart contract auditing recommended before mainnet

See [AUDIT.md](audit/AUDIT.md) for detailed security documentation.

## 🛠️ Development

### Build for Production

```bash
# Build web interface
cd web && npm run build

# Compile contracts
cd contract && aptos move compile

# Build relay (if using TypeScript)
cd relay && npx tsc
```

### Environment Variables

**Relay Server** (`relay/.env`):
```env
APTOS_NODE_URL=https://fullnode.devnet.aptoslabs.com
CONTRACT_ADDRESS=0x1
PLATFORM_ADDRESS=0x2
PORT=3000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

**Telegram Bot** (`mobile/telegram_bot/.env`):
```env
TELEGRAM_BOT_TOKEN=your_token_here
RELAY_URL=http://localhost:3000
```

## 📈 Monitoring

- **Health Check**: `curl http://localhost:3000/health`
- **Metrics**: `curl http://localhost:3000/api/metrics`
- **Analytics Dashboard**: Open `analytics/dashboard/index.html`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT

## 🔗 Links

- [Architecture Documentation](docs/Architecture.md)
- [Security Audit](audit/AUDIT.md)
- [Setup Status](SETUP_STATUS.md)

## 💡 Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ for the decentralized AI economy
