#[test_only]
module PayPerPrompt::AgentRegistryTests {
    use PayPerPrompt::AgentRegistry;
    use std::string;

    #[test(account = @0x1)]
    public fun test_register_agent(account: signer) {
        let name = string::utf8(b"TestAgent");
        let endpoint = string::utf8(b"https://api.test.com");
        
        AgentRegistry::register_agent(&account, name, endpoint);
        // Add assertions here
    }
}
