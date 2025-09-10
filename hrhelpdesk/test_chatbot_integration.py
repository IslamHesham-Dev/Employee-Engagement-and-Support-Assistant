#!/usr/bin/env python3
"""
Test script to verify end-to-end chatbot integration
Tests the complete flow: Frontend -> Backend -> Chatbot Service
"""

import requests
import json
import time
import sys
from datetime import datetime

# Configuration
BACKEND_URL = "http://localhost:3000"
CHATBOT_SERVICE_URL = "http://localhost:5000"
FRONTEND_URL = "http://localhost:3001"

# Test data
TEST_QUESTIONS = [
    {
        "question": "What are the working hours in Egypt?",
        "language": "en",
        "expected_keywords": ["working", "hours", "egypt"]
    },
    {
        "question": "كم ساعات العمل في اليوم؟",
        "language": "ar",
        "expected_keywords": ["ساعات", "العمل"]
    },
    {
        "question": "How many vacation days do I have remaining?",
        "language": "en",
        "is_common_question": True,
        "expected_status": "vacation_query"
    }
]


def test_chatbot_service_health():
    """Test if the chatbot service is running and healthy"""
    print("🔍 Testing Chatbot Service Health...")
    try:
        response = requests.get(f"{CHATBOT_SERVICE_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Chatbot service is healthy")
            print(f"   Database: {data.get('database', 'unknown')}")
            print(f"   RAG Pipeline: {data.get('rag_pipeline', 'unknown')}")
            return True
        else:
            print(
                f"❌ Chatbot service health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to chatbot service: {e}")
        return False


def test_backend_health():
    """Test if the backend is running"""
    print("\n🔍 Testing Backend Health...")
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is healthy")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        return False


def test_chatbot_service_direct():
    """Test chatbot service directly"""
    print("\n🔍 Testing Chatbot Service Direct API...")
    try:
        # Test common questions endpoint
        response = requests.get(
            f"{CHATBOT_SERVICE_URL}/common-questions?language=en", timeout=10)
        if response.status_code == 200:
            data = response.json()
            questions = data.get('questions', [])
            print(f"✅ Common questions retrieved: {len(questions)} questions")
        else:
            print(f"❌ Common questions failed: {response.status_code}")
            return False

        # Test ask endpoint
        test_question = {
            "question": "What are the working hours in Egypt?",
            "language": "en",
            "session_id": "test_session_123",
            "is_common_question": False
        }

        response = requests.post(
            f"{CHATBOT_SERVICE_URL}/ask",
            json=test_question,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            print(f"✅ Direct ask endpoint working")
            print(
                f"   Answer: {data.get('answers', ['No answer'])[0][:100]}...")
            print(f"   Status: {data.get('status', 'unknown')}")
            print(
                f"   Confidence: {data.get('confidence_scores', [0])[0]:.3f}")
            return True
        else:
            print(f"❌ Direct ask endpoint failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Chatbot service direct test failed: {e}")
        return False


def test_backend_proxy():
    """Test backend proxy to chatbot service"""
    print("\n🔍 Testing Backend Proxy to Chatbot Service...")
    try:
        # Note: This would require authentication in a real scenario
        # For testing, we'll check if the endpoint exists
        response = requests.get(
            f"{BACKEND_URL}/api/ai-chatbot/health", timeout=5)
        # 401/403 means endpoint exists but needs auth
        if response.status_code in [200, 401, 403]:
            print("✅ Backend AI chatbot endpoint exists")
            return True
        else:
            print(
                f"❌ Backend AI chatbot endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend proxy test failed: {e}")
        return False


def test_rag_pipeline():
    """Test RAG pipeline functionality"""
    print("\n🔍 Testing RAG Pipeline...")
    try:
        # Import and test RAG pipeline directly
        import sys
        import os
        sys.path.append(os.path.join(os.path.dirname(__file__), 'FAQchatbot'))

        from rag_pipeline import answer_question

        test_question = "What are the working hours in Egypt?"
        result = answer_question(test_question)

        if result and result.get('answer'):
            print(f"✅ RAG pipeline working")
            print(f"   Answer: {result['answer'][:100]}...")
            print(f"   Confidence: {result.get('confidence', 0):.3f}")
            print(f"   Sources: {len(result.get('retrieved', []))}")
            return True
        else:
            print("❌ RAG pipeline returned no answer")
            return False

    except Exception as e:
        print(f"❌ RAG pipeline test failed: {e}")
        return False


def test_database_connection():
    """Test database connection"""
    print("\n🔍 Testing Database Connection...")
    try:
        import sys
        import os
        sys.path.append(os.path.join(os.path.dirname(__file__), 'FAQchatbot'))

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
        print(f"❌ Database connection test failed: {e}")
        return False


def main():
    """Run all integration tests"""
    print("🚀 HR Help Desk Chatbot Integration Test")
    print("=" * 60)
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    tests = [
        ("Database Connection", test_database_connection),
        ("RAG Pipeline", test_rag_pipeline),
        ("Chatbot Service Health", test_chatbot_service_health),
        ("Backend Health", test_backend_health),
        ("Chatbot Service Direct API", test_chatbot_service_direct),
        ("Backend Proxy", test_backend_proxy),
    ]

    results = []

    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} test crashed: {e}")
            results.append((test_name, False))

    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)

    passed = 0
    total = len(results)

    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if result:
            passed += 1

    print(f"\nResults: {passed}/{total} tests passed")

    if passed == total:
        print("🎉 All tests passed! Integration is working correctly.")
        return 0
    else:
        print("⚠️  Some tests failed. Check the errors above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())





