interface AbuseMetrics {
  failedAttempts: number;
  lastFailure: number;
  blocked: boolean;
}

class AbuseProtection {
  private metrics: Map<string, AbuseMetrics>;
  private readonly MAX_FAILURES = 5;
  private readonly BLOCK_DURATION = 3600000; // 1 hour

  constructor() {
    this.metrics = new Map();
  }

  recordFailure(userId: string): void {
    const metric = this.metrics.get(userId) || {
      failedAttempts: 0,
      lastFailure: 0,
      blocked: false,
    };

    metric.failedAttempts++;
    metric.lastFailure = Date.now();

    if (metric.failedAttempts >= this.MAX_FAILURES) {
      metric.blocked = true;
    }

    this.metrics.set(userId, metric);
  }

  isBlocked(userId: string): boolean {
    const metric = this.metrics.get(userId);
    if (!metric || !metric.blocked) return false;

    // Unblock after duration
    if (Date.now() - metric.lastFailure > this.BLOCK_DURATION) {
      metric.blocked = false;
      metric.failedAttempts = 0;
      this.metrics.set(userId, metric);
      return false;
    }

    return true;
  }

  reset(userId: string): void {
    this.metrics.delete(userId);
  }
}

export default AbuseProtection;
