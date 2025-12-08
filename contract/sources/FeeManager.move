/// FeeManager Module - Fee Configuration and Management
/// 
/// Manages platform fees, treasury, and governance:
/// - Configurable fee rates
/// - Treasury management
/// - Spending caps per user
/// - Emergency controls
/// - Historical tracking
module PayPerPrompt::fee_manager {
    use std::signer;
    use std::error;
    use std::vector;
    use PayPerPrompt::timestamp;

    // ====================== ERRORS ======================
    const ENOT_AUTHORIZED: u64 = 200;
    const EINVALID_FEE: u64 = 201;
    const ESPENDING_CAP_EXCEEDED: u64 = 202;
    const EINVALID_TREASURY: u64 = 203;
    const EFEE_TOO_HIGH: u64 = 204;

    // ====================== CONSTANTS ======================
    const MAX_PLATFORM_FEE_BPS: u64 = 3000; // 30% maximum
    const DEFAULT_PLATFORM_FEE_BPS: u64 = 1500; // 15%
    const DEFAULT_DAILY_CAP: u128 = 100000000; // 100 MOVE
    const BPS_DENOMINATOR: u64 = 10000;

    // ====================== STRUCTS ======================
    
    /// Global fee configuration
    struct FeeConfig has key {
        platform_fee_bps: u64,
        referral_fee_bps: u64,
        treasury_address: address,
        admin_address: address,
        is_paused: bool,
        last_updated: u64,
    }

    /// User spending cap
    struct SpendingCap has key {
        daily_limit: u128,
        spent_today: u128,
        last_reset: u64,
        is_unlimited: bool,
    }

    /// Fee history for governance
    struct FeeHistory has key {
        changes: vector<FeeChange>,
    }

    /// Event storage
    struct FeeEvents has key {
        config_events: vector<FeeConfigEvent>,
        cap_events: vector<SpendingCapEvent>,
    }

    // ====================== EVENTS ======================
    
    struct FeeChange has drop, store, copy {
        old_fee_bps: u64,
        new_fee_bps: u64,
        changed_by: address,
        timestamp: u64,
    }

    struct FeeConfigEvent has drop, store, copy {
        field_name: u8, // 0=platform_fee, 1=referral_fee, 2=treasury
        old_value: u64,
        new_value: u64,
        timestamp: u64,
    }

    struct SpendingCapEvent has drop, store, copy {
        user: address,
        old_limit: u128,
        new_limit: u128,
        timestamp: u64,
    }

    // ====================== INITIALIZATION ======================
    
    public entry fun initialize(admin: &signer, treasury: address) {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @PayPerPrompt, error::permission_denied(ENOT_AUTHORIZED));
        
        if (!exists<FeeConfig>(admin_addr)) {
            move_to(admin, FeeConfig {
                platform_fee_bps: DEFAULT_PLATFORM_FEE_BPS,
                referral_fee_bps: 0,
                treasury_address: treasury,
                admin_address: admin_addr,
                is_paused: false,
                last_updated: timestamp::now_seconds(),
            });
        };

        if (!exists<FeeHistory>(admin_addr)) {
            move_to(admin, FeeHistory {
                changes: vector[],
            });
        };

