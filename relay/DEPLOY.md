# PayPerPrompt Relay Server

## Deployment to Railway/Render

### Environment Variables Required:
```env
APTOS_NODE_URL=https://fullnode.devnet.aptoslabs.com
CONTRACT_ADDRESS=0xebbd28cf467283f883ea0d839cdd5d5baa33d8acb6466a65de8c2f52fdf6e684
PLATFORM_ADDRESS=0xebbd28cf467283f883ea0d839cdd5d5baa33d8acb6466a65de8c2f52fdf6e684
PORT=3000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Deploy to Railway:
1. Connect GitHub repo
2. Select `relay` directory as root
3. Add environment variables
4. Deploy

### Deploy to Render:
1. Create new Web Service
2. Connect GitHub repo
3. Set root directory to `relay`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables
