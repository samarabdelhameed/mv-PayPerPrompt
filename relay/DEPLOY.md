# PayPerPrompt Relay Server

AI-to-Blockchain Gateway for PayPerPrompt x402 Protocol

## Quick Deploy

### Deploy to Render (Recommended - Free)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/samarabdelhameed/mv-PayPerPrompt)

### Deploy to Railway
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/payperprompt)

## Manual Deployment

### Prerequisites
- Node.js 18+
- npm

### Environment Variables
```env
APTOS_NODE_URL=https://fullnode.devnet.aptoslabs.com
CONTRACT_ADDRESS=0xebbd28cf467283f883ea0d839cdd5d5baa33d8acb6466a65de8c2f52fdf6e684
PLATFORM_ADDRESS=0xebbd28cf467283f883ea0d839cdd5d5baa33d8acb6466a65de8c2f52fdf6e684
PORT=3000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Steps

#### Render:
1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repo: `samarabdelhameed/mv-PayPerPrompt`
4. Set Root Directory: `relay`
5. Build Command: `npm install`
6. Start Command: `npm start`
7. Add environment variables (see above)
8. Deploy!

#### Railway:
1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select `samarabdelhameed/mv-PayPerPrompt`
4. Set Root Directory: `relay`
5. Add environment variables
6. Deploy!

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/invoice` | POST | Create x402 invoice |
| `/api/pay/:invoiceId` | POST | Process payment |
| `/api/agents` | GET | List agents from blockchain |
| `/api/metrics` | GET | Platform metrics |

## Test Locally

```bash
cd relay
npm install
cp .env.example .env
npm start
# Server running on http://localhost:3000
```
