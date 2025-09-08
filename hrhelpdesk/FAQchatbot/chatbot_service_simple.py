"""
Simplified AI Chatbot Service for HR Help Desk
Uses OpenAI API with RAG pipeline for Egypt Labour Law questions
"""

import os
import logging
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from deep_translator import GoogleTranslator
from pyarabic.araby import strip_tashkeel

# Import our RAG pipeline
from rag_pipeline import answer_question, get_rag_pipeline

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Database setup
DATABASE_URL = os.getenv(
    'DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/hrhelpdesk')

# Initialize translators
translator_ar = GoogleTranslator(source='en', target='ar')
translator_en = GoogleTranslator(source='ar', target='en')

# Set up logging
logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s | %(levelname)s | %(message)s")


def get_db_connection():
    """Get database connection"""
    try:
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        return conn
    except Exception as e:
        logging.error(f"Database connection error: {e}")
        return None


def init_database():
    """Initialize the database with required tables"""
    try:
        conn = get_db_connection()
        if not conn:
            logging.error("Failed to connect to database")
            return

        cursor = conn.cursor()

        # Create questions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS questions (
                question_id BIGSERIAL PRIMARY KEY,
                question_text TEXT NOT NULL,
                answer_text TEXT,
                status VARCHAR(20) DEFAULT 'pending',
                confidence_score FLOAT DEFAULT 0.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Create feedback table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS feedback (
                feed_id BIGSERIAL PRIMARY KEY,
                question_id BIGINT NOT NULL,
                is_good BOOLEAN NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (question_id) REFERENCES questions (question_id) ON DELETE CASCADE
            )
        ''')

        # Check existing data
        cursor.execute('SELECT COUNT(*) as count FROM questions')
        questions_count = cursor.fetchone()['count']

        cursor.execute('SELECT COUNT(*) as count FROM feedback')
        feedback_count = cursor.fetchone()['count']

        conn.commit()
        cursor.close()
        conn.close()

        logging.info(f"✅ Database connection successful!")
        logging.info(f"📊 Existing questions: {questions_count}")
        logging.info(f"📊 Existing feedback: {feedback_count}")

    except Exception as e:
        logging.error(f"❌ Database initialization error: {e}")


def store_question(question_text, answer_text, status, confidence_score=0.0):
    """Store question and answer in database"""
    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        if not conn:
            logging.error("Failed to get database connection")
            return None

        cursor = conn.cursor()

        insert_query = '''
            INSERT INTO questions (question_text, answer_text, status, confidence_score, created_at)
            VALUES (%s, %s, %s, %s, %s) 
            RETURNING question_id
        '''

        cursor.execute(insert_query, (
            question_text,
            answer_text,
            status,
            confidence_score,
            datetime.now()
        ))

        result = cursor.fetchone()
        if result and 'question_id' in result:
            question_id = result['question_id']
            conn.commit()
            logging.info(
                f"✅ Question stored with ID: {question_id}, Status: {status}")
            return question_id
        else:
            logging.error("❌ No question_id returned from insert")
            conn.rollback()
            return None

    except Exception as e:
        logging.error(f"❌ Database error storing question: {e}")
        if conn:
            try:
                conn.rollback()
            except:
                pass
        return None

    finally:
        if cursor:
            try:
                cursor.close()
            except:
                pass
        if conn:
            try:
                conn.close()
            except:
                pass


def detect_language(text: str) -> str:
    """Detect if text is Arabic or English"""
    try:
        arabic_chars = sum(1 for char in text if '\u0600' <= char <= '\u06FF')
        if arabic_chars > len(text) * 0.3:
            return 'ar'
        return 'en'
    except Exception as e:
        logging.error(f"Language detection error: {e}")
        return 'en'


def translate_text(text: str, target_lang: str = 'ar') -> str:
    """Translate text to target language"""
    try:
        if target_lang == 'ar':
            return translator_ar.translate(text)
        else:
            return translator_en.translate(text)
    except Exception as e:
        logging.error(f"Translation error: {e}")
        return text


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Check database connection
        conn = get_db_connection()
        if conn:
            conn.close()
            db_status = 'healthy'
        else:
            db_status = 'unhealthy'

        # Check RAG pipeline
        try:
            rag = get_rag_pipeline()
            rag_status = 'healthy'
        except Exception as e:
            logging.error(f"RAG pipeline error: {e}")
            rag_status = 'unhealthy'

        return jsonify({
            'status': 'healthy' if db_status == 'healthy' and rag_status == 'healthy' else 'unhealthy',
            'database': db_status,
            'rag_pipeline': rag_status,
            'timestamp': datetime.now().isoformat()
        }), 200 if db_status == 'healthy' and rag_status == 'healthy' else 503

    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500


@app.route('/test-rag', methods=['GET'])
def test_rag():
    """Test RAG pipeline endpoint"""
    try:
        test_question = "What are the working hours in Egypt?"
        result = answer_question(test_question)

        return jsonify({
            'test_question': test_question,
            'result': result,
            'status': 'success'
        }), 200

    except Exception as e:
        logging.error(f"RAG test error: {e}")
        import traceback
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc(),
            'status': 'error'
        }), 500


@app.route('/common-questions', methods=['GET'])
def get_common_questions():
    """Get list of common questions for dropdown"""
    try:
        language = request.args.get('language', 'ar')

        if language == 'ar':
            questions = [
                {"id": "working_hours", "text": "كم ساعات العمل في اليوم؟"},
                {"id": "work_schedule", "text": "ما هي أوقات الدوام؟"},
                {"id": "overtime", "text": "كيف يتم حساب ساعات العمل الإضافي؟"},
                {"id": "remote_work", "text": "هل يمكنني العمل من المنزل؟"},
                {"id": "vacation", "text": "كم لي من إجازات متبقية؟"},
                {"id": "sick_leave", "text": "ما هي سياسة الإجازة المرضية？"},
                {"id": "payday", "text": "متى يتم صرف الراتب؟"},
                {"id": "department", "text": "أريد تغيير قسمي"},
                {"id": "resignation", "text": "أريد تقديم استقالة"},
            ]
        else:
            questions = [
                {"id": "working_hours", "text": "What are the working hours per day?"},
                {"id": "work_schedule", "text": "What is the work schedule?"},
                {"id": "overtime", "text": "How is overtime calculated?"},
                {"id": "remote_work", "text": "Can I work from home?"},
                {"id": "vacation", "text": "How many vacation days do I have remaining?"},
                {"id": "sick_leave", "text": "What is the sick leave policy?"},
                {"id": "payday", "text": "When is payday?"},
                {"id": "department", "text": "I want to change my department"},
                {"id": "resignation", "text": "I want to submit a resignation"},
            ]

        return jsonify({"questions": questions}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to get common questions: {str(e)}"}), 500


@app.route('/ask', methods=['POST'])
def ask_question():
    """Main endpoint to handle user questions with RAG pipeline"""
    # Default response in case of any error
    default_response = {
        "answers": ["I apologize, but I'm experiencing technical difficulties. Please try again later."],
        "confidence_scores": [0.0],
        "question_id": None,
        "status": "error",
        "session_id": "default",
        "rag_sources": []
    }

    try:
        # Get request data
        data = request.get_json()
        if not data or 'question' not in data:
            return jsonify({"error": "Missing 'question' in request"}), 400

        original_question = data['question']
        user_language = data.get('language', 'ar')
        session_id = data.get('session_id', 'default')

        logging.info(f"Question: {original_question}")
        logging.info(f"Language: {user_language}")
        logging.info(f"Session: {session_id}")

        # Initialize default values
        confidence = 0.0
        rag_answer = "No answer generated"
        rag_sources = []
        status = 'pending'
        question_id = None

        # Process through RAG pipeline
        try:
            logging.info("Calling RAG pipeline...")
            rag_result = answer_question(original_question)
            logging.info(f"RAG result received: {type(rag_result)}")

            if rag_result and isinstance(rag_result, dict):
                confidence = rag_result.get('confidence', 0.0)
                rag_answer = rag_result.get('answer', 'No answer generated')

                # Format RAG sources properly
                if rag_result.get('retrieved'):
                    for score, doc in rag_result['retrieved'][:3]:
                        rag_sources.append({
                            "url": doc.get("url", ""),
                            "section": doc.get("section", ""),
                            "score": score
                        })

                logging.info(
                    f"RAG processing successful - Confidence: {confidence}")
            else:
                logging.warning("RAG result is not a valid dictionary")

        except Exception as rag_error:
            logging.error(f"RAG pipeline error: {rag_error}")
            import traceback
            logging.error(f"RAG traceback: {traceback.format_exc()}")

        # Translate answer if needed
        if user_language == 'en' and rag_answer != "No answer generated":
            try:
                rag_answer = translate_text(rag_answer, 'en')
            except Exception as e:
                logging.error(f"Translation error: {e}")

        # Determine status based on confidence
        if confidence < 0.3:  # Low confidence threshold
            status = 'pending'
            final_answer = user_language == 'ar' \
                and 'عذرًا، لم أجد إجابة مناسبة لسؤالك، لقد أرسلنا سؤالك لفريقنا للإجابة عليه في أقرب وقت ممكن.' \
                or 'Sorry, I could not find a suitable answer to your question, we sent this question to our team to answer you as soon as possible.'
        else:
            status = 'answered'
            final_answer = rag_answer

        # Store in database
        try:
            question_id = store_question(
                original_question,
                final_answer,
                status,
                confidence
            )
            logging.info(
                f"Question stored - ID: {question_id}, Status: {status}, Confidence: {confidence}")
        except Exception as db_error:
            logging.error(f"Database storage error: {db_error}")
            question_id = None

        # Return response
        return jsonify({
            "answers": [final_answer],
            "confidence_scores": [confidence],
            "question_id": question_id,
            "status": status,
            "session_id": session_id,
            "rag_sources": rag_sources
        }), 200

    except Exception as e:
        logging.error(f"Error in ask_question: {e}")
        import traceback
        logging.error(f"Traceback: {traceback.format_exc()}")
        return jsonify(default_response), 500


@app.route('/feedback', methods=['POST'])
def submit_feedback():
    """Endpoint to submit feedback for answers"""
    try:
        data = request.get_json()

        if not data or 'question_id' not in data or 'is_good' not in data:
            return jsonify({"error": "Missing required fields"}), 400

        question_id = data['question_id']
        is_good = data['is_good']

        # For now, just return success
        return jsonify({"message": "Feedback received successfully"}), 200

    except Exception as e:
        logging.error(f"Error in submit_feedback: {e}")
        return jsonify({"error": "Internal server error"}), 500


# Initialize database on startup
init_database()

if __name__ == '__main__':
    logging.info("🚀 Starting Simplified AI Chatbot Service...")
    logging.info("📍 Server will be available at: http://localhost:5000")
    logging.info("🔗 Health check: http://localhost:5000/health")
    logging.info("🔗 Ask endpoint: http://localhost:5000/ask")
    logging.info("🔗 Common questions: http://localhost:5000/common-questions")
    logging.info("🔗 Feedback endpoint: http://localhost:5000/feedback")
    logging.info("=" * 50)

    try:
        app.run(
            host='0.0.0.0',
            port=5000,
            debug=True,
            threaded=True
        )
    except Exception as e:
        logging.error(f"❌ Error starting server: {e}")
        input("Press Enter to exit...")
