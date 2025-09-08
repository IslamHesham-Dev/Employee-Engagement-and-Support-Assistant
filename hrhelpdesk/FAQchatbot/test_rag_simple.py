#!/usr/bin/env python3
"""
Simple test for RAG pipeline with OpenAI
"""

import os
from dotenv import load_dotenv
import openai

# Load environment variables
load_dotenv()

# Set OpenAI API key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY
    print("✅ OpenAI API key loaded")
else:
    print("❌ OpenAI API key not found")
    exit(1)


def test_openai_embeddings():
    """Test OpenAI embeddings API"""
    try:
        print("🧪 Testing OpenAI embeddings...")

        # Test with a simple text
        response = openai.embeddings.create(
            model="text-embedding-3-small",
            input="What are the working hours in Egypt?"
        )

        embedding = response.data[0].embedding
        print(f"✅ Embedding generated successfully")
        print(f"📊 Embedding dimension: {len(embedding)}")
        print(f"📊 First 5 values: {embedding[:5]}")

        return True

    except Exception as e:
        print(f"❌ Error testing embeddings: {e}")
        return False


def test_openai_chat():
    """Test OpenAI chat completion"""
    try:
        print("\n🧪 Testing OpenAI chat completion...")

        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": "What are the working hours in Egypt? Answer in one sentence."}
            ],
            max_tokens=100
        )

        answer = response.choices[0].message.content
        print(f"✅ Chat completion successful")
        print(f"📝 Answer: {answer}")

        return True

    except Exception as e:
        print(f"❌ Error testing chat completion: {e}")
        return False


if __name__ == "__main__":
    print("🚀 Testing OpenAI API Integration")
    print("=" * 50)

    # Test embeddings
    embeddings_ok = test_openai_embeddings()

    # Test chat completion
    chat_ok = test_openai_chat()

    print("\n" + "=" * 50)
    if embeddings_ok and chat_ok:
        print("🎉 All tests passed! OpenAI API is working correctly.")
    else:
        print("❌ Some tests failed. Check the errors above.")
