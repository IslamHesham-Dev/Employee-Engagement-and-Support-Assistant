#!/usr/bin/env python3
"""
Test RAG pipeline with OpenAI API
"""

import os
from dotenv import load_dotenv
from rag_pipeline import answer_question

# Load environment variables
load_dotenv()


def test_rag_pipeline():
    """Test the RAG pipeline with OpenAI"""
    print("🚀 Testing RAG Pipeline with OpenAI")
    print("=" * 50)

    # Test questions
    test_questions = [
        "What are the working hours in Egypt?",
        "What is the minimum wage in Egypt?",
        "What are the maternity leave rules?"
    ]

    for i, question in enumerate(test_questions, 1):
        print(f"\n{i}️⃣ Question: {question}")
        print("-" * 50)

        try:
            result = answer_question(question)
            print(f"✅ Answer: {result['answer']}")
            print(f"📊 Confidence: {result['confidence']:.3f}")

            if result['retrieved']:
                print(f"📚 Sources found: {len(result['retrieved'])}")
                for j, (score, doc) in enumerate(result['retrieved'][:2], 1):
                    print(
                        f"   {j}. {doc.get('section', 'N/A')} (Score: {score:.3f})")
            else:
                print("📚 No sources retrieved")

        except Exception as e:
            print(f"❌ Error: {e}")

        print("-" * 50)

    print("\n🎉 RAG Pipeline test completed!")


if __name__ == "__main__":
    test_rag_pipeline()
