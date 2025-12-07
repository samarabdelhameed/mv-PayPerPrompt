import { AptosClient } from 'aptos';

interface EventData {
  type: string;
  data: any;
  timestamp: number;
}

class EventIndexer {
  private client: AptosClient;
  private events: EventData[] = [];

  constructor(nodeUrl: string) {
    this.client = new AptosClient(nodeUrl);
  }

  async indexEvents(contractAddress: string) {
    try {
      // Index AgentRegistered events
      const agentEvents = await this.client.getEventsByEventHandle(
        contractAddress,
        `${contractAddress}::AgentRegistry::AgentRegistered`,
        'agent_registered_events'
      );

      // Index PaymentSplit events
      const paymentEvents = await this.client.getEventsByEventHandle(
        contractAddress,
        `${contractAddress}::PaymentSplitter::PaymentSplit`,
        'payment_split_events'
      );

      // Index InvoiceCreated events
      const invoiceEvents = await this.client.getEventsByEventHandle(
        contractAddress,
        `${contractAddress}::X402InvoiceHandler::InvoiceCreated`,
        'invoice_created_events'
      );

      this.processEvents([...agentEvents, ...paymentEvents, ...invoiceEvents]);
    } catch (error) {
      console.error('Indexing error:', error);
    }
  }

  private processEvents(events: any[]) {
    events.forEach(event => {
      this.events.push({
        type: event.type,
        data: event.data,
        timestamp: parseInt(event.data.timestamp || '0'),
      });
    });
  }

  getMetrics() {
    return {
      totalEvents: this.events.length,
      totalAgents: this.events.filter(e => e.type.includes('AgentRegistered')).length,
      totalPayments: this.events.filter(e => e.type.includes('PaymentSplit')).length,
      totalInvoices: this.events.filter(e => e.type.includes('InvoiceCreated')).length,
    };
  }
}

export default EventIndexer;
