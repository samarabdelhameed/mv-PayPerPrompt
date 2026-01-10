const express = require('express');
const cors = require('cors');
const { AptosClient } = require('aptos');

const app = express();

// Allow all origins
app.use(cors({ origin: '*' }));
app.use(express.json());

// Configuration
const APTOS_NODE_URL = process.env.APTOS_NODE_URL || "https://testnet.movementnetwork.xyz/v1";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x76ed58b619ab6c6071d1830cf9db04728e2d4d6170153e8d5ad96346ab09bbc8";

const client = new AptosClient(APTOS_NODE_URL);

// --- APIs ---

// 1. Get Agents
app.get('/api/agents', async (req, res) => {
    try {
        const totalAgents = await client.view({
            function: `${CONTRACT_ADDRESS}::agent_registry::get_total_agents`,
            type_arguments: [],
            arguments: []
        });

        const totalStaked = await client.view({
            function: `${CONTRACT_ADDRESS}::agent_registry::get_total_staked`,
            type_arguments: [],
            arguments: []
        });

        res.json({
            success: true,
            total: parseInt(totalAgents[0]) || 0,
            totalStaked: totalStaked[0] || "0",
            agents: [],
            source: "blockchain",
            contractAddress: CONTRACT_ADDRESS
        });
    } catch (error) {
        console.warn("Blockchain Fetch Failed (Using Mock Data):", error.message);
        // FALLBACK MOCK DATA
        res.json({
            success: true,
            total: 3,
            totalStaked: "5000000",
            agents: [
                { id: "1", name: "PayPerPrompt AI", description: "Premium General Intelligence", price: "1 MOVE", address: CONTRACT_ADDRESS, imageUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=PayPerPrompt" },
                { id: "2", name: "CodeWizard Pro", description: "Expert Code Generation", price: "2 MOVE", address: "0x123...", imageUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=CodeWizard" },
                { id: "3", name: "Creative Muse", description: "Art & Image Generation", price: "0.5 MOVE", address: "0x456...", imageUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Creative" }
            ],
            source: "mock_fallback",
            note: "Serverless function fallback active."
        });
    }
});

// 2. Create Invoice
app.post('/api/invoice', (req, res) => {
    const { agentAddress, amount, metadata } = req.body;
    const invoiceId = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    res.json({
        success: true,
        invoiceId,
        payload: {
            function: `${CONTRACT_ADDRESS}::x402_invoice_handler::create_invoice`,
            type_arguments: [],
            arguments: [
                agentAddress,
                "0x0",
                amount.toString(),
                metadata || "",
                "3600"
            ]
        }
    });
});

// 3. Process Payment
app.post('/api/pay/:invoiceId', async (req, res) => {
    const { invoiceId } = req.params;
    const { txnHash } = req.body;

    // In a real scenario, we would verify the txn hash here.
    // For the demo, we accept the hash provided by the frontend.
    res.json({
        success: true,
        invoiceId,
        status: 'success',
        version: '123456',
        txnHash
    });
});

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now(), mode: 'serverless' });
});

module.exports = app;
