#!/usr/bin/env python3
"""
AI Chatbot Service Startup Script
This script starts the Flask-based AI chatbot service for HRHelpDesk
"""

import os
import sys
import subprocess
import time
from pathlib import Path


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
        'flask', 'torch', 'transformers', 'psycopg2',
        'deep_translator', 'pyarabic', 'numpy'
    ]

    missing_packages = []

    for package in required_packages:
        try:
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


def check_model_files():
    """Check if AI model files exist"""
    model_path = Path("FAQ-Model")
    required_files = ["config.json", "pytorch_model.bin", "tokenizer.json"]

    if not model_path.exists():
        print("❌ FAQ-Model directory not found")
        return False

    missing_files = []
    for file in required_files:
        if not (model_path / file).exists():
            missing_files.append(file)

    if missing_files:
        print(f"❌ Missing model files: {', '.join(missing_files)}")
        return False

    print("✅ AI model files found")
    return True


def check_database_connection():
    """Test database connection"""
    try:
        from run import get_db_connection
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
    print("\n🚀 Starting AI Chatbot Service...")

    # Set environment variables
    os.environ['FLASK_APP'] = 'run.py'
    os.environ['FLASK_ENV'] = 'development'

    try:
        # Import and run the Flask app
        from run import app
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
    print("🤖 HRHelpDesk AI Chatbot Service Startup")
    print("=" * 50)

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

    # Check model files
    print("\n🤖 Checking AI model files...")
    if not check_model_files():
        print("❌ Please ensure the FAQ-Model directory contains all required files")
        sys.exit(1)

    # Check database connection
    print("\n🗄️  Checking database connection...")
    if not check_database_connection():
        print("❌ Please check your database configuration in .env file")
        print("   Make sure PostgreSQL is running and accessible")
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
