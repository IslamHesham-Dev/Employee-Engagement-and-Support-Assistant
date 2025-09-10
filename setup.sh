#!/bin/bash

# HR HelpDesk Setup Script
# This script sets up the development environment for the HR HelpDesk application

set -e

echo "🚀 Setting up HR HelpDesk Development Environment"
echo "=================================================="

# Check if required tools are installed
check_requirements() {
    echo "📋 Checking requirements..."
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo "❌ npm is not installed. Please install npm first."
        exit 1
    fi
    
    if ! command -v python3 &> /dev/null; then
        echo "❌ Python 3 is not installed. Please install Python 3.9+ first."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo "⚠️  Docker is not installed. You'll need to set up PostgreSQL manually."
    fi
    
    echo "✅ Requirements check completed"
}

# Setup environment files
setup_env_files() {
    echo "📝 Setting up environment files..."
    
    # Backend environment
    if [ ! -f "hrhelpdesk/backend/.env" ]; then
        cp hrhelpdesk/backend/.env.example hrhelpdesk/backend/.env
        echo "✅ Created backend/.env from example"
    else
        echo "⚠️  backend/.env already exists, skipping..."
    fi
    
    # Frontend environment
    if [ ! -f "hrhelpdesk/frontend/.env" ]; then
        cp hrhelpdesk/frontend/.env.example hrhelpdesk/frontend/.env
        echo "✅ Created frontend/.env from example"
    else
        echo "⚠️  frontend/.env already exists, skipping..."
    fi
    
    # AI Chatbot environment
    if [ ! -f "hrhelpdesk/FAQchatbot/.env" ]; then
        cp hrhelpdesk/FAQchatbot/.env.example hrhelpdesk/FAQchatbot/.env
        echo "✅ Created FAQchatbot/.env from example"
    else
        echo "⚠️  FAQchatbot/.env already exists, skipping..."
    fi
}

# Install dependencies
install_dependencies() {
    echo "📦 Installing dependencies..."
    
    # Root dependencies
    echo "Installing root dependencies..."
    npm install
    
    # Backend dependencies
    echo "Installing backend dependencies..."
    cd hrhelpdesk/backend && npm install && cd ../..
    
    # Frontend dependencies
    echo "Installing frontend dependencies..."
    cd hrhelpdesk/frontend && npm install && cd ../..
    
    # AI Chatbot dependencies
    echo "Installing AI chatbot dependencies..."
    cd hrhelpdesk/FAQchatbot && pip install -r requirements.txt && cd ../..
    
    echo "✅ All dependencies installed"
}

# Setup database
setup_database() {
    echo "🗄️  Setting up database..."
    
    if command -v docker &> /dev/null; then
        echo "Starting PostgreSQL with Docker..."
        docker-compose up -d postgres
        
        # Wait for database to be ready
        echo "Waiting for database to be ready..."
        sleep 10
        
        # Run migrations
        echo "Running database migrations..."
        cd hrhelpdesk/backend && npx prisma migrate dev && npx prisma db seed && cd ../..
        
        echo "✅ Database setup completed"
    else
        echo "⚠️  Docker not available. Please set up PostgreSQL manually and run:"
        echo "   cd hrhelpdesk/backend && npx prisma migrate dev && npx prisma db seed"
    fi
}

# Main setup function
main() {
    check_requirements
    setup_env_files
    install_dependencies
    setup_database
    
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Update the .env files with your actual API keys and configuration"
    echo "2. Start the development servers:"
    echo "   npm run dev"
    echo ""
    echo "Access the application at:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend:  http://localhost:3001"
    echo "  Chatbot:  http://localhost:5000"
    echo ""
    echo "Happy coding! 🚀"
}

# Run main function
main

