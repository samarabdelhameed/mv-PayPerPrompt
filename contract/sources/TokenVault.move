/// TokenVault Module - Balance Management for PayPerPrompt
/// 
/// This module manages internal token balances for agents and users.
/// It provides deposit, withdraw, and internal transfer functionality
/// without requiring on-chain token transfers for every micro-transaction.
///
/// Key Features:
/// - Internal balance tracking
/// - Deposit/withdraw operations
/// - Internal transfers (gas-efficient)
/// - Event emission for indexing
/// - Security checks and validations
module PayPerPrompt::token_vault {
    use std::signer;
    use std::error;
    use std::vector;
    use PayPerPrompt::timestamp;

    // ====================== ERRORS ======================
    const EVAULT_NOT_INITIALIZED: u64 = 1;
    const EINSUFFICIENT_BALANCE: u64 = 2;
    const EINVALID_AMOUNT: u64 = 3;
    const EACCOUNT_NOT_FOUND: u64 = 4;
    const EACCOUNT_ALREADY_EXISTS: u64 = 5;
    const ENOT_AUTHORIZED: u64 = 6;
    const EVAULT_PAUSED: u64 = 7;
    const EWITHDRAWAL_LOCKED: u64 = 8;

    // ====================== CONSTANTS ======================
    const MIN_DEPOSIT: u128 = 1000; // 0.001 MOVE in micro units
    const MIN_WITHDRAWAL: u128 = 1000;
    const WITHDRAWAL_LOCK_PERIOD: u64 = 3600; // 1 hour in seconds

    // ====================== STRUCTS ======================
    
    /// Account balance information
    struct Balance has key {
        available: u128,           // Available balance
        locked: u128,              // Locked balance (pending transactions)
        total_deposited: u128,     // Lifetime deposits
        total_withdrawn: u128,     // Lifetime withdrawals
        last_deposit: u64,         // Last deposit timestamp
        last_withdrawal: u64,      // Last withdrawal timestamp
        withdrawal_lock_until: u64, // Withdrawal lock timestamp
    }

    /// Global vault statistics
    struct VaultStats has key {
        total_accounts: u64,
        total_balance: u128,
        total_locked: u128,
        total_volume: u128,
        is_paused: bool,
        admin: address,
    }

    /// Event storage
    struct VaultEvents has key {
        deposit_events: vector<DepositEvent>,
        withdrawal_events: vector<WithdrawalEvent>,
        transfer_events: vector<TransferEvent>,
        lock_events: vector<LockEvent>,
    }

    // ====================== EVENTS ======================
    
    struct DepositEvent has drop, store, copy {
        account: address,
        amount: u128,
        new_balance: u128,
        timestamp: u64,
    }

    struct WithdrawalEvent has drop, store, copy {
        account: address,
        amount: u128,
        new_balance: u128,
        timestamp: u64,
    }

    struct TransferEvent has drop, store, copy {
        from: address,
        to: address,
        amount: u128,
        timestamp: u64,
    }

    struct LockEvent has drop, store, copy {
        account: address,
        amount: u128,
        locked: bool, // true = lock, false = unlock
        timestamp: u64,
    }

    // ====================== INITIALIZATION ======================
    
