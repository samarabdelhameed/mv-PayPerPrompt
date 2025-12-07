#!/bin/bash

echo "🚀 Starting PayPerPrompt Services..."
echo ""

# Check if .env files exist
if [ ! -f relay/.env ]; then
    echo "⚠️  Creating relay/.env from example..."
    cp relay/.env.example relay/.env
fi

if [ ! -f mobile/telegram_bot/.env ]; then
    echo "⚠️  Creating telegram bot .env from example..."
    cp mobile/telegram_bot/.env.example mobile/telegram_bot/.env
fi

echo "✅ Environment files ready"
echo ""

# Function to start service in background
start_service() {
    local name=$1
    local dir=$2
    local command=$3
    
    echo "Starting $name..."
    cd $dir && $command &
    cd - > /dev/null
}

# Start all services
echo "🔄 Launching services..."
echo ""

# Relay Server
start_service "Relay Server" "relay" "npm start"

# Analytics
start_service "Analytics Indexer" "analytics" "npm start"

# Web Interface
start_service "Web Interface" "web" "npm run dev"

# Telegram Bot (optional)
# start_service "Telegram Bot" "mobile/telegram_bot" "npm start"

echo ""
echo "✅ All services started!"
echo ""
echo "📍 Service URLs:"
echo "   - Web Interface: http://localhost:5173"
echo "   - Relay API: http://localhost:3000"
echo "   - Analytics: http://localhost:3000/api/metrics"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for user interrupt
wait
