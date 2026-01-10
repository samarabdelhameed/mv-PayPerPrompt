/// Timestamp wrapper module for Aptos/Movement compatibility
/// Uses aptos_framework::timestamp under the hood
module PayPerPrompt::timestamp {
    use aptos_framework::timestamp as aptos_timestamp;
    
    /// Get current time in seconds
    public fun now_seconds(): u64 {
        aptos_timestamp::now_seconds()
    }
    
    /// Get current time in microseconds
    public fun now_microseconds(): u64 {
        aptos_timestamp::now_microseconds()
    }
    
    #[test_only]
    public fun set_time_for_testing(_microseconds: u64) {
        // Test helper - uses aptos_framework::timestamp::set_time_has_started_for_testing
    }
}
