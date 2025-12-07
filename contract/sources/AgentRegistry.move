module PayPerPrompt::AgentRegistry {
    use std::string::String;
    use aptos_framework::event;
    use aptos_framework::timestamp;

    /// Agent registration data
    struct Agent has key, store {
        owner: address,
        name: String,
        endpoint: String,
        reputation_score: u64,
        total_requests: u64,
        created_at: u64,
    }

    /// Registry storage
    struct Registry has key {
        agents: vector<address>,
    }

    /// Events
    struct AgentRegistered has drop, store {
        agent_address: address,
        owner: address,
        name: String,
        timestamp: u64,
    }

    /// Register a new agent
    public entry fun register_agent(
        account: &signer,
        name: String,
        endpoint: String,
    ) {
        let agent_address = signer::address_of(account);
        
        let agent = Agent {
            owner: agent_address,
            name,
            endpoint,
            reputation_score: 100,
            total_requests: 0,
            created_at: timestamp::now_seconds(),
        };

        move_to(account, agent);

        event::emit(AgentRegistered {
            agent_address,
            owner: agent_address,
            name,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Update reputation score
    public fun update_reputation(agent_addr: address, score_delta: u64) acquires Agent {
        let agent = borrow_global_mut<Agent>(agent_addr);
        agent.reputation_score = agent.reputation_score + score_delta;
        agent.total_requests = agent.total_requests + 1;
    }
}
