/// Simple timestamp module for Movement Network compatibility
/// This provides a basic timestamp interface that works across different Move implementations
module PayPerPrompt::timestamp {
    use std::error;
    
    const ETIMESTAMP_NOT_INITIALIZED: u64 = 1;
    
    /// Global timestamp resource
    struct CurrentTimestamp has key {
        microseconds: u64,
    }
    
    /// Initialize the timestamp (called by admin)
    public fun initialize(account: &signer) {
        move_to(account, CurrentTimestamp {
            microseconds: 0,
        });
    }
    
    /// Get current time in seconds
    /// For testing/development, returns a mock timestamp
    /// In production, this would be replaced with actual blockchain timestamp
    public fun now_seconds(): u64 {
        // For development: return a reasonable timestamp
        // In production on Movement, this would call the native timestamp function
        1700000000 // ~Nov 2023 as base
    }
    
    /// Get current time in microseconds
    public fun now_microseconds(): u64 {
        now_seconds() * 1000000
    }
    
    #[test_only]
    public fun set_time_for_testing(microseconds: u64) {
        // Test helper - would be implemented with test framework
        let _ = microseconds;
    }
}
