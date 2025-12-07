module PayPerPrompt::FeeManager {
    use std::signer;
    use aptos_framework::event;

    /// Spending cap per user
    struct SpendingCap has key {
        daily_limit: u64,
        spent_today: u64,
        last_reset: u64,
    }

    /// Fee configuration
    struct FeeConfig has key {
        platform_fee_bps: u64,
        min_payment: u64,
        max_payment: u64,
    }

    const E_SPENDING_CAP_EXCEEDED: u64 = 1;
    const E_PAYMENT_TOO_LOW: u64 = 2;
    const E_PAYMENT_TOO_HIGH: u64 = 3;

    /// Initialize spending cap for user
    public entry fun initialize_spending_cap(
        account: &signer,
        daily_limit: u64,
    ) {
        let cap = SpendingCap {
            daily_limit,
            spent_today: 0,
            last_reset: aptos_framework::timestamp::now_seconds(),
        };
        move_to(account, cap);
    }

    /// Check and update spending cap
    public fun check_spending_cap(
        user_addr: address,
        amount: u64,
    ) acquires SpendingCap {
        let cap = borrow_global_mut<SpendingCap>(user_addr);
        
        // Reset if new day
        let now = aptos_framework::timestamp::now_seconds();
        if (now - cap.last_reset > 86400) {
            cap.spent_today = 0;
            cap.last_reset = now;
        };

        assert!(cap.spent_today + amount <= cap.daily_limit, E_SPENDING_CAP_EXCEEDED);
        cap.spent_today = cap.spent_today + amount;
    }
}
