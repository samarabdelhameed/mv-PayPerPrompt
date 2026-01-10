const express = require('express');
const cors = require('cors');
require('dotenv').config();

const X402Router = require('./x402Router');
const RateLimiter = require('./rate_limiter');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: '*' })); // Allow all origins for Hackathon Demo
app.use(express.json());

// Rate limiting
const rateLimiter = new RateLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
});
app.use(rateLimiter.middleware());

// Routes
try {
  const x402Router = new X402Router(process.env.APTOS_NODE_URL);
  app.use('/api', x402Router.getRouter());
} catch (error) {
  console.error("Failed to initialize X402Router:", error);
  // Do not crash, just log. Routes won't work but health check will.
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`PayPerPrompt Relay running on port ${PORT}`);
});
