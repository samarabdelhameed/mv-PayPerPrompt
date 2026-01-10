module PayPerPrompt::agent_registry {
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use std::error;
    use PayPerPrompt::timestamp;

    // ====================== ERRORS ======================
    const EAGENT_NOT_FOUND: u64 = 1;
    const EAGENT_ALREADY_REGISTERED: u64 = 2;
    const ENOT_AGENT_OWNER: u64 = 3;
    const EAGENT_INACTIVE: u64 = 4;
    const EINSUFFICIENT_STAKE: u64 = 5;
    const ESTAKE_LOCKED: u64 = 6;

    // ====================== EVENTS ======================
    /// Event handle for agent events
    struct AgentEvents has key {
        registered_events: vector<AgentRegisteredEvent>,
        updated_events: vector<AgentUpdatedEvent>,
        stake_events: vector<StakeDepositedEvent>,
        slash_events: vector<StakeSlashedEvent>,
    }
    
    struct AgentRegisteredEvent has drop, store, copy {
        agent_id: u64,
        owner: address,
        name: String,
        price_per_token: u128,
        timestamp: u64,
    }

    struct AgentUpdatedEvent has drop, store, copy {
        agent_id: u64,
        field_updated: String,
        new_value: String,
        timestamp: u64,
    }

    struct StakeDepositedEvent has drop, store, copy {
        agent_id: u64,
        amount: u128,
        total_staked: u128,
        timestamp: u64,
    }

    struct StakeSlashedEvent has drop, store, copy {
        agent_id: u64,
        slashed_amount: u128,
        reason: String,
        timestamp: u64,
    }
    
    /// Emit event helper
    fun emit_agent_registered(event: AgentRegisteredEvent) acquires AgentEvents {
        if (!exists<AgentEvents>(@PayPerPrompt)) {
            return
        };
        let events = borrow_global_mut<AgentEvents>(@PayPerPrompt);
        vector::push_back(&mut events.registered_events, event);
    }
    
    fun emit_agent_updated(event: AgentUpdatedEvent) acquires AgentEvents {
        if (!exists<AgentEvents>(@PayPerPrompt)) {
            return
        };
        let events = borrow_global_mut<AgentEvents>(@PayPerPrompt);
        vector::push_back(&mut events.updated_events, event);
    }
    
    fun emit_stake_deposited(event: StakeDepositedEvent) acquires AgentEvents {
        if (!exists<AgentEvents>(@PayPerPrompt)) {
            return
        };
        let events = borrow_global_mut<AgentEvents>(@PayPerPrompt);
        vector::push_back(&mut events.stake_events, event);
    }
    
    fun emit_stake_slashed(event: StakeSlashedEvent) acquires AgentEvents {
        if (!exists<AgentEvents>(@PayPerPrompt)) {
            return
        };
        let events = borrow_global_mut<AgentEvents>(@PayPerPrompt);
        vector::push_back(&mut events.slash_events, event);
    }

    // ====================== STRUCTS ======================
    struct Agent has key {
        agent_id: u64,
        owner: address,
        name: String,
        description: String,
        
        // Pricing
        price_per_token: u128,  // in micro MOVE (10^-6)
        max_spending_cap: u128, // daily limit in micro MOVE
        
        // Status & Stats
        is_active: bool,
        reputation_score: u64,   // 0-1000
        total_earned: u128,
        total_requests: u64,
        success_rate: u64,       // percentage
        
        // Staking
        staked_amount: u128,
        stake_unlock_time: u64,
        min_required_stake: u128,
        
        // Metadata
        created_at: u64,
        last_activity: u64,
        category: u8,           // 0=code, 1=data, 2=image, 3=analysis, etc.
        
        // Technical
        api_endpoint: String,
        model_provider: u8,     // 0=OpenAI, 1=Anthropic, 2=Groq, 3=OpenRouter
        model_name: String,
        
        // Performance
        avg_response_time: u64, // milliseconds
        max_concurrent: u64,
        current_concurrent: u64,
    }

    struct AgentStats has key {
        total_agents: u64,
        total_staked: u128,
        total_volume: u128,
        active_agents: u64,
        pending_rewards: u128,
    }

    struct AgentCounter has key {
        next_id: u64,
    }

    struct AgentIndex has key {
        agent_ids: vector<u64>,
    }

    struct OwnerAgents has key {
        agent_ids: vector<u64>,
    }

    struct CategoryIndex has key {
        agents_by_category: vector<vector<u64>>,
    }

    // ====================== INITIALIZATION ======================
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @PayPerPrompt, error::permission_denied(ENOT_AGENT_OWNER));
        
        if (!exists<AgentCounter>(admin_addr)) {
            move_to(admin, AgentCounter { next_id: 1 });
        };
        
        if (!exists<AgentStats>(admin_addr)) {
            move_to(admin, AgentStats {
                total_agents: 0,
                total_staked: 0,
                total_volume: 0,
                active_agents: 0,
                pending_rewards: 0,
            });
        };
        
        if (!exists<AgentIndex>(admin_addr)) {
            move_to(admin, AgentIndex { agent_ids: vector[] });
        };
        
        if (!exists<CategoryIndex>(admin_addr)) {
            move_to(admin, CategoryIndex { agents_by_category: vector[] });
        };
        
        if (!exists<AgentEvents>(admin_addr)) {
            move_to(admin, AgentEvents {
                registered_events: vector[],
                updated_events: vector[],
                stake_events: vector[],
                slash_events: vector[],
            });
        };
    }

    // ====================== AGENT REGISTRATION ======================
    public entry fun register_agent(
        owner: &signer,
        name: String,
        description: String,
        price_per_token: u128,
        max_spending_cap: u128,
        category: u8,
        api_endpoint: String,
        model_provider: u8,
        model_name: String,
        initial_stake: u128
    ) acquires AgentCounter, AgentStats, AgentIndex, CategoryIndex, OwnerAgents, AgentEvents {
        let owner_addr = signer::address_of(owner);
        let now = timestamp::now_seconds();
        
        // Get next agent ID
        let counter = borrow_global_mut<AgentCounter>(@PayPerPrompt);
        let agent_id = counter.next_id;
        counter.next_id = agent_id + 1;
        
        // Validate minimum stake
        let min_stake = 1000000; // 1 MOVE in micro units
        assert!(initial_stake >= min_stake, EINSUFFICIENT_STAKE);
        
        // Create agent
        let agent = Agent {
            agent_id,
            owner: owner_addr,
            name,
            description,
            price_per_token,
            max_spending_cap,
            is_active: true,
            reputation_score: 500, // Start at 50%
            total_earned: 0,
            total_requests: 0,
            success_rate: 100, // Start at 100%
            staked_amount: initial_stake,
            stake_unlock_time: now + 7 * 86400, // 7 days lock
            min_required_stake: min_stake,
            created_at: now,
            last_activity: now,
            category,
            api_endpoint,
            model_provider,
            model_name,
            avg_response_time: 0,
            max_concurrent: 10,
            current_concurrent: 0,
        };
        
        // Store agent
        move_to(owner, agent);
        
        // Update global stats
        let stats = borrow_global_mut<AgentStats>(@PayPerPrompt);
        stats.total_agents = stats.total_agents + 1;
        stats.active_agents = stats.active_agents + 1;
        stats.total_staked = stats.total_staked + initial_stake;
        
        // Update indices
        update_indices(agent_id, owner_addr, category, owner);
        
        // Emit event
        emit_agent_registered(AgentRegisteredEvent {
            agent_id,
            owner: owner_addr,
            name,
            price_per_token,
            timestamp: now,
        });
    }

    // ====================== AGENT MANAGEMENT ======================
    public entry fun update_agent_price(
        owner: &signer,
        agent_id: u64,
        new_price: u128
    ) acquires Agent, AgentEvents {
        let owner_addr = signer::address_of(owner);
        assert!(exists<Agent>(owner_addr), EAGENT_NOT_FOUND);
        
        let agent = borrow_global_mut<Agent>(owner_addr);
        assert!(agent.agent_id == agent_id, EAGENT_NOT_FOUND);
        assert!(agent.owner == owner_addr, ENOT_AGENT_OWNER);
        
        agent.price_per_token = new_price;
        
        emit_agent_updated(AgentUpdatedEvent {
            agent_id,
            field_updated: string::utf8(b"price_per_token"),
            new_value: string::utf8(b"updated"),
            timestamp: timestamp::now_seconds(),
        });
    }

    public entry fun update_spending_cap(
        owner: &signer,
        agent_id: u64,
        new_cap: u128
    ) acquires Agent {
        let owner_addr = signer::address_of(owner);
        let agent = borrow_global_mut<Agent>(owner_addr);
        assert!(agent.agent_id == agent_id, EAGENT_NOT_FOUND);
        assert!(agent.owner == owner_addr, ENOT_AGENT_OWNER);
        
        agent.max_spending_cap = new_cap;
    }

    public entry fun toggle_agent_active(
        owner: &signer,
        agent_id: u64,
        active: bool
    ) acquires Agent, AgentStats {
        let owner_addr = signer::address_of(owner);
        let agent = borrow_global_mut<Agent>(owner_addr);
        assert!(agent.agent_id == agent_id, EAGENT_NOT_FOUND);
        assert!(agent.owner == owner_addr, ENOT_AGENT_OWNER);
        
        agent.is_active = active;
        
        // Update global stats
        let stats = borrow_global_mut<AgentStats>(@PayPerPrompt);
        if (active) {
            stats.active_agents = stats.active_agents + 1;
        } else {
            stats.active_agents = stats.active_agents - 1;
        };
    }

    // ====================== STAKING FUNCTIONS ======================
    public entry fun deposit_stake(
        owner: &signer,
        agent_id: u64,
        amount: u128
    ) acquires Agent, AgentStats, AgentEvents {
        let owner_addr = signer::address_of(owner);
        let agent = borrow_global_mut<Agent>(owner_addr);
        assert!(agent.agent_id == agent_id, EAGENT_NOT_FOUND);
        assert!(agent.owner == owner_addr, ENOT_AGENT_OWNER);
        
        agent.staked_amount = agent.staked_amount + amount;
        
        // Update global stats
        let stats = borrow_global_mut<AgentStats>(@PayPerPrompt);
        stats.total_staked = stats.total_staked + amount;
        
        emit_stake_deposited(StakeDepositedEvent {
            agent_id,
            amount,
            total_staked: agent.staked_amount,
            timestamp: timestamp::now_seconds(),
        });
    }

    public entry fun withdraw_stake(
        owner: &signer,
        agent_id: u64,
        amount: u128
    ) acquires Agent, AgentStats {
        let owner_addr = signer::address_of(owner);
        let now = timestamp::now_seconds();
        
        let agent = borrow_global_mut<Agent>(owner_addr);
        assert!(agent.agent_id == agent_id, EAGENT_NOT_FOUND);
        assert!(agent.owner == owner_addr, ENOT_AGENT_OWNER);
        assert!(agent.staked_amount >= amount, error::out_of_range(EINSUFFICIENT_STAKE));
        assert!(now >= agent.stake_unlock_time, ESTAKE_LOCKED);
        assert!(agent.staked_amount - amount >= agent.min_required_stake, EINSUFFICIENT_STAKE);
        
        agent.staked_amount = agent.staked_amount - amount;
        
        // Update global stats
        let stats = borrow_global_mut<AgentStats>(@PayPerPrompt);
        stats.total_staked = stats.total_staked - amount;
    }

    public entry fun slash_stake(
        admin: &signer,
        agent_id: u64,
        amount: u128,
        reason: String
    ) acquires AgentEvents {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @PayPerPrompt, ENOT_AGENT_OWNER);
        
        emit_stake_slashed(StakeSlashedEvent {
            agent_id,
            slashed_amount: amount,
            reason,
            timestamp: timestamp::now_seconds(),
        });
    }

    // ====================== REPUTATION MANAGEMENT ======================
    public fun update_reputation(
        agent_addr: address,
        success: bool,
        response_time: u64
    ) acquires Agent {
        if (!exists<Agent>(agent_addr)) return;
        
        let agent = borrow_global_mut<Agent>(agent_addr);
        
        // Update stats
        agent.total_requests = agent.total_requests + 1;
        agent.last_activity = timestamp::now_seconds();
        
        if (success) {
            agent.total_earned = agent.total_earned + agent.price_per_token;
            agent.reputation_score = agent.reputation_score + 1;
            if (agent.reputation_score > 1000) {
                agent.reputation_score = 1000;
            };
        } else {
            if (agent.reputation_score >= 5) {
                agent.reputation_score = agent.reputation_score - 5;
            } else {
                agent.reputation_score = 0;
            };
        };
        
        // Update average response time
        if (agent.avg_response_time == 0) {
            agent.avg_response_time = response_time;
        } else {
            agent.avg_response_time = (agent.avg_response_time * 9 + response_time) / 10;
        };
        
        // Update success rate
        let new_success_rate = if (success) {
            (agent.success_rate * agent.total_requests + 100) / (agent.total_requests + 1)
        } else {
            (agent.success_rate * agent.total_requests) / (agent.total_requests + 1)
        };
        agent.success_rate = new_success_rate;
    }

    // ====================== HELPER FUNCTIONS ======================
    fun update_indices(
        agent_id: u64,
        owner_addr: address,
        category: u8,
        owner: &signer
    ) acquires AgentIndex, CategoryIndex, OwnerAgents {
        // Update global index
        let index = borrow_global_mut<AgentIndex>(@PayPerPrompt);
        vector::push_back(&mut index.agent_ids, agent_id);
        
        // Update category index
        let cat_index = borrow_global_mut<CategoryIndex>(@PayPerPrompt);
        while (vector::length(&cat_index.agents_by_category) <= (category as u64)) {
            vector::push_back(&mut cat_index.agents_by_category, vector[]);
        };
        let category_list = vector::borrow_mut(&mut cat_index.agents_by_category, (category as u64));
        vector::push_back(category_list, agent_id);
        
        // Update owner's agent list
        if (!exists<OwnerAgents>(owner_addr)) {
            move_to(owner, OwnerAgents { agent_ids: vector[] });
        };
        let owner_agents = borrow_global_mut<OwnerAgents>(owner_addr);
        vector::push_back(&mut owner_agents.agent_ids, agent_id);
    }

    // ====================== VIEW FUNCTIONS ======================
    #[view]
    public fun get_agent_id(agent_addr: address): u64 acquires Agent {
        assert!(exists<Agent>(agent_addr), EAGENT_NOT_FOUND);
        borrow_global<Agent>(agent_addr).agent_id
    }

    #[view]
    public fun get_agent_price(agent_addr: address): u128 acquires Agent {
        assert!(exists<Agent>(agent_addr), EAGENT_NOT_FOUND);
        borrow_global<Agent>(agent_addr).price_per_token
    }

    #[view]
    public fun is_agent_active(agent_addr: address): bool acquires Agent {
        if (!exists<Agent>(agent_addr)) return false;
        borrow_global<Agent>(agent_addr).is_active
    }

    #[view]
    public fun get_agent_reputation(agent_addr: address): u64 acquires Agent {
        assert!(exists<Agent>(agent_addr), EAGENT_NOT_FOUND);
        borrow_global<Agent>(agent_addr).reputation_score
    }

    #[view]
    public fun get_total_staked(): u128 acquires AgentStats {
        borrow_global<AgentStats>(@PayPerPrompt).total_staked
    }

    #[view]
    public fun get_total_agents(): u64 acquires AgentStats {
        borrow_global<AgentStats>(@PayPerPrompt).total_agents
    }

    // ====================== TEST HELPERS ======================
    #[test_only]
    public fun create_test_agent(
        account: &signer,
        name: String,
        price: u128
    ) acquires AgentCounter, AgentStats, AgentIndex, CategoryIndex, OwnerAgents, AgentEvents {
        register_agent(
            account,
            name,
            string::utf8(b"Test agent"),
            price,
            100000000, // 100 MOVE max spending
            0, // code category
            string::utf8(b"https://api.test.com"),
            0, // OpenAI
            string::utf8(b"gpt-4"),
            1000000 // 1 MOVE stake
        );
    }
}
