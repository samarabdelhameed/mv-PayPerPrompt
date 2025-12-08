#[test_only]
module PayPerPrompt::agent_registry_tests {
    use std::signer;
    use std::string;
    use PayPerPrompt::agent_registry;

    const TEST_PRICE: u128 = 500; // 0.0005 MOVE

    #[test(admin = @PayPerPrompt, user = @0x100)]
    fun test_register_agent(admin: &signer, user: &signer) {
        // Initialize
        agent_registry::initialize(admin);
        
        // Register agent
        agent_registry::register_agent(
            user,
            string::utf8(b"TestAgent"),
            string::utf8(b"Test agent for unit testing"),
            TEST_PRICE,
            100000000, // max spending cap
            0, // category
            string::utf8(b"https://api.test.com"),
            0, // provider
            string::utf8(b"gpt-4"),
            1000000 // stake
        );
        
        // Verify agent was registered
        let agent_id = agent_registry::get_agent_id(signer::address_of(user));
        assert!(agent_id == 1, 1);
        
        let price = agent_registry::get_agent_price(signer::address_of(user));
        assert!(price == TEST_PRICE, 2);
        
        let is_active = agent_registry::is_agent_active(signer::address_of(user));
        assert!(is_active, 3);
        
        let total_agents = agent_registry::get_total_agents();
        assert!(total_agents == 1, 4);
    }

    #[test(admin = @PayPerPrompt, user = @0x100)]
    fun test_update_agent_price(admin: &signer, user: &signer) {
        agent_registry::initialize(admin);
        agent_registry::create_test_agent(user, string::utf8(b"TestAgent"), TEST_PRICE);
        
        let new_price = 1000; // 0.001 MOVE
        agent_registry::update_agent_price(user, 1, new_price);
        
        let updated_price = agent_registry::get_agent_price(signer::address_of(user));
        assert!(updated_price == new_price, 1);
    }

    #[test(admin = @PayPerPrompt, user = @0x100)]
    fun test_deposit_stake(admin: &signer, user: &signer) {
        agent_registry::initialize(admin);
        agent_registry::create_test_agent(user, string::utf8(b"TestAgent"), TEST_PRICE);
        
        let initial_staked = agent_registry::get_total_staked();
        assert!(initial_staked == 1000000, 1); // 1 MOVE from registration
        
        // Deposit more stake
        agent_registry::deposit_stake(user, 1, 500000); // 0.5 MOVE
        
        let final_staked = agent_registry::get_total_staked();
        assert!(final_staked == 1500000, 2); // 1.5 MOVE total
    }

    #[test(admin = @PayPerPrompt, user = @0x100)]
    fun test_update_reputation(admin: &signer, user: &signer) {
        agent_registry::initialize(admin);
        agent_registry::create_test_agent(user, string::utf8(b"TestAgent"), TEST_PRICE);
        
        let initial_reputation = agent_registry::get_agent_reputation(signer::address_of(user));
        assert!(initial_reputation == 500, 1);
    }

    #[test(admin = @PayPerPrompt, owner = @0x100, attacker = @0x200)]
    #[expected_failure(abort_code = 3)] // ENOT_AGENT_OWNER
    fun test_only_owner_can_update(admin: &signer, owner: &signer, attacker: &signer) {
        agent_registry::initialize(admin);
        agent_registry::create_test_agent(owner, string::utf8(b"TestAgent"), TEST_PRICE);
        
        // Attacker tries to update price - should fail
        agent_registry::update_agent_price(attacker, 1, 999);
    }
}
