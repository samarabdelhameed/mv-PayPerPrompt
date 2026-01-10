class RateLimiter {
    constructor(config) {
        this.requests = new Map();
        this.config = config;
    }

    middleware() {
        return (req, res, next) => {
            const identifier = req.ip || 'unknown';
            const now = Date.now();

            if (!this.requests.has(identifier)) {
                this.requests.set(identifier, []);
            }

            let userRequests = this.requests.get(identifier);

            // Remove old requests outside the window
            userRequests = userRequests.filter(
                timestamp => now - timestamp < this.config.windowMs
            );

            if (userRequests.length >= this.config.maxRequests) {
                return res.status(429).json({
                    error: 'Too many requests',
                    retryAfter: this.config.windowMs / 1000,
                });
            }

            userRequests.push(now);
            this.requests.set(identifier, userRequests);
            next();
        };
    }
}

module.exports = RateLimiter;