    /// Initialize the vault (admin only)
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @PayPerPrompt, error::permission_denied(ENOT_AUTHORIZED));
        
        if (!exists<VaultStats>(admin_addr)) {
            move_to(admin, VaultStats {
                total_accounts: 0,
                total_balance: 0,
                total_locked: 0,
                total_volume: 0,
                is_paused: false,
                admin: admin_addr,
            });
        };

        if (!exists<VaultEvents>(admin_addr)) {
            move_to(admin, VaultEvents {
                deposit_events: vector[],
                withdrawal_events: vector[],
                transfer_events: vector[],
                lock_events: vector[],
            });
        };
    }

    // ====================== ACCOUNT MANAGEMENT ======================
    
    /// Create a new balance account
    public entry fun create_account(account: &signer) acquires VaultStats {
        let account_addr = signer::address_of(account);
        assert!(!exists<Balance>(account_addr), EACCOUNT_ALREADY_EXISTS);
        
        let now = timestamp::now_seconds();
        
        move_to(account, Balance {
            available: 0,
            locked: 0,
            total_deposited: 0,
            total_withdrawn: 0,
            last_deposit: now,
            last_withdrawal: now,
            withdrawal_lock_until: 0,
        });

        // Update global stats
        let stats = borrow_global_mut<VaultStats>(@PayPerPrompt);
        stats.total_accounts = stats.total_accounts + 1;
    }

    /// Check if account exists
    #[view]
    public fun account_exists(account_addr: address): bool {
        exists<Balance>(account_addr)
    }

    // ====================== DEPOSIT OPERATIONS ======================
    
    /// Deposit tokens into vault
    /// Note: In production, this would transfer actual tokens
    /// For now, it's a mock that updates internal balance
    public entry fun deposit(
        account: &signer,
        amount: u128
    ) acquires Balance, VaultStats, VaultEvents {
        let account_addr = signer::address_of(account);
        
        // Validations
        assert!(amount >= MIN_DEPOSIT, EINVALID_AMOUNT);
        assert_vault_not_paused();
        
        // Create account if doesn't exist
        if (!exists<Balance>(account_addr)) {
            create_account(account);
        };

        let balance = borrow_global_mut<Balance>(account_addr);
        let now = timestamp::now_seconds();
        
        // Update balance
        balance.available = balance.available + amount;
        balance.total_deposited = balance.total_deposited + amount;
        balance.last_deposit = now;

        // Update global stats
        let stats = borrow_global_mut<VaultStats>(@PayPerPrompt);
        stats.total_balance = stats.total_balance + amount;
        stats.total_volume = stats.total_volume + amount;

        // Emit event
        emit_deposit(DepositEvent {
            account: account_addr,
            amount,
            new_balance: balance.available,
            timestamp: now,
        });
    }

    // ====================== WITHDRAWAL OPERATIONS ======================
    
    /// Withdraw tokens from vault
    public entry fun withdraw(
        account: &signer,
        amount: u128
    ) acquires Balance, VaultStats, VaultEvents {
        let account_addr = signer::address_of(account);
        let now = timestamp::now_seconds();
        
        // Validations
        assert!(amount >= MIN_WITHDRAWAL, EINVALID_AMOUNT);
        assert_vault_not_paused();
        assert!(exists<Balance>(account_addr), EACCOUNT_NOT_FOUND);

        let balance = borrow_global_mut<Balance>(account_addr);
        
        // Check withdrawal lock
        assert!(now >= balance.withdrawal_lock_until, EWITHDRAWAL_LOCKED);
        
        // Check sufficient balance
        assert!(balance.available >= amount, EINSUFFICIENT_BALANCE);

        // Update balance
        balance.available = balance.available - amount;
        balance.total_withdrawn = balance.total_withdrawn + amount;
        balance.last_withdrawal = now;

        // Update global stats
        let stats = borrow_global_mut<VaultStats>(@PayPerPrompt);
        stats.total_balance = stats.total_balance - amount;

        // Emit event
        emit_withdrawal(WithdrawalEvent {
            account: account_addr,
            amount,
            new_balance: balance.available,
            timestamp: now,
        });

        // Note: In production, transfer actual tokens here
        // coin::transfer<AptosCoin>(account, recipient, amount);
    }

    // ====================== INTERNAL TRANSFERS ======================
    
    /// Internal transfer between accounts (gas-efficient)
    /// This is used by PaymentSplitter and X402Handler
    public fun internal_transfer(
        from: address,
        to: address,
        amount: u128
    ) acquires Balance, VaultStats, VaultEvents {
        assert_vault_not_paused();
        assert!(amount > 0, EINVALID_AMOUNT);
        assert!(exists<Balance>(from), EACCOUNT_NOT_FOUND);
        
        // Create recipient account if doesn't exist
        if (!exists<Balance>(to)) {
            // Can't use create_account here as we don't have signer
            // In production, recipient must have account created first
            abort EACCOUNT_NOT_FOUND
        };

        let from_balance = borrow_global_mut<Balance>(from);
        assert!(from_balance.available >= amount, EINSUFFICIENT_BALANCE);

        // Deduct from sender
        from_balance.available = from_balance.available - amount;

        // Add to recipient
        let to_balance = borrow_global_mut<Balance>(to);
        to_balance.available = to_balance.available + amount;

        // Update volume
        let stats = borrow_global_mut<VaultStats>(@PayPerPrompt);
        stats.total_volume = stats.total_volume + amount;

        // Emit event
        emit_transfer(TransferEvent {
            from,
            to,
            amount,
            timestamp: timestamp::now_seconds(),
        });
    }

    // ====================== LOCK/UNLOCK OPERATIONS ======================
    
    /// Lock balance (for pending transactions)
    public fun lock_balance(
        account_addr: address,
        amount: u128
    ) acquires Balance, VaultStats, VaultEvents {
        assert!(exists<Balance>(account_addr), EACCOUNT_NOT_FOUND);
        
        let balance = borrow_global_mut<Balance>(account_addr);
        assert!(balance.available >= amount, EINSUFFICIENT_BALANCE);

        // Move from available to locked
        balance.available = balance.available - amount;
        balance.locked = balance.locked + amount;

        // Update global stats
        let stats = borrow_global_mut<VaultStats>(@PayPerPrompt);
        stats.total_locked = stats.total_locked + amount;

        // Emit event
        emit_lock(LockEvent {
            account: account_addr,
            amount,
            locked: true,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Unlock balance (transaction completed/cancelled)
    public fun unlock_balance(
        account_addr: address,
        amount: u128
    ) acquires Balance, VaultStats, VaultEvents {
        assert!(exists<Balance>(account_addr), EACCOUNT_NOT_FOUND);
        
        let balance = borrow_global_mut<Balance>(account_addr);
        assert!(balance.locked >= amount, EINSUFFICIENT_BALANCE);

        // Move from locked to available
        balance.locked = balance.locked - amount;
        balance.available = balance.available + amount;

        // Update global stats
        let stats = borrow_global_mut<VaultStats>(@PayPerPrompt);
        stats.total_locked = stats.total_locked - amount;

        // Emit event
        emit_lock(LockEvent {
            account: account_addr,
            amount,
            locked: false,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Consume locked balance (for completed payments)
    public fun consume_locked(
        from: address,
        to: address,
        amount: u128
    ) acquires Balance, VaultStats, VaultEvents {
        assert!(exists<Balance>(from), EACCOUNT_NOT_FOUND);
        assert!(exists<Balance>(to), EACCOUNT_NOT_FOUND);
        
        let from_balance = borrow_global_mut<Balance>(from);
        assert!(from_balance.locked >= amount, EINSUFFICIENT_BALANCE);

        // Deduct from locked
        from_balance.locked = from_balance.locked - amount;

        // Add to recipient available
        let to_balance = borrow_global_mut<Balance>(to);
        to_balance.available = to_balance.available + amount;

        // Update global stats
        let stats = borrow_global_mut<VaultStats>(@PayPerPrompt);
        stats.total_locked = stats.total_locked - amount;
        stats.total_volume = stats.total_volume + amount;

        // Emit event
        emit_transfer(TransferEvent {
            from,
            to,
            amount,
            timestamp: timestamp::now_seconds(),
        });
    }

    // ====================== ADMIN FUNCTIONS ======================
    
    /// Pause vault (emergency)
    public entry fun pause_vault(admin: &signer) acquires VaultStats {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @PayPerPrompt, ENOT_AUTHORIZED);
        
        let stats = borrow_global_mut<VaultStats>(@PayPerPrompt);
        stats.is_paused = true;
    }

    /// Unpause vault
    public entry fun unpause_vault(admin: &signer) acquires VaultStats {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @PayPerPrompt, ENOT_AUTHORIZED);
        
        let stats = borrow_global_mut<VaultStats>(@PayPerPrompt);
        stats.is_paused = false;
    }

    /// Set withdrawal lock for account (security measure)
    public entry fun set_withdrawal_lock(
        admin: &signer,
        account_addr: address,
        lock_duration: u64
    ) acquires Balance, VaultStats {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @PayPerPrompt, ENOT_AUTHORIZED);
        assert!(exists<Balance>(account_addr), EACCOUNT_NOT_FOUND);

        let balance = borrow_global_mut<Balance>(account_addr);
        let now = timestamp::now_seconds();
        balance.withdrawal_lock_until = now + lock_duration;
    }

    // ====================== VIEW FUNCTIONS ======================
    
    /// Get available balance
    #[view]
    public fun get_balance(account_addr: address): u128 acquires Balance {
        assert!(exists<Balance>(account_addr), EACCOUNT_NOT_FOUND);
        borrow_global<Balance>(account_addr).available
    }

    /// Get locked balance
    #[view]
    public fun get_locked_balance(account_addr: address): u128 acquires Balance {
        assert!(exists<Balance>(account_addr), EACCOUNT_NOT_FOUND);
        borrow_global<Balance>(account_addr).locked
    }

    /// Get total balance (available + locked)
    #[view]
    public fun get_total_balance(account_addr: address): u128 acquires Balance {
        assert!(exists<Balance>(account_addr), EACCOUNT_NOT_FOUND);
        let balance = borrow_global<Balance>(account_addr);
        balance.available + balance.locked
    }

    /// Get account statistics
    #[view]
    public fun get_account_stats(account_addr: address): (u128, u128, u128, u128) acquires Balance {
        assert!(exists<Balance>(account_addr), EACCOUNT_NOT_FOUND);
        let balance = borrow_global<Balance>(account_addr);
        (
            balance.available,
            balance.locked,
            balance.total_deposited,
            balance.total_withdrawn
        )
    }

    /// Get vault statistics
    #[view]
    public fun get_vault_stats(): (u64, u128, u128, u128, bool) acquires VaultStats {
        let stats = borrow_global<VaultStats>(@PayPerPrompt);
        (
            stats.total_accounts,
            stats.total_balance,
            stats.total_locked,
            stats.total_volume,
            stats.is_paused
        )
    }

    /// Check if withdrawal is locked
    #[view]
    public fun is_withdrawal_locked(account_addr: address): bool acquires Balance {
        if (!exists<Balance>(account_addr)) {
            return false
        };
        let balance = borrow_global<Balance>(account_addr);
        let now = timestamp::now_seconds();
        now < balance.withdrawal_lock_until
    }

    // ====================== HELPER FUNCTIONS ======================
    
    /// Assert vault is not paused
    fun assert_vault_not_paused() acquires VaultStats {
        let stats = borrow_global<VaultStats>(@PayPerPrompt);
        assert!(!stats.is_paused, EVAULT_PAUSED);
    }

    /// Emit deposit event
    fun emit_deposit(event: DepositEvent) acquires VaultEvents {
        if (!exists<VaultEvents>(@PayPerPrompt)) {
            return
        };
        let events = borrow_global_mut<VaultEvents>(@PayPerPrompt);
        vector::push_back(&mut events.deposit_events, event);
    }

    /// Emit withdrawal event
    fun emit_withdrawal(event: WithdrawalEvent) acquires VaultEvents {
        if (!exists<VaultEvents>(@PayPerPrompt)) {
            return
        };
        let events = borrow_global_mut<VaultEvents>(@PayPerPrompt);
        vector::push_back(&mut events.withdrawal_events, event);
    }

    /// Emit transfer event
    fun emit_transfer(event: TransferEvent) acquires VaultEvents {
        if (!exists<VaultEvents>(@PayPerPrompt)) {
            return
        };
        let events = borrow_global_mut<VaultEvents>(@PayPerPrompt);
        vector::push_back(&mut events.transfer_events, event);
    }

    /// Emit lock event
    fun emit_lock(event: LockEvent) acquires VaultEvents {
        if (!exists<VaultEvents>(@PayPerPrompt)) {
            return
        };
        let events = borrow_global_mut<VaultEvents>(@PayPerPrompt);
        vector::push_back(&mut events.lock_events, event);
    }

    // ====================== TEST HELPERS ======================
    
    #[test_only]
    public fun create_test_account_with_balance(
        account: &signer,
        amount: u128
    ) acquires Balance, VaultStats, VaultEvents {
        create_account(account);
        deposit(account, amount);
    }
}
