#!/bin/bash

echo "🧪 Testing PayPerPrompt Components..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

test_component() {
    local name=$1
    local dir=$2
    local command=$3
    
    echo -n "Testing $name... "
    cd $dir
    if eval $command > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        cd - > /dev/null
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        cd - > /dev/null
        return 1
    fi
}

# Test Node.js components
test_component "Relay Server" "relay" "node -e 'require(\"./src/index.js\")' --check"
test_component "Analytics" "analytics" "npx tsc --noEmit"
test_component "Web Build" "web" "npm run build"
test_component "Telegram Bot" "mobile/telegram_bot" "node -e 'require(\"./bot.js\")' --check"

echo ""
echo "📊 Test Summary Complete"
