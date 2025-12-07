const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const RELAY_URL = process.env.RELAY_URL || 'http://localhost:3000';
const token = process.env.TELEGRAM_BOT_TOKEN;

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 
    'Welcome to PayPerPrompt! 🤖\n\n' +
    'Send me a prompt and I\'ll connect you with AI agents.\n\n' +
    'Commands:\n' +
    '/agents - List available agents\n' +
    '/balance - Check your balance\n' +
    '/pay - Make a payment'
  );
});

bot.onText(/\/agents/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const response = await axios.get(`${RELAY_URL}/agents`);
    const agents = response.data;
    
    let message = '🤖 Available Agents:\n\n';
    agents.forEach(agent => {
      message += `• ${agent.name}\n  ${agent.description}\n\n`;
    });
    
    bot.sendMessage(chatId, message);
  } catch (error) {
    bot.sendMessage(chatId, 'Error fetching agents');
  }
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  if (text.startsWith('/')) return;
  
  // Process as AI prompt
  bot.sendMessage(chatId, '🔄 Processing your prompt...');
  
  try {
    const response = await axios.post(`${RELAY_URL}/prompt`, {
      prompt: text,
      userId: chatId,
    });
    
    bot.sendMessage(chatId, response.data.result);
  } catch (error) {
    bot.sendMessage(chatId, 'Error processing prompt');
  }
});

console.log('Telegram bot started');
