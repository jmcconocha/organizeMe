#!/bin/bash
# Project Management Dashboard - Startup Script

echo "🚀 Starting Project Management Dashboard..."

# Kill any existing processes on port 3000
echo "🔍 Checking for existing processes on port 3000..."
PORT_PID=$(lsof -ti:3000 2>/dev/null)
if [ -n "$PORT_PID" ]; then
    echo "⚠️  Found existing process(es) on port 3000: $PORT_PID"
    echo "🛑 Killing existing processes..."
    kill -9 $PORT_PID 2>/dev/null
    sleep 2
    echo "✅ Cleared port 3000"
fi

# Also kill any stuck next-server processes
echo "🔍 Checking for stuck Next.js processes..."
pkill -9 -f "next-server" 2>/dev/null
pkill -9 -f "next dev" 2>/dev/null
sleep 1

# Check if node_modules exists or if package.json is newer than node_modules
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Clear Next.js cache if it exists (can cause issues)
if [ -d ".next" ]; then
    echo "🧹 Clearing Next.js cache..."
    rm -rf .next
fi

# Start the development server
echo "🌐 Starting Next.js development server on http://localhost:3000"
echo "📝 Press Ctrl+C to stop the server"
echo ""
npm run dev
