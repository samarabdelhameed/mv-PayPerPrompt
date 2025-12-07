const express = require('express');
const { AptosClient } = require('aptos');

class X402Router {
  constructor(nodeUrl) {
    this.client = new AptosClient(nodeUrl);
    this.router = express.Router();
    this.setupRoutes();
  }

  setupRoutes() {
    // Handle x402 payment requests
    this.router.post('/invoice', async (req, res) => {
      try {
        const { agentAddress, amount, metadata } = req.body;
        
        // Create invoice on-chain
        const invoiceId = this.generateInvoiceId();
        
        // TODO: Call X402InvoiceHandler.create_invoice
        
        res.json({
          success: true,
          invoiceId,
          paymentUrl: `/pay/${invoiceId}`,
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Process payment
    this.router.post('/pay/:invoiceId', async (req, res) => {
      try {
        const { invoiceId } = req.params;
        const { payerAddress, signature } = req.body;
        
        // Verify and process payment
        // TODO: Call PaymentSplitter.split_payment
        
        res.json({ success: true, invoiceId });
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
