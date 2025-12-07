module PayPerPrompt::PaymentSplitter {
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::event;

    /// Split configuration: 85% to agent, 15% to platform
    const AGENT_SHARE_BPS: u64 = 8500;  // 85%
    const PLATFORM_SHARE_BPS: u64 = 1500;  // 15%
    const BPS_DENOMINATOR: u64 = 10000;

    /// Payment split event
    struct PaymentSplit has drop, store {
        total_amount: u64,
        agent_amount: u64,
        platform_amount: u64,
        agent_address: address,
        timestamp: u64,
    }

    /// Split payment between agent and platform
    public entry fun split_payment(
        payer: &signer,
        agent_address: address,
        platform_address: address,
        total_amount: u64,
    ) {
        let agent_amount = (total_amount * AGENT_SHARE_BPS) / BPS_DENOMINATOR;
        let platform_amount = total_amount - agent_amount;

        // Transfer to agent
        coin::transfer<AptosCoin>(payer, agent_address, agent_amount);
        
        // Transfer to platform
        coin::transfer<AptosCoin>(payer, platform_address, platform_amount);

        event::emit(PaymentSplit {
            total_amount,
            agent_amount,
            platform_amount,
            agent_address,
            timestamp: aptos_framework::timestamp::now_seconds(),
        });
    }
}
