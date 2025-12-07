# PayPerPrompt Architecture

## System Overview

PayPerPrompt is a decentralized AI payment infrastructure built on Move 2, implementing the x402 payment standard.

## Components

### 1. Smart Contracts (Move 2)
- **AgentRegistry**: Agent registration with reputation tracking
- **PaymentSplitter**: 85/15 revenue distribution
- **FeeManager**: Spending caps and platform fees
- **X402InvoiceHandler**: Full x402 standard implementation

### 2. Relay Layer
- **x402Router**: Payment request handling
- **AgentAPI**: AI service integration
- **RateLimiter**: Spam protection
- **AbuseProtection**: Security enforcement

### 3. Web Interface
- Wallet connection
- Agent discovery
- Payment processing
- Analytics dashboard

### 4. Analytics
- Event indexing
- Real-time metrics
- Performance monitoring

### 5. Mobile
- Telegram bot for quick access
- PWA for mobile-first experience

## Data Flow

```
User → Web/Mobile → Relay → Smart Contracts → AI Agent
                      ↓
                  Analytics
```

## Payment Flow

1. User sends prompt request
2. Relay creates x402 invoice
3. User approves payment
4. PaymentSplitter distributes funds (85% agent, 15% platform)
5. Agent processes request
6. Response delivered to user

## Security

- Rate limiting per IP
- Spending caps per user
- Abuse detection and blocking
- Smart contract auditing
