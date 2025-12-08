/// PaymentSplitter Module - Revenue Distribution for PayPerPrompt
/// 
/// Handles automatic payment splitting between agents and platform:
/// - 85% to agent
/// - 15% to platform
/// 
/// Features:
/// - Instant payments
/// - Streaming payments (x402)
/// - Multi-currency support
/// - Event tracking
/// - Integration with AgentRegistry and TokenVault
module PayPerPrompt::payment_splitter {
    use std::signer;
    use std::error;
    use std::vector;
    use PayPerPrompt::timestamp;
    use PayPerPrompt::token_vault;
    use PayPerPrompt::agent_registry;

    // ====================== ERRORS ======================
    const EINVALID_AMOUNT: u64 = 100;
    const EINVALID_AGENT: u64 = 101;
    const EAGENT_NOT_ACTIVE: u64 = 102;
    const ESTREAM_NOT_FOUND: u64 = 103;
    const ESTREAM_ALREADY_STOPPED: u64 = 104;
    const ENOT_AUTHORIZED: u64 = 105;
    const EINVALID_DURATION: u64 = 106;

    // ====================== CONSTANTS ======================
    const AGENT_SHARE_BPS: u64 = 8500;  // 85%
    const PLATFORM_SHARE_BPS: u64 = 1500;  // 15%
    const BPS_DENOMINATOR: u64 = 10000;
    const MIN_PAYMENT: u128 = 100; // Minimum payment amount
    const MIN_STREAM_DURATION: u64 = 60; // 1 minute minimum

    // ====================== STRUCTS ======================
    
    /// Payment counter
    struct PaymentCounter has key {
        next_id: u64,
    }

    /// Stream counter
    struct StreamCounter has key {
        next_stream_id: u64,
    }

    /// Streaming payment state
    struct StreamingPayment has key {
        stream_id: u64,
        from_address: address,
        to_agent: address,
        amount_per_second: u128,
        total_streamed: u128,
        start_time: u64,
        end_time: u64,
        last_claim_time: u64,
        is_active: bool,
    }

    /// Payment statistics
    struct PaymentStats has key {
        total_payments: u64,
        total_volume: u128,
        total_agent_earnings: u128,
        total_platform_fees: u128,
        active_streams: u64,
    }

    /// Event storage
    struct PaymentEvents has key {
        payment_events: vector<PaymentSplitEvent>,
        stream_events: vector<StreamEvent>,
    }

    // ====================== EVENTS ======================
    
    struct PaymentSplitEvent has drop, store, copy {
        payment_id: u64,
        from_address: address,
        to_agent: address,
        total_amount: u128,
        agent_amount: u128,
        platform_fee: u128,
        timestamp: u64,
    }

    struct StreamEvent has drop, store, copy {
        stream_id: u64,
        from_address: address,
        to_agent: address,
        event_type: u8, // 0=started, 1=claimed, 2=stopped
        amount: u128,
        timestamp: u64,
    }

