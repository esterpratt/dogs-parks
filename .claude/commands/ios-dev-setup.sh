#!/bin/bash

# iOS Development Setup Script
# This script automates the iOS development workflow:
# 1. Starts dev server with --host
# 2. Extracts Network IP
# 3. Updates capacitor.config.ts if needed
# 4. Syncs and opens iOS
#
# Usage: ./ios-dev-setup.sh

set -e  # Exit on any error

PLATFORM="ios"

echo "🚀 Starting iOS Development Setup..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Extract Network IP from a test run
print_status "Getting network IP..."
npm run dev -- --host > dev_output.log 2>&1 &
DEV_PID=$!

# Wait for server to start and extract Network IP
sleep 3
NETWORK_IP=""
for i in {1..10}; do
    if grep -q "Network:" dev_output.log; then
        NETWORK_IP=$(grep "Network:" dev_output.log | grep -oE 'http://[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+:[0-9]+' | head -1)
        break
    fi
    sleep 1
done

# Stop the test server
kill $DEV_PID 2>/dev/null || true
rm -f dev_output.log

if [ -z "$NETWORK_IP" ]; then
    print_error "Could not extract Network IP"
    exit 1
fi

print_status "Network IP detected: $NETWORK_IP"

# Step 2: Check capacitor.config.ts
print_status "Checking capacitor.config.ts..."
CONFIG_FILE="capacitor.config.ts"

if [ ! -f "$CONFIG_FILE" ]; then
    print_error "capacitor.config.ts not found"
    kill $DEV_PID 2>/dev/null || true
    rm -f dev_output.log
    exit 1
fi

# Extract current server URL from config
CURRENT_URL=$(grep -A 5 "process.env.NODE_ENV === 'development'" "$CONFIG_FILE" | grep -oE 'http://[^"'\'']+' | head -1 || echo "")

# Step 3: Update config if IPs don't match
if [ "$CURRENT_URL" != "$NETWORK_IP" ]; then
    print_warning "IP mismatch detected. Updating config..."
    print_status "Current: $CURRENT_URL"
    print_status "New: $NETWORK_IP"
    
    # Create backup
    cp "$CONFIG_FILE" "${CONFIG_FILE}.backup"
    
    # Update the config file
    if [ -n "$CURRENT_URL" ]; then
        sed -i '' "s|$CURRENT_URL|$NETWORK_IP|g" "$CONFIG_FILE"
    else
        print_error "Could not find current URL pattern in config file"
        kill $DEV_PID 2>/dev/null || true
        rm -f dev_output.log
        exit 1
    fi
    
    print_status "Config updated successfully"
else
    print_status "IP already matches, no update needed"
fi

# Step 4: Sync and open iOS
print_status "Syncing and opening iOS..."
NODE_ENV=development npx cap sync ios && npx cap open ios

print_status "✅ Setup complete!"
print_status "Starting dev server at: $NETWORK_IP"
print_status "iOS project opened in Xcode"
print_status ""
print_status "Press Ctrl+C to stop the dev server"

# Start dev server in foreground
npm run dev -- --host