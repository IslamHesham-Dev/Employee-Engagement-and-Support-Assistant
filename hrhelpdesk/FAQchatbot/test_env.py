#!/usr/bin/env python3
"""
Test script to check environment variable loading
"""

import os
from dotenv import load_dotenv

print("🔍 Testing Environment Variable Loading...")
print("=" * 50)

# Load .env file
load_dotenv()

# Check if API key is loaded
api_key = os.getenv('OPENAI_API_KEY')
if api_key:
    print(f"✅ OpenAI API Key found: {api_key[:20]}...")
    print(f"✅ Key length: {len(api_key)} characters")
else:
    print("❌ OpenAI API Key not found")

# Check other environment variables
print(f"\n📋 Other Environment Variables:")
print(f"DATABASE_URL: {os.getenv('DATABASE_URL', 'Not set')}")
print(f"FLASK_ENV: {os.getenv('FLASK_ENV', 'Not set')}")

print("\n" + "=" * 50)
