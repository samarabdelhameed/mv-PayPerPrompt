const axios = require('axios');

class AgentAPI {
  constructor(agentEndpoint, apiKey) {
    this.endpoint = agentEndpoint;
    this.apiKey = apiKey;
  }

  async sendPrompt(prompt, userId) {
    try {
      const response = await axios.post(`${this.endpoint}/prompt`, {
        prompt,
        userId,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(`Agent API error: ${error.message}`);
    }
  }

  async getAgentInfo() {
    const response = await axios.get(`${this.endpoint}/info`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });
    return response.data;
  }
}

module.exports = AgentAPI;
