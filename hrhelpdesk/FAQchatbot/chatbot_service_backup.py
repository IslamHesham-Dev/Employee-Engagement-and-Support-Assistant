"""
AI Chatbot Service for HR Help Desk
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


def store_feedback(question_id, is_good):
    """Store feedback for a question"""
    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        if not conn:
            return False

        cursor = conn.cursor()

        # Check if the question exists
        cursor.execute(
            'SELECT question_id FROM questions WHERE question_id = %s', (question_id,))
        if not cursor.fetchone():
            logging.error(f"❌ Question ID {question_id} does not exist")
            return False

        # Insert feedback
        cursor.execute('''
            INSERT INTO feedback (question_id, is_good, created_at)
            VALUES (%s, %s, %s)
            RETURNING feed_id
        ''', (question_id, is_good, datetime.now()))

        result = cursor.fetchone()
        if result and 'feed_id' in result:
            feed_id = result['feed_id']
            conn.commit()
            logging.info(
                f"✅ Feedback stored with ID: {feed_id} for question {question_id}")
            return True
        else:
            logging.error("❌ No feed_id returned from insert")
            conn.rollback()
            return False

    except Exception as e:
        logging.error(f"❌ Feedback storage error: {e}")
        if conn:
            try:
                conn.rollback()
            except:
                pass
        return False

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


def get_employee_vacation(employee_id):
    """Get employee vacation information from database"""
    try:
        conn = get_db_connection()
        if not conn:
            return None

        cursor = conn.cursor()
        cursor.execute('''
            SELECT employee_id, name, remaining_vacations
            FROM employees 
            WHERE employee_id = %s
        ''', (employee_id,))

        result = cursor.fetchone()
        cursor.close()
        conn.close()

        if result:
            return {
                'employee_id': result['employee_id'],
                'name': result['name'],
                'remaining_vacations': result['remaining_vacations']
            }
        return None

    except Exception as e:
        logging.error(f"❌ Error fetching employee vacation: {e}")
        return None


def get_employee_department(employee_id):
    """Get employee's current department information"""
    try:
        conn = get_db_connection()
        if not conn:
            return None

        cursor = conn.cursor()
        cursor.execute('''
            SELECT e.employee_id, e.name as employee_name, e.department_id,
                   d.department_name, d.department_head
            FROM employees e
            JOIN departments d ON e.department_id = d.department_id
            WHERE e.employee_id = %s
        ''', (employee_id,))

        result = cursor.fetchone()
        cursor.close()
        conn.close()

        if result:
            return {
                'employee_id': result['employee_id'],
                'employee_name': result['employee_name'],
                'current_department_id': result['department_id'],
                'current_department_name': result['department_name'],
                'current_department_head': result['department_head']
            }
        return None

    except Exception as e:
        logging.error(f"❌ Error fetching employee department: {e}")
        return None


def get_department_by_name(department_name):
    """Get department information by name"""
    try:
        conn = get_db_connection()
        if not conn:
            return None

        cursor = conn.cursor()
        cursor.execute('''
            SELECT department_id, department_name, department_head
            FROM departments 
            WHERE LOWER(TRIM(department_name)) = LOWER(TRIM(%s))
        ''', (department_name,))

        result = cursor.fetchone()
        cursor.close()
        conn.close()

        if result:
            return {
                'department_id': result['department_id'],
                'department_name': result['department_name'],
                'department_head': result['department_head']
            }
        return None

    except Exception as e:
        logging.error(f"❌ Error fetching department: {e}")
        return None


def get_all_departments():
    """Get all available departments"""
    try:
        conn = get_db_connection()
        if not conn:
            return []

        cursor = conn.cursor()
        cursor.execute('''
            SELECT department_name
            FROM departments 
            ORDER BY department_name
        ''')

        results = cursor.fetchall()
        cursor.close()
        conn.close()

        return [row['department_name'] for row in results]

    except Exception as e:
        logging.error(f"❌ Error fetching departments: {e}")
        return []


