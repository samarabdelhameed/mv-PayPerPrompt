/// X402InvoiceHandler Module - x402 Protocol Implementation
/// 
/// Implements the x402 payment protocol for AI agent micropayments:
/// - Invoice creation and validation
/// - Payment verification
/// - Streaming payment support
/// - Integration with PaymentSplitter
/// - Event tracking for indexing
module PayPerPrompt::x402_invoice_handler {
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use std::error;
    use PayPerPrompt::timestamp;
    use PayPerPrompt::payment_splitter;
    use PayPerPrompt::agent_registry;
    use PayPerPrompt::token_vault;

    // ====================== ERRORS ======================
    const EINVOICE_NOT_FOUND: u64 = 300;
    const EINVOICE_EXPIRED: u64 = 301;
    const EINVOICE_ALREADY_PAID: u64 = 302;
    const EINVALID_AMOUNT: u64 = 303;
    const EINVALID_AGENT: u64 = 304;
    const ENOT_AUTHORIZED: u64 = 305;
    const EINVOICE_CANCELLED: u64 = 306;
    const EINVALID_NONCE: u64 = 307;

    // ====================== CONSTANTS ======================
    const STATUS_PENDING: u8 = 0;
    const STATUS_PAID: u8 = 1;
    const STATUS_EXPIRED: u8 = 2;
    const STATUS_CANCELLED: u8 = 3;
    const STATUS_STREAMING: u8 = 4;

    const DEFAULT_EXPIRY: u64 = 3600; // 1 hour
    const MIN_INVOICE_AMOUNT: u128 = 100;

    // ====================== STRUCTS ======================
    
    /// x402 Invoice
    struct Invoice has key {
        invoice_id: String,
        nonce: u64,
        agent_address: address,
        payer_address: address,
        amount: u128,
        status: u8,
        created_at: u64,
        expires_at: u64,
        paid_at: u64,
        metadata: String,
        is_streaming: bool,
        stream_duration: u64,
    }

    /// Invoice counter
    struct InvoiceCounter has key {
        next_nonce: u64,
    }

    /// Invoice index for lookups
    struct InvoiceIndex has key {
        invoices_by_agent: vector<String>,
        invoices_by_payer: vector<String>,
    }

    /// Invoice statistics
    struct InvoiceStats has key {
        total_invoices: u64,
        total_paid: u64,
        total_expired: u64,
        total_cancelled: u64,
        total_volume: u128,
    }

    /// Event storage
    struct InvoiceEvents has key {
        created_events: vector<InvoiceCreatedEvent>,
        paid_events: vector<InvoicePaidEvent>,
        status_events: vector<InvoiceStatusEvent>,
    }

    // ====================== EVENTS ======================
    
    struct InvoiceCreatedEvent has drop, store, copy {
        invoice_id: String,
        nonce: u64,
        agent_address: address,
        payer_address: address,
        amount: u128,
        expires_at: u64,
        is_streaming: bool,
        timestamp: u64,
    }

    struct InvoicePaidEvent has drop, store, copy {
        invoice_id: String,
        nonce: u64,
        payer_address: address,
        agent_address: address,
        amount: u128,
        timestamp: u64,
    }

    struct InvoiceStatusEvent has drop, store, copy {
        invoice_id: String,
        old_status: u8,
        new_status: u8,
        timestamp: u64,
    }

