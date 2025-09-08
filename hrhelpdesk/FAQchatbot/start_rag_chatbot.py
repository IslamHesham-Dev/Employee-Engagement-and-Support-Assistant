#!/usr/bin/env python3
"""
RAG-based AI Chatbot Service Startup Script
This script starts the Flask-based AI chatbot service with OpenAI API and RAG pipeline
"""

import os
import sys
import subprocess
import time
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        print(f"Current version: {sys.version}")
        return False
    print(f"✅ Python version: {sys.version}")
    return True


def check_dependencies():
    """Check if required dependencies are installed"""
    required_packages = [
        'flask', 'openai', 'sentence_transformers', 'faiss', 'psycopg2',
        'deep_translator', 'pyarabic', 'numpy', 'requests', 'beautifulsoup4'
    ]

    missing_packages = []

    for package in required_packages:
        try:
            if package == 'sentence_transformers':
                __import__('sentence_transformers')
            elif package == 'faiss':
                __import__('faiss')
            elif package == 'psycopg2':
                __import__('psycopg2')
            elif package == 'deep_translator':
                __import__('deep_translator')
            elif package == 'pyarabic':
                __import__('pyarabic')
            elif package == 'beautifulsoup4':
                __import__('bs4')
            else:
                __import__(package.replace('-', '_'))
            print(f"✅ {package}")
        except ImportError:
            missing_packages.append(package)
            print(f"❌ {package}")

    if missing_packages:
        print(f"\n❌ Missing packages: {', '.join(missing_packages)}")
        print("Install them using: pip install -r requirements.txt")
        return False

    return True


def check_openai_key():
    """Check if OpenAI API key is available"""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ OpenAI API key not found in environment variables")
        print("Please set OPENAI_API_KEY environment variable")
        return False

    if not api_key.startswith("sk-"):
        print("❌ Invalid OpenAI API key format")
        return False

    print("✅ OpenAI API key found")
    return True


def check_database_connection():
    """Test database connection"""
    try:
        from chatbot_service import get_db_connection
        conn = get_db_connection()
        if conn:
            conn.close()
            print("✅ Database connection successful")
            return True
        else:
            print("❌ Database connection failed")
            return False
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return False


def test_rag_pipeline():
    """Test RAG pipeline initialization"""
    try:
        from rag_pipeline import get_rag_pipeline
        print("🔄 Initializing RAG pipeline...")
        rag = get_rag_pipeline()
        print("✅ RAG pipeline initialized successfully")

        # Test with a simple question
        print("🧪 Testing RAG pipeline with sample question...")
        test_result = rag.answer("What are the working hours in Egypt?")
        if test_result and test_result.get('answer'):
            print("✅ RAG pipeline test successful")
            return True
        else:
            print("❌ RAG pipeline test failed")
            return False
    except Exception as e:
        print(f"❌ RAG pipeline error: {e}")
        return False


def install_dependencies():
    """Install required dependencies"""
    print("\n📦 Installing dependencies...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
                       check=True, capture_output=True, text=True)
        print("✅ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False


def start_service():
    """Start the Flask service"""
    print("\n🚀 Starting RAG-based AI Chatbot Service...")

    # Set environment variables
    os.environ['FLASK_APP'] = 'chatbot_service.py'
    os.environ['FLASK_ENV'] = 'development'

    try:
        # Import and run the Flask app
        from chatbot_service import app
        print("✅ Service imported successfully")
        print("📍 Service will be available at: http://localhost:5000")
        print("🔗 Health check: http://localhost:5000/health")
        print("🔗 Ask endpoint: http://localhost:5000/ask")
        print("🔗 Common questions: http://localhost:5000/common-questions")
        print("🔗 Feedback endpoint: http://localhost:5000/feedback")
        print("=" * 50)

        app.run(
            host=os.getenv('HOST', '0.0.0.0'),
            port=int(os.getenv('PORT', 5000)),
            debug=os.getenv('FLASK_DEBUG', 'true').lower() == 'true',
            threaded=True
        )

    except Exception as e:
        print(f"❌ Error starting service: {e}")
        return False


def main():
    """Main startup function"""
    print("🤖 HRHelpDesk RAG-based AI Chatbot Service Startup")
    print("=" * 60)

    # Check Python version
    if not check_python_version():
        sys.exit(1)

    # Check dependencies
    print("\n📋 Checking dependencies...")
    if not check_dependencies():
        print("\n💡 Installing missing dependencies...")
        if not install_dependencies():
            sys.exit(1)
        # Re-check after installation
        if not check_dependencies():
            sys.exit(1)

    # Check OpenAI API key
    print("\n🔑 Checking OpenAI API key...")
    if not check_openai_key():
        print("❌ Please set your OpenAI API key in environment variables")
        print("   You can set it by running: set OPENAI_API_KEY=your_key_here")
        sys.exit(1)

    # Check database connection
    print("\n🗄️  Checking database connection...")
    if not check_database_connection():
        print("❌ Please check your database configuration")
        print("   Make sure PostgreSQL is running and accessible")
        sys.exit(1)

    # Test RAG pipeline
    print("\n🧠 Testing RAG pipeline...")
    if not test_rag_pipeline():
        print("❌ RAG pipeline initialization failed")
        print("   This might be due to network issues or OpenAI API problems")
        sys.exit(1)

    # Start the service
    start_service()


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Service stopped by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)
