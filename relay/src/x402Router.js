const express = require('express');
const { AptosClient } = require('aptos');

class X402Router {
  constructor(nodeUrl) {
    this.client = new AptosClient(nodeUrl || process.env.APTOS_NODE_URL);
    this.router = express.Router();
    this.contractAddress = process.env.CONTRACT_ADDRESS;
    this.setupRoutes();
  }

  setupRoutes() {
    // Handle x402 payment requests
    this.router.post('/invoice', async (req, res) => {
      try {
        const { agentAddress, amount, metadata } = req.body;

        // In a real x402 flow, the relay acts as an intermediary
        // Here we generate a payload for the frontend to sign if needed,
        // or record the intent in a local DB.

        const invoiceId = this.generateInvoiceId();

        // For Movement Hackathon, we'll return a payload that the frontend
        // can use to call the X402InvoiceHandler.create_invoice

        res.json({
          success: true,
          invoiceId,
          payload: {
            function: `${this.contractAddress}::x402_invoice_handler::create_invoice`,
            type_arguments: [],
            arguments: [
              agentAddress, // agent address
              "0x0", // payer (placeholder, will be signed by user)
              amount.toString(),
              metadata || "",
              "3600" // expiry
            ]
          }
        });
      } catch (error) {
        console.error("Invoice Error:", error);
        res.status(500).json({ error: error.message });
      }
    });

    // List registered agents from contract
    this.router.get('/agents', async (req, res) => {
      try {
        // Fetch agents from AgentRegistry.move via view functions
        const totalAgents = await this.client.view({
          function: `${this.contractAddress}::agent_registry::get_total_agents`,
          type_arguments: [],
          arguments: []
        });

        // Fetch total staked from blockchain
        const totalStaked = await this.client.view({
          function: `${this.contractAddress}::agent_registry::get_total_staked`,
          type_arguments: [],
          arguments: []
        });

        // Return real blockchain data only - no mock data
        res.json({
          success: true,
          total: parseInt(totalAgents[0]) || 0,
          totalStaked: totalStaked[0] || "0",
          agents: [], // Real agents would come from an indexer in production
          source: "blockchain",
          contractAddress: this.contractAddress
        });
      } catch (error) {
        console.error("Agents Fetch Error:", error);
        res.status(500).json({ error: error.message });
      }
    });

    // Process payment (Frontend will call this after signing)
    this.router.post('/pay/:invoiceId', async (req, res) => {
      try {
        const { invoiceId } = req.params;
        const { txnHash } = req.body;

        // Verify transaction on Movement
        const txn = await this.client.waitForTransactionWithResult(txnHash);

        res.json({
          success: true,
          invoiceId,
          status: txn.success ? 'success' : 'failed',
          version: txn.version
        });
      } catch (error) {
        console.error("Payment Verification Error:", error);
        res.status(500).json({ error: error.message });
      }
    });

    // Platform metrics
    this.router.get('/metrics', async (req, res) => {
      try {
        const stats = await this.client.view({
          function: `${this.contractAddress}::payment_splitter::get_payment_stats`,
          type_arguments: [],
          arguments: []
        });

        res.json({
          total_payments: stats[0],
          total_volume: stats[1],
          total_earnings: stats[2],
          total_fees: stats[3],
          active_streams: stats[4]
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  generateInvoiceId() {
    return `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getRouter() {
    return this.router;
  }
}

module.exports = X402Router;