# Global state to track vacation query mode
vacation_query_sessions = {}


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
                # Working Hours & Schedule
                {"id": "working_hours", "text": "كم ساعات العمل في اليوم؟"},
                {"id": "work_schedule", "text": "ما هي أوقات الدوام؟"},
                {"id": "overtime", "text": "كيف يتم حساب ساعات العمل الإضافي؟"},
                {"id": "remote_work", "text": "هل يمكنني العمل من المنزل؟"},

                # Leave & Vacation
                {"id": "vacation", "text": "كم لي من إجازات متبقية؟"},
                {"id": "sick_leave", "text": "ما هي سياسة الإجازة المرضية؟"},
                {"id": "emergency_leave", "text": "كيف أطلب إجازة طارئة؟"},
                {"id": "leave_types", "text": "ما هي أنواع الإجازات المتاحة؟"},

                # Salary & Benefits
                {"id": "payday", "text": "متى يتم صرف الراتب؟"},
                {"id": "salary_increase", "text": "كيف أطلب زيادة في الراتب؟"},
                {"id": "bonuses", "text": "ما هي المكافآت المتاحة؟"},
                {"id": "health_insurance", "text": "ما هي مزايا التأمين الصحي؟"},

                # HR Policies
                {"id": "department", "text": "أريد تغيير قسمي"},
                {"id": "company_policies", "text": "ما هي سياسات الشركة؟"},
                {"id": "dress_code", "text": "ما هو نظام اللباس في العمل؟"},
                {"id": "attendance", "text": "كيف يتم تسجيل الحضور والانصراف؟"},

                # Training & Development
                {"id": "training", "text": "ما هي برامج التدريب المتاحة؟"},
                {"id": "career_development",
                    "text": "كيف يمكنني تطوير مسيرتي المهنية؟"},
                {"id": "promotion", "text": "كيف أطلب ترقية؟"},

                # Workplace Issues
                {"id": "workplace_safety", "text": "ما هي إجراءات السلامة في العمل؟"},
                {"id": "harassment", "text": "كيف أبلغ عن التحرش في العمل؟"},
                {"id": "complaints", "text": "كيف أقدم شكوى؟"},

                # Resignation & Exit
                {"id": "resignation", "text": "أريد تقديم استقالة"},
                {"id": "notice_period", "text": "ما هي فترة الإشعار المطلوبة؟"},
            ]
        else:
            questions = [
                # Working Hours & Schedule
                {"id": "working_hours", "text": "What are the working hours per day?"},
                {"id": "work_schedule", "text": "What is the work schedule?"},
                {"id": "overtime", "text": "How is overtime calculated?"},
                {"id": "remote_work", "text": "Can I work from home?"},

                # Leave & Vacation
                {"id": "vacation", "text": "How many vacation days do I have remaining?"},
                {"id": "sick_leave", "text": "What is the sick leave policy?"},
                {"id": "emergency_leave", "text": "How do I request emergency leave?"},
                {"id": "leave_types", "text": "What types of leave are available?"},

                # Salary & Benefits
                {"id": "payday", "text": "When is payday?"},
                {"id": "salary_increase", "text": "How do I request a salary increase?"},
                {"id": "bonuses", "text": "What bonuses are available?"},
                {"id": "health_insurance",
                    "text": "What are the health insurance benefits?"},

                # HR Policies
                {"id": "department", "text": "I want to change my department"},
                {"id": "company_policies", "text": "What are the company policies?"},
                {"id": "dress_code", "text": "What is the dress code at work?"},
                {"id": "attendance", "text": "How is attendance tracked?"},

                # Training & Development
                {"id": "training", "text": "What training programs are available?"},
                {"id": "career_development", "text": "How can I develop my career?"},
                {"id": "promotion", "text": "How do I request a promotion?"},

                # Workplace Issues
                {"id": "workplace_safety",
                    "text": "What are the workplace safety procedures?"},
                {"id": "harassment", "text": "How do I report workplace harassment?"},
                {"id": "complaints", "text": "How do I file a complaint?"},

                # Resignation & Exit
                {"id": "resignation", "text": "I want to submit a resignation"},
                {"id": "notice_period", "text": "What is the required notice period?"},
            ]

        return jsonify({"questions": questions}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to get common questions: {str(e)}"}), 500


@app.route('/ask', methods=['POST'])
def ask_question():
    """Main endpoint to handle user questions with RAG pipeline"""
    # Initialize default response
    default_response = {
        "answers": ["I apologize, but I'm experiencing technical difficulties. Please try again later."],
        "confidence_scores": [0.0],
        "question_id": None,
        "status": "error",
        "session_id": "default",
        "rag_sources": []
    }
    
    try:
        data = request.get_json()

        if not data or 'question' not in data:
            return jsonify({"error": "Missing 'question' in request"}), 400

        original_question = data['question']
        user_language = data.get('language', 'ar')
        session_id = data.get('session_id', 'default')
        is_common_question = data.get('is_common_question', False)

        logging.info(f"Question: {original_question}")
        logging.info(f"Language: {user_language}")
        logging.info(f"Session: {session_id}")

        # Handle special queries (vacation, department change, resignation)
        if is_common_question and session_id not in vacation_query_sessions:
            # Handle vacation questions
            vacation_questions = [
                "كم لي من إجازات متبقية؟",
                "How many vacation days do I have remaining?"
            ]

            department_questions = [
                "أريد تغيير قسمي",
                "I want to change my department"
            ]

            resignation_questions = [
                "أريد تقديم استقالة",
                "I want to submit a resignation"
            ]

            is_vacation_dropdown = any(
                vq.strip() == original_question.strip() for vq in vacation_questions)
            is_department_dropdown = any(
                dq.strip() == original_question.strip() for dq in department_questions)
            is_resignation_dropdown = any(
                rq.strip() == original_question.strip() for rq in resignation_questions)

            if is_vacation_dropdown:
                vacation_query_sessions[session_id] = {
                    'waiting_for_id': True, 'type': 'vacation'}
                id_request_message = user_language == 'ar' \
                    and 'يمكنك الاستعلام عن رصيد إجازاتك من خلال قسم الموارد البشرية أو من خلال نظام إدارة الموظفين. عادة ما يحصل الموظفون على 21 يوم إجازة سنوية، ويمكن استخدامها حسب سياسة الشركة.\n\nللمزيد من التفاصيل، يرجى التواصل مع قسم الموارد البشرية.' \
                    or 'You can check your vacation balance through the HR department or the employee management system. Typically, employees receive 21 annual vacation days, which can be used according to company policy.\n\nFor more details, please contact the HR department.'

                return jsonify({
                    "answers": [id_request_message],
                    "confidence_scores": [1.0],
                    "question_id": None,
                    "status": "vacation_query",
                    "session_id": session_id
                }), 200

            elif is_department_dropdown:
                vacation_query_sessions[session_id] = {
                    'waiting_for_department': True, 'type': 'department'}
                departments = get_all_departments()

                if user_language == 'ar':
                    dept_list_formatted = "\n".join(
                        [f"• {dept}" for dept in departments])
                    dept_request_message = f'''إلى أي قسم تريد الانتقال؟

الأقسام المتاحة:
{dept_list_formatted}

يرجى كتابة اسم القسم بالضبط كما هو مكتوب أعلاه.

(اكتب "q" للخروج)'''
                else:
                    dept_list_formatted = "\n".join(
                        [f"• {dept}" for dept in departments])
                    dept_request_message = f'''Which department do you want to switch to?

Available departments:
{dept_list_formatted}

Please type the department name exactly as written above.

(Type "q" to exit)'''

                return jsonify({
                    "answers": [dept_request_message],
                    "confidence_scores": [1.0],
                    "question_id": None,
                    "status": "department_query",
                    "session_id": session_id
                }), 200

            elif is_resignation_dropdown:
                vacation_query_sessions[session_id] = {
                    'waiting_for_id': True, 'type': 'resignation'}
                id_request_message = user_language == 'ar' \
                    and 'للتقديم على الاستقالة، يرجى اتباع الخطوات التالية:\n\n1. كتابة خطاب استقالة رسمي\n2. تقديمه إلى المدير المباشر\n3. إشعار قسم الموارد البشرية\n4. إكمال فترة الإشعار المطلوبة\n\nللمساعدة في هذه العملية، يرجى التواصل مع قسم الموارد البشرية.' \
                    or 'To submit a resignation, please follow these steps:\n\n1. Write a formal resignation letter\n2. Submit it to your direct manager\n3. Notify the HR department\n4. Complete the required notice period\n\nFor assistance with this process, please contact the HR department.'

                return jsonify({
                    "answers": [id_request_message],
                    "confidence_scores": [1.0],
                    "question_id": None,
                    "status": "resignation_query",
                    "session_id": session_id
                }), 200

        # Handle vacation ID response
        elif session_id in vacation_query_sessions and vacation_query_sessions[session_id].get('waiting_for_id'):
            if original_question.strip().lower() == 'q':
                del vacation_query_sessions[session_id]
                exit_message = user_language == 'ar' \
                    and 'تم إلغاء الاستعلام. يمكنك الآن طرح أي سؤال آخر.' \
                    or 'Query cancelled. You can now ask any other question.'

                return jsonify({
                    "answers": [exit_message],
                    "confidence_scores": [1.0],
                    "question_id": None,
                    "status": "query_cancelled",
                    "session_id": session_id
                }), 200

            try:
                employee_id = int(original_question.strip())
                query_type = vacation_query_sessions[session_id].get('type')

                if query_type == 'vacation':
                    employee_data = get_employee_vacation(employee_id)
                    if employee_data:
                        vacation_info_ar = f"مرحباً {employee_data['name']}، لديك {employee_data['remaining_vacations']} يوم إجازة متبقي."
                        vacation_info_en = f"Hello {employee_data['name']}, you have {employee_data['remaining_vacations']} vacation days remaining."
                        vacation_message = user_language == 'ar' and vacation_info_ar or vacation_info_en
                        del vacation_query_sessions[session_id]

                        return jsonify({
                            "answers": [vacation_message],
                            "confidence_scores": [1.0],
                            "question_id": None,
                            "status": "vacation_answered",
                            "session_id": session_id
                        }), 200
                    else:
                        not_found_message = user_language == 'ar' \
                            and f'رقم الموظف {employee_id} غير موجود في النظام. يرجى التحقق من الرقم والمحاولة مرة أخرى.\n\n(اكتب "q" للخروج)' \
                            or f'Employee ID {employee_id} not found in the system. Please check the ID and try again.\n\n(Type "q" to exit)'

                        return jsonify({
                            "answers": [not_found_message],
                            "confidence_scores": [1.0],
                            "question_id": None,
                            "status": "vacation_not_found",
                            "session_id": session_id
                        }), 200

            except ValueError:
                invalid_format_message = user_language == 'ar' \
                    and 'يرجى إدخال رقم موظف صحيح (أرقام فقط).\n\n(اكتب "q" للخروج)' \
                    or 'Please enter a valid employee ID (numbers only).\n\n(Type "q" to exit)'

                return jsonify({
                    "answers": [invalid_format_message],
                    "confidence_scores": [1.0],
                    "question_id": None,
                    "status": "vacation_invalid_format",
                    "session_id": session_id
                }), 200

        # Regular RAG-based question processing
        else:
            # Clear any existing vacation session if it's a new question
            if session_id in vacation_query_sessions and not any(key in vacation_query_sessions[session_id] for key in ['waiting_for_id', 'waiting_for_department']):
                del vacation_query_sessions[session_id]

            logging.info("Processing as RAG question")

            # Detect language and prepare question for RAG
            detected_lang = detect_language(original_question)
            logging.info(f"Detected language: {detected_lang}")

            # Initialize default values
            confidence = 0.0
            rag_answer = "No answer generated"
            rag_sources = []
            status = 'pending'

            # For RAG processing, we'll use the original question as-is
            # The RAG pipeline can handle both Arabic and English
            try:
                logging.info("Calling RAG pipeline...")
                rag_result = answer_question(original_question)
                logging.info(f"RAG result received: {type(rag_result)}")

                if rag_result and isinstance(rag_result, dict):
                    confidence = rag_result.get('confidence', 0.0)
                    rag_answer = rag_result.get(
                        'answer', 'No answer generated')

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
            if user_language == 'en' and detected_lang == 'ar' and rag_answer != "No answer generated":
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

            # Always return a response
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
        return jsonify({
            "answers": ["I apologize, but I'm experiencing technical difficulties. Please try again later."],
            "confidence_scores": [0.0],
            "question_id": None,
            "status": "error",
            "session_id": "default",
            "rag_sources": []
        }), 500


@app.route('/feedback', methods=['POST'])
def submit_feedback():
    """Endpoint to submit feedback for answers"""
    try:
        data = request.get_json()

        if not data or 'question_id' not in data or 'is_good' not in data:
            return jsonify({"error": "Missing required fields"}), 400

        question_id = data['question_id']
        is_good = data['is_good']

        success = store_feedback(question_id, is_good)

        if success:
            return jsonify({"message": "Feedback stored successfully"}), 200
        else:
            return jsonify({"error": "Failed to store feedback"}), 500

    except Exception as e:
        logging.error(f"Error in submit_feedback: {e}")
        return jsonify({"error": "Internal server error"}), 500


# Initialize database on startup
init_database()

if __name__ == '__main__':
    logging.info("🚀 Starting AI Chatbot Service...")
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
