import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

class RateLimiter {
  private requests: Map<string, number[]>;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.requests = new Map();
    this.config = config;
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const identifier = req.ip || 'unknown';
      const now = Date.now();
      
      if (!this.requests.has(identifier)) {
        this.requests.set(identifier, []);
      }

      const userRequests = this.requests.get(identifier)!;
      
      // Remove old requests outside the window
      const validRequests = userRequests.filter(
        timestamp => now - timestamp < this.config.windowMs
      );

      if (validRequests.length >= this.config.maxRequests) {
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: this.config.windowMs / 1000,
        });
      }

      validRequests.push(now);
      this.requests.set(identifier, validRequests);
      next();
    };
  }
}

export default RateLimiter;