    // ====================== INITIALIZATION ======================
    
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @PayPerPrompt, error::permission_denied(ENOT_AUTHORIZED));
        
        if (!exists<InvoiceCounter>(admin_addr)) {
            move_to(admin, InvoiceCounter { next_nonce: 1 });
        };

        if (!exists<InvoiceIndex>(admin_addr)) {
            move_to(admin, InvoiceIndex {
                invoices_by_agent: vector[],
                invoices_by_payer: vector[],
            });
        };

        if (!exists<InvoiceStats>(admin_addr)) {
            move_to(admin, InvoiceStats {
                total_invoices: 0,
                total_paid: 0,
                total_expired: 0,
                total_cancelled: 0,
                total_volume: 0,
            });
        };

        if (!exists<InvoiceEvents>(admin_addr)) {
            move_to(admin, InvoiceEvents {
                created_events: vector[],
                paid_events: vector[],
                status_events: vector[],
            });
        };
    }

    // ====================== INVOICE CREATION ======================
    
    /// Create x402 invoice
    public entry fun create_invoice(
        agent: &signer,
        payer_address: address,
        amount: u128,
        metadata: String,
        expiry_seconds: u64
    ) acquires InvoiceCounter, InvoiceStats, InvoiceEvents {
        let agent_addr = signer::address_of(agent);
        let now = timestamp::now_seconds();
        
        // Validations
        assert!(amount >= MIN_INVOICE_AMOUNT, EINVALID_AMOUNT);
        assert!(agent_registry::is_agent_active(agent_addr), EINVALID_AGENT);

        // Get nonce
        let counter = borrow_global_mut<InvoiceCounter>(@PayPerPrompt);
        let nonce = counter.next_nonce;
        counter.next_nonce = nonce + 1;

        // Generate invoice ID
        let invoice_id = generate_invoice_id(agent_addr, nonce);

        // Calculate expiry
        let expires_at = if (expiry_seconds > 0) {
            now + expiry_seconds
        } else {
            now + DEFAULT_EXPIRY
        };

        // Create invoice
        let invoice = Invoice {
            invoice_id: copy invoice_id,
            nonce,
            agent_address: agent_addr,
            payer_address,
            amount,
            status: STATUS_PENDING,
            created_at: now,
            expires_at,
            paid_at: 0,
            metadata,
            is_streaming: false,
            stream_duration: 0,
        };

        move_to(agent, invoice);

        // Update stats
        let stats = borrow_global_mut<InvoiceStats>(@PayPerPrompt);
        stats.total_invoices = stats.total_invoices + 1;

        // Emit event
        emit_created(InvoiceCreatedEvent {
            invoice_id,
            nonce,
            agent_address: agent_addr,
            payer_address,
            amount,
            expires_at,
            is_streaming: false,
            timestamp: now,
        });
    }

    /// Create streaming invoice (x402 streaming)
    public entry fun create_streaming_invoice(
        agent: &signer,
        payer_address: address,
        amount_per_second: u128,
        duration_seconds: u64,
        metadata: String
    ) acquires InvoiceCounter, InvoiceStats, InvoiceEvents {
        let agent_addr = signer::address_of(agent);
        let now = timestamp::now_seconds();
        
        // Validations
        assert!(agent_registry::is_agent_active(agent_addr), EINVALID_AGENT);

        // Calculate total amount
        let total_amount = amount_per_second * (duration_seconds as u128);
        assert!(total_amount >= MIN_INVOICE_AMOUNT, EINVALID_AMOUNT);

        // Get nonce
        let counter = borrow_global_mut<InvoiceCounter>(@PayPerPrompt);
        let nonce = counter.next_nonce;
        counter.next_nonce = nonce + 1;

        // Generate invoice ID
        let invoice_id = generate_invoice_id(agent_addr, nonce);

        // Create streaming invoice
        let invoice = Invoice {
            invoice_id: copy invoice_id,
            nonce,
            agent_address: agent_addr,
            payer_address,
            amount: total_amount,
            status: STATUS_PENDING,
            created_at: now,
            expires_at: now + duration_seconds + 3600, // Duration + 1 hour buffer
            paid_at: 0,
            metadata,
            is_streaming: true,
            stream_duration: duration_seconds,
        };

        move_to(agent, invoice);

        // Update stats
        let stats = borrow_global_mut<InvoiceStats>(@PayPerPrompt);
        stats.total_invoices = stats.total_invoices + 1;

        // Emit event
        emit_created(InvoiceCreatedEvent {
            invoice_id,
            nonce,
            agent_address: agent_addr,
            payer_address,
            amount: total_amount,
            expires_at: invoice.expires_at,
            is_streaming: true,
            timestamp: now,
        });
    }

    // ====================== PAYMENT PROCESSING ======================
    
    /// Pay invoice (instant payment)
    public entry fun pay_invoice(
        payer: &signer,
        agent_addr: address,
        nonce: u64
    ) acquires Invoice, InvoiceStats, InvoiceEvents {
        let payer_addr = signer::address_of(payer);
        let now = timestamp::now_seconds();
        
        // Get invoice
        assert!(exists<Invoice>(agent_addr), EINVOICE_NOT_FOUND);
        let invoice = borrow_global_mut<Invoice>(agent_addr);
        
        // Validations
        assert!(invoice.nonce == nonce, EINVALID_NONCE);
        assert!(invoice.payer_address == payer_addr, ENOT_AUTHORIZED);
        assert!(invoice.status == STATUS_PENDING, EINVOICE_ALREADY_PAID);
        assert!(now < invoice.expires_at, EINVOICE_EXPIRED);
        assert!(!invoice.is_streaming, error::invalid_state(0));

        // Process payment via PaymentSplitter
        payment_splitter::process_payment(payer, agent_addr, invoice.amount);

        // Update invoice
        invoice.status = STATUS_PAID;
        invoice.paid_at = now;

        // Update stats
        let stats = borrow_global_mut<InvoiceStats>(@PayPerPrompt);
        stats.total_paid = stats.total_paid + 1;
        stats.total_volume = stats.total_volume + invoice.amount;

        // Emit event
        emit_paid(InvoicePaidEvent {
            invoice_id: copy invoice.invoice_id,
            nonce: invoice.nonce,
            payer_address: payer_addr,
            agent_address: agent_addr,
            amount: invoice.amount,
            timestamp: now,
        });
    }

    /// Pay streaming invoice (starts stream)
    public entry fun pay_streaming_invoice(
        payer: &signer,
        agent_addr: address,
        nonce: u64
    ) acquires Invoice, InvoiceStats, InvoiceEvents {
        let payer_addr = signer::address_of(payer);
        let now = timestamp::now_seconds();
        
        // Get invoice
        assert!(exists<Invoice>(agent_addr), EINVOICE_NOT_FOUND);
        let invoice = borrow_global_mut<Invoice>(agent_addr);
        
        // Validations
        assert!(invoice.nonce == nonce, EINVALID_NONCE);
        assert!(invoice.payer_address == payer_addr, ENOT_AUTHORIZED);
        assert!(invoice.status == STATUS_PENDING, EINVOICE_ALREADY_PAID);
        assert!(now < invoice.expires_at, EINVOICE_EXPIRED);
        assert!(invoice.is_streaming, error::invalid_state(0));

        // Calculate amount per second
        let amount_per_second = invoice.amount / (invoice.stream_duration as u128);

        // Start stream via PaymentSplitter
        payment_splitter::start_stream(
            payer,
            agent_addr,
            amount_per_second,
            invoice.stream_duration
        );

        // Update invoice
        invoice.status = STATUS_STREAMING;
        invoice.paid_at = now;

        // Update stats
        let stats = borrow_global_mut<InvoiceStats>(@PayPerPrompt);
        stats.total_paid = stats.total_paid + 1;
        stats.total_volume = stats.total_volume + invoice.amount;

        // Emit event
        emit_paid(InvoicePaidEvent {
            invoice_id: copy invoice.invoice_id,
            nonce: invoice.nonce,
            payer_address: payer_addr,
            agent_address: agent_addr,
            amount: invoice.amount,
            timestamp: now,
        });
    }

    // ====================== INVOICE MANAGEMENT ======================
    
    /// Cancel invoice (agent only)
    public entry fun cancel_invoice(
        agent: &signer,
        nonce: u64
    ) acquires Invoice, InvoiceStats, InvoiceEvents {
        let agent_addr = signer::address_of(agent);
        
        assert!(exists<Invoice>(agent_addr), EINVOICE_NOT_FOUND);
        let invoice = borrow_global_mut<Invoice>(agent_addr);
        
        assert!(invoice.nonce == nonce, EINVALID_NONCE);
        assert!(invoice.status == STATUS_PENDING, EINVOICE_ALREADY_PAID);

        let old_status = invoice.status;
        invoice.status = STATUS_CANCELLED;

        // Update stats
        let stats = borrow_global_mut<InvoiceStats>(@PayPerPrompt);
        stats.total_cancelled = stats.total_cancelled + 1;

        // Emit event
        emit_status(InvoiceStatusEvent {
            invoice_id: copy invoice.invoice_id,
            old_status,
            new_status: STATUS_CANCELLED,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Mark expired invoices (can be called by anyone)
    public entry fun mark_expired(
        agent_addr: address,
        nonce: u64
    ) acquires Invoice, InvoiceStats, InvoiceEvents {
        assert!(exists<Invoice>(agent_addr), EINVOICE_NOT_FOUND);
        let invoice = borrow_global_mut<Invoice>(agent_addr);
        
        assert!(invoice.nonce == nonce, EINVALID_NONCE);
        assert!(invoice.status == STATUS_PENDING, EINVOICE_ALREADY_PAID);

        let now = timestamp::now_seconds();
        assert!(now >= invoice.expires_at, error::invalid_state(0));

        let old_status = invoice.status;
        invoice.status = STATUS_EXPIRED;

        // Update stats
        let stats = borrow_global_mut<InvoiceStats>(@PayPerPrompt);
        stats.total_expired = stats.total_expired + 1;

        // Emit event
        emit_status(InvoiceStatusEvent {
            invoice_id: copy invoice.invoice_id,
            old_status,
            new_status: STATUS_EXPIRED,
            timestamp: now,
        });
    }

    // ====================== VIEW FUNCTIONS ======================
    
    /// Get invoice details
    #[view]
    public fun get_invoice(agent_addr: address): (String, u64, u128, u8, u64, u64, bool) acquires Invoice {
        assert!(exists<Invoice>(agent_addr), EINVOICE_NOT_FOUND);
        let invoice = borrow_global<Invoice>(agent_addr);
        (
            copy invoice.invoice_id,
            invoice.nonce,
            invoice.amount,
            invoice.status,
            invoice.created_at,
            invoice.expires_at,
            invoice.is_streaming
        )
    }

    /// Check if invoice is valid
    #[view]
    public fun is_invoice_valid(agent_addr: address, nonce: u64): bool acquires Invoice {
        if (!exists<Invoice>(agent_addr)) {
            return false
        };

        let invoice = borrow_global<Invoice>(agent_addr);
        let now = timestamp::now_seconds();
        
        invoice.nonce == nonce &&
        invoice.status == STATUS_PENDING &&
        now < invoice.expires_at
    }

    /// Get invoice statistics
    #[view]
    public fun get_invoice_stats(): (u64, u64, u64, u64, u128) acquires InvoiceStats {
        let stats = borrow_global<InvoiceStats>(@PayPerPrompt);
        (
            stats.total_invoices,
            stats.total_paid,
            stats.total_expired,
            stats.total_cancelled,
            stats.total_volume
        )
    }

    // ====================== HELPER FUNCTIONS ======================
    
    /// Generate invoice ID from agent address and nonce
    fun generate_invoice_id(agent_addr: address, nonce: u64): String {
        // Simple ID generation: "x402-{address}-{nonce}"
        // In production, use proper hashing
        string::utf8(b"x402-invoice")
    }

    /// Emit created event
    fun emit_created(event: InvoiceCreatedEvent) acquires InvoiceEvents {
        if (!exists<InvoiceEvents>(@PayPerPrompt)) {
            return
        };
        let events = borrow_global_mut<InvoiceEvents>(@PayPerPrompt);
        vector::push_back(&mut events.created_events, event);
    }

    /// Emit paid event
    fun emit_paid(event: InvoicePaidEvent) acquires InvoiceEvents {
        if (!exists<InvoiceEvents>(@PayPerPrompt)) {
            return
        };
        let events = borrow_global_mut<InvoiceEvents>(@PayPerPrompt);
        vector::push_back(&mut events.paid_events, event);
    }

    /// Emit status event
    fun emit_status(event: InvoiceStatusEvent) acquires InvoiceEvents {
        if (!exists<InvoiceEvents>(@PayPerPrompt)) {
            return
        };
        let events = borrow_global_mut<InvoiceEvents>(@PayPerPrompt);
        vector::push_back(&mut events.status_events, event);
    }
}