    // ====================== INITIALIZATION ======================
    
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @PayPerPrompt, error::permission_denied(ENOT_AUTHORIZED));
        
        if (!exists<PaymentCounter>(admin_addr)) {
            move_to(admin, PaymentCounter { next_id: 1 });
        };

        if (!exists<StreamCounter>(admin_addr)) {
            move_to(admin, StreamCounter { next_stream_id: 1 });
        };

        if (!exists<PaymentStats>(admin_addr)) {
            move_to(admin, PaymentStats {
                total_payments: 0,
                total_volume: 0,
                total_agent_earnings: 0,
                total_platform_fees: 0,
                active_streams: 0,
            });
        };

        if (!exists<PaymentEvents>(admin_addr)) {
            move_to(admin, PaymentEvents {
                payment_events: vector[],
                stream_events: vector[],
            });
        };
    }

    // ====================== INSTANT PAYMENTS ======================
    
    /// Process instant payment with 85/15 split
    public entry fun process_payment(
        payer: &signer,
        agent_addr: address,
        amount: u128
    ) acquires PaymentCounter, PaymentStats, PaymentEvents {
        let payer_addr = signer::address_of(payer);
        let now = timestamp::now_seconds();
        
        // Validations
        assert!(amount >= MIN_PAYMENT, EINVALID_AMOUNT);
        assert!(agent_registry::is_agent_active(agent_addr), EAGENT_NOT_ACTIVE);

        // Calculate split
        let (agent_amount, platform_fee) = calculate_split(amount);

        // Transfer via TokenVault
        token_vault::internal_transfer(payer_addr, agent_addr, agent_amount);
        token_vault::internal_transfer(payer_addr, @PayPerPrompt, platform_fee);

        // Update payment counter
        let counter = borrow_global_mut<PaymentCounter>(@PayPerPrompt);
        let payment_id = counter.next_id;
        counter.next_id = payment_id + 1;

        // Update stats
        let stats = borrow_global_mut<PaymentStats>(@PayPerPrompt);
        stats.total_payments = stats.total_payments + 1;
        stats.total_volume = stats.total_volume + amount;
        stats.total_agent_earnings = stats.total_agent_earnings + agent_amount;
        stats.total_platform_fees = stats.total_platform_fees + platform_fee;

        // Update agent reputation
        agent_registry::update_reputation(agent_addr, true, 100);

        // Emit event
        emit_payment(PaymentSplitEvent {
            payment_id,
            from_address: payer_addr,
            to_agent: agent_addr,
            total_amount: amount,
            agent_amount,
            platform_fee,
            timestamp: now,
        });
    }

    // ====================== STREAMING PAYMENTS ======================
    
    /// Start streaming payment (x402 protocol)
    public entry fun start_stream(
        payer: &signer,
        agent_addr: address,
        amount_per_second: u128,
        duration_seconds: u64
    ) acquires StreamCounter, PaymentStats, PaymentEvents {
        let payer_addr = signer::address_of(payer);
        let now = timestamp::now_seconds();
        
        // Validations
        assert!(duration_seconds >= MIN_STREAM_DURATION, EINVALID_DURATION);
        assert!(agent_registry::is_agent_active(agent_addr), EAGENT_NOT_ACTIVE);

        // Calculate total amount and lock it
        let total_amount = amount_per_second * (duration_seconds as u128);
        token_vault::lock_balance(payer_addr, total_amount);

        // Get stream ID
        let stream_counter = borrow_global_mut<StreamCounter>(@PayPerPrompt);
        let stream_id = stream_counter.next_stream_id;
        stream_counter.next_stream_id = stream_id + 1;

        // Create stream
        let stream = StreamingPayment {
            stream_id,
            from_address: payer_addr,
            to_agent: agent_addr,
            amount_per_second,
            total_streamed: 0,
            start_time: now,
            end_time: now + duration_seconds,
            last_claim_time: now,
            is_active: true,
        };

        move_to(payer, stream);

        // Update stats
        let stats = borrow_global_mut<PaymentStats>(@PayPerPrompt);
        stats.active_streams = stats.active_streams + 1;

        // Emit event
        emit_stream(StreamEvent {
            stream_id,
            from_address: payer_addr,
            to_agent: agent_addr,
            event_type: 0, // started
            amount: total_amount,
            timestamp: now,
        });
    }

    /// Claim streamed amount
    public entry fun claim_stream(
        payer_addr: address,
        agent: &signer
    ) acquires StreamingPayment, PaymentStats, PaymentEvents {
        let agent_addr = signer::address_of(agent);
        assert!(exists<StreamingPayment>(payer_addr), ESTREAM_NOT_FOUND);

        let stream = borrow_global_mut<StreamingPayment>(payer_addr);
        assert!(stream.is_active, ESTREAM_ALREADY_STOPPED);
        assert!(stream.to_agent == agent_addr, ENOT_AUTHORIZED);

        let now = timestamp::now_seconds();
        
        // Calculate claimable amount
        let elapsed = if (now > stream.end_time) {
            stream.end_time - stream.last_claim_time
        } else {
            now - stream.last_claim_time
        };

        let claimable = stream.amount_per_second * (elapsed as u128);
        
        if (claimable > 0) {
            // Calculate split
            let (agent_amount, platform_fee) = calculate_split(claimable);

            // Transfer from locked balance
            token_vault::consume_locked(stream.from_address, agent_addr, agent_amount);
            token_vault::consume_locked(stream.from_address, @PayPerPrompt, platform_fee);

            // Update stream
            stream.total_streamed = stream.total_streamed + claimable;
            stream.last_claim_time = now;

            // Update stats
            let stats = borrow_global_mut<PaymentStats>(@PayPerPrompt);
            stats.total_volume = stats.total_volume + claimable;
            stats.total_agent_earnings = stats.total_agent_earnings + agent_amount;
            stats.total_platform_fees = stats.total_platform_fees + platform_fee;

            // Emit event
            emit_stream(StreamEvent {
                stream_id: stream.stream_id,
                from_address: stream.from_address,
                to_agent: agent_addr,
                event_type: 1, // claimed
                amount: claimable,
                timestamp: now,
            });
        };

        // Stop stream if ended
        if (now >= stream.end_time) {
            stream.is_active = false;
            let stats = borrow_global_mut<PaymentStats>(@PayPerPrompt);
            stats.active_streams = stats.active_streams - 1;
        };
    }

    /// Stop stream early
    public entry fun stop_stream(
        payer: &signer
    ) acquires StreamingPayment, PaymentStats, PaymentEvents {
        let payer_addr = signer::address_of(payer);
        assert!(exists<StreamingPayment>(payer_addr), ESTREAM_NOT_FOUND);

        let stream = borrow_global_mut<StreamingPayment>(payer_addr);
        assert!(stream.is_active, ESTREAM_ALREADY_STOPPED);

        let now = timestamp::now_seconds();
        
        // Calculate unclaimed amount
        let elapsed = now - stream.last_claim_time;
        let claimable = stream.amount_per_second * (elapsed as u128);
        
        // Calculate remaining locked amount
        let total_amount = stream.amount_per_second * ((stream.end_time - stream.start_time) as u128);
        let remaining = total_amount - stream.total_streamed - claimable;

        // Unlock remaining balance
        if (remaining > 0) {
            token_vault::unlock_balance(payer_addr, remaining);
        };

        // Mark as stopped
        stream.is_active = false;
        stream.end_time = now;

        // Update stats
        let stats = borrow_global_mut<PaymentStats>(@PayPerPrompt);
        stats.active_streams = stats.active_streams - 1;

        // Emit event
        emit_stream(StreamEvent {
            stream_id: stream.stream_id,
            from_address: payer_addr,
            to_agent: stream.to_agent,
            event_type: 2, // stopped
            amount: remaining,
            timestamp: now,
        });
    }

    // ====================== HELPER FUNCTIONS ======================
    
    /// Calculate 85/15 split
    fun calculate_split(total_amount: u128): (u128, u128) {
        let platform_fee = (total_amount * (PLATFORM_SHARE_BPS as u128)) / (BPS_DENOMINATOR as u128);
        let agent_amount = total_amount - platform_fee;
        (agent_amount, platform_fee)
    }

    /// Emit payment event
    fun emit_payment(event: PaymentSplitEvent) acquires PaymentEvents {
        if (!exists<PaymentEvents>(@PayPerPrompt)) {
            return
        };
        let events = borrow_global_mut<PaymentEvents>(@PayPerPrompt);
        vector::push_back(&mut events.payment_events, event);
    }

    /// Emit stream event
    fun emit_stream(event: StreamEvent) acquires PaymentEvents {
        if (!exists<PaymentEvents>(@PayPerPrompt)) {
            return
        };
        let events = borrow_global_mut<PaymentEvents>(@PayPerPrompt);
        vector::push_back(&mut events.stream_events, event);
    }

    // ====================== VIEW FUNCTIONS ======================
    
    /// Calculate platform fee for amount
    #[view]
    public fun calculate_fee(amount: u128): u128 {
        let (_, fee) = calculate_split(amount);
        fee
    }

    /// Calculate agent amount after fee
    #[view]
    public fun calculate_agent_amount(amount: u128): u128 {
        let (agent_amount, _) = calculate_split(amount);
        agent_amount
    }

    /// Get payment statistics
    #[view]
    public fun get_payment_stats(): (u64, u128, u128, u128, u64) acquires PaymentStats {
        let stats = borrow_global<PaymentStats>(@PayPerPrompt);
        (
            stats.total_payments,
            stats.total_volume,
            stats.total_agent_earnings,
            stats.total_platform_fees,
            stats.active_streams
        )
    }

    /// Get stream info
    #[view]
    public fun get_stream_info(payer_addr: address): (u64, u128, u128, u64, u64, bool) acquires StreamingPayment {
        assert!(exists<StreamingPayment>(payer_addr), ESTREAM_NOT_FOUND);
        let stream = borrow_global<StreamingPayment>(payer_addr);
        (
            stream.stream_id,
            stream.amount_per_second,
            stream.total_streamed,
            stream.start_time,
            stream.end_time,
            stream.is_active
        )
    }

    /// Calculate claimable amount for stream
    #[view]
    public fun get_claimable_amount(payer_addr: address): u128 acquires StreamingPayment {
        if (!exists<StreamingPayment>(payer_addr)) {
            return 0
        };

        let stream = borrow_global<StreamingPayment>(payer_addr);
        if (!stream.is_active) {
            return 0
        };

        let now = timestamp::now_seconds();
        let elapsed = if (now > stream.end_time) {
            stream.end_time - stream.last_claim_time
        } else {
            now - stream.last_claim_time
        };

        stream.amount_per_second * (elapsed as u128)
    }

    // ====================== TEST HELPERS ======================
    
    #[test_only]
    public fun test_calculate_split(amount: u128): (u128, u128) {
        calculate_split(amount)
    }
}