        if (!exists<FeeEvents>(admin_addr)) {
            move_to(admin, FeeEvents {
                config_events: vector[],
                cap_events: vector[],
            });
        };
    }

    // ====================== FEE CONFIGURATION ======================
    
    /// Update platform fee (governance function)
    public entry fun update_platform_fee(
        admin: &signer,
        new_fee_bps: u64
    ) acquires FeeConfig, FeeHistory, FeeEvents {
        let admin_addr = signer::address_of(admin);
        let config = borrow_global_mut<FeeConfig>(@PayPerPrompt);
        
        assert!(admin_addr == config.admin_address, ENOT_AUTHORIZED);
        assert!(new_fee_bps <= MAX_PLATFORM_FEE_BPS, EFEE_TOO_HIGH);

        let old_fee = config.platform_fee_bps;
        config.platform_fee_bps = new_fee_bps;
        config.last_updated = timestamp::now_seconds();

        // Record in history
        let history = borrow_global_mut<FeeHistory>(@PayPerPrompt);
        vector::push_back(&mut history.changes, FeeChange {
            old_fee_bps: old_fee,
            new_fee_bps,
            changed_by: admin_addr,
            timestamp: timestamp::now_seconds(),
        });

        // Emit event
        emit_config_event(FeeConfigEvent {
            field_name: 0, // platform_fee
            old_value: old_fee,
            new_value: new_fee_bps,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Update referral fee
    public entry fun update_referral_fee(
        admin: &signer,
        new_fee_bps: u64
    ) acquires FeeConfig, FeeEvents {
        let admin_addr = signer::address_of(admin);
        let config = borrow_global_mut<FeeConfig>(@PayPerPrompt);
        
        assert!(admin_addr == config.admin_address, ENOT_AUTHORIZED);
        assert!(new_fee_bps <= 1000, EFEE_TOO_HIGH); // Max 10% referral

        let old_fee = config.referral_fee_bps;
        config.referral_fee_bps = new_fee_bps;
        config.last_updated = timestamp::now_seconds();

        emit_config_event(FeeConfigEvent {
            field_name: 1, // referral_fee
            old_value: old_fee,
            new_value: new_fee_bps,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Update treasury address
    public entry fun update_treasury(
        admin: &signer,
        new_treasury: address
    ) acquires FeeConfig, FeeEvents {
        let admin_addr = signer::address_of(admin);
        let config = borrow_global_mut<FeeConfig>(@PayPerPrompt);
        
        assert!(admin_addr == config.admin_address, ENOT_AUTHORIZED);
        assert!(new_treasury != @0x0, EINVALID_TREASURY);

        config.treasury_address = new_treasury;
        config.last_updated = timestamp::now_seconds();

        emit_config_event(FeeConfigEvent {
            field_name: 2, // treasury
            old_value: 0,
            new_value: 0,
            timestamp: timestamp::now_seconds(),
        });
    }

    // ====================== SPENDING CAPS ======================
    
    /// Initialize spending cap for user
    public entry fun initialize_spending_cap(
        user: &signer,
        daily_limit: u128
    ) {
        let user_addr = signer::address_of(user);
        
        if (!exists<SpendingCap>(user_addr)) {
            move_to(user, SpendingCap {
                daily_limit,
                spent_today: 0,
                last_reset: timestamp::now_seconds(),
                is_unlimited: false,
            });
        };
    }

    /// Check and update spending cap
    public fun check_spending_cap(
        user_addr: address,
        amount: u128
    ) acquires SpendingCap {
        if (!exists<SpendingCap>(user_addr)) {
            return // No cap set
        };

        let cap = borrow_global_mut<SpendingCap>(user_addr);
        
        if (cap.is_unlimited) {
            return // Unlimited spending
        };

        let now = timestamp::now_seconds();
        
        // Reset if new day (86400 seconds = 24 hours)
        if (now - cap.last_reset >= 86400) {
            cap.spent_today = 0;
            cap.last_reset = now;
        };

        // Check limit
        assert!(cap.spent_today + amount <= cap.daily_limit, ESPENDING_CAP_EXCEEDED);
        
        // Update spent amount
        cap.spent_today = cap.spent_today + amount;
    }

    /// Update spending cap
    public entry fun update_spending_cap(
        user: &signer,
        new_limit: u128
    ) acquires SpendingCap, FeeEvents {
        let user_addr = signer::address_of(user);
        
        if (!exists<SpendingCap>(user_addr)) {
            initialize_spending_cap(user, new_limit);
            return
        };

        let cap = borrow_global_mut<SpendingCap>(user_addr);
        let old_limit = cap.daily_limit;
        cap.daily_limit = new_limit;

        emit_cap_event(SpendingCapEvent {
            user: user_addr,
            old_limit,
            new_limit,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Set unlimited spending (admin only)
    public entry fun set_unlimited_spending(
        admin: &signer,
        user_addr: address,
        unlimited: bool
    ) acquires FeeConfig, SpendingCap {
        let admin_addr = signer::address_of(admin);
        let config = borrow_global<FeeConfig>(@PayPerPrompt);
        assert!(admin_addr == config.admin_address, ENOT_AUTHORIZED);

        if (!exists<SpendingCap>(user_addr)) {
            return
        };

        let cap = borrow_global_mut<SpendingCap>(user_addr);
        cap.is_unlimited = unlimited;
    }

    // ====================== EMERGENCY CONTROLS ======================
    
    /// Pause fee system
    public entry fun pause(admin: &signer) acquires FeeConfig {
        let admin_addr = signer::address_of(admin);
        let config = borrow_global_mut<FeeConfig>(@PayPerPrompt);
        assert!(admin_addr == config.admin_address, ENOT_AUTHORIZED);
        
        config.is_paused = true;
    }

    /// Unpause fee system
    public entry fun unpause(admin: &signer) acquires FeeConfig {
        let admin_addr = signer::address_of(admin);
        let config = borrow_global_mut<FeeConfig>(@PayPerPrompt);
        assert!(admin_addr == config.admin_address, ENOT_AUTHORIZED);
        
        config.is_paused = false;
    }

    // ====================== VIEW FUNCTIONS ======================
    
    /// Get current platform fee
    #[view]
    public fun get_platform_fee_bps(): u64 acquires FeeConfig {
        borrow_global<FeeConfig>(@PayPerPrompt).platform_fee_bps
    }

    /// Get referral fee
    #[view]
    public fun get_referral_fee_bps(): u64 acquires FeeConfig {
        borrow_global<FeeConfig>(@PayPerPrompt).referral_fee_bps
    }

    /// Get treasury address
    #[view]
    public fun get_treasury_address(): address acquires FeeConfig {
        borrow_global<FeeConfig>(@PayPerPrompt).treasury_address
    }

    /// Check if paused
    #[view]
    public fun is_paused(): bool acquires FeeConfig {
        borrow_global<FeeConfig>(@PayPerPrompt).is_paused
    }

    /// Get spending cap info
    #[view]
    public fun get_spending_cap_info(user_addr: address): (u128, u128, bool) acquires SpendingCap {
        if (!exists<SpendingCap>(user_addr)) {
            return (0, 0, false)
        };
        
        let cap = borrow_global<SpendingCap>(user_addr);
        (cap.daily_limit, cap.spent_today, cap.is_unlimited)
    }

    /// Calculate fee for amount
    #[view]
    public fun calculate_platform_fee(amount: u128): u128 acquires FeeConfig {
        let config = borrow_global<FeeConfig>(@PayPerPrompt);
        (amount * (config.platform_fee_bps as u128)) / (BPS_DENOMINATOR as u128)
    }

    // ====================== HELPER FUNCTIONS ======================
    
    fun emit_config_event(event: FeeConfigEvent) acquires FeeEvents {
        if (!exists<FeeEvents>(@PayPerPrompt)) {
            return
        };
        let events = borrow_global_mut<FeeEvents>(@PayPerPrompt);
        vector::push_back(&mut events.config_events, event);
    }

    fun emit_cap_event(event: SpendingCapEvent) acquires FeeEvents {
        if (!exists<FeeEvents>(@PayPerPrompt)) {
            return
        };
        let events = borrow_global_mut<FeeEvents>(@PayPerPrompt);
        vector::push_back(&mut events.cap_events, event);
    }
}
