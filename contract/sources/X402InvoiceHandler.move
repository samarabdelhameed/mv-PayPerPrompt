module PayPerPrompt::X402InvoiceHandler {
    use std::string::String;
    use aptos_framework::event;
    use aptos_framework::timestamp;

    /// x402 Invoice structure
    struct Invoice has key, store {
        invoice_id: String,
        agent_address: address,
        amount: u64,
        status: u8,  // 0: pending, 1: paid, 2: expired
        created_at: u64,
        paid_at: u64,
        metadata: String,
    }

    /// Invoice created event
    struct InvoiceCreated has drop, store {
        invoice_id: String,
        agent_address: address,
        amount: u64,
        timestamp: u64,
    }

    /// Invoice paid event
    struct InvoicePaid has drop, store {
        invoice_id: String,
        payer: address,
        amount: u64,
        timestamp: u64,
    }

    const STATUS_PENDING: u8 = 0;
    const STATUS_PAID: u8 = 1;
    const STATUS_EXPIRED: u8 = 2;

    /// Create x402 invoice
    public entry fun create_invoice(
        agent: &signer,
        invoice_id: String,
        amount: u64,
        metadata: String,
    ) {
        let agent_address = signer::address_of(agent);
        
        let invoice = Invoice {
            invoice_id: copy invoice_id,
            agent_address,
            amount,
            status: STATUS_PENDING,
            created_at: timestamp::now_seconds(),
            paid_at: 0,
            metadata,
        };

        move_to(agent, invoice);

        event::emit(InvoiceCreated {
            invoice_id,
            agent_address,
            amount,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Mark invoice as paid
    public fun mark_paid(
        invoice_addr: address,
        payer_addr: address,
        invoice_id: String,
    ) acquires Invoice {
        let invoice = borrow_global_mut<Invoice>(invoice_addr);
        invoice.status = STATUS_PAID;
        invoice.paid_at = timestamp::now_seconds();

        event::emit(InvoicePaid {
            invoice_id,
            payer: payer_addr,
            amount: invoice.amount,
            timestamp: timestamp::now_seconds(),
        });
    }
}
