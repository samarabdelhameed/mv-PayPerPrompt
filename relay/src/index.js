const express = require('express');
const cors = require('cors');
require('dotenv').config();

const X402Router = require('./x402Router');
const RateLimiter = require('./rate_limiter');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const rateLimiter = new RateLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
});
app.use(rateLimiter.middleware());

// Routes
const x402Router = new X402Router(process.env.APTOS_NODE_URL);
app.use('/api', x402Router.getRouter());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`PayPerPrompt Relay running on port ${PORT}`);
});
