import csv
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import torch.nn.functional as F
from pyarabic.araby import strip_tashkeel
from flask import Flask, request, jsonify
from flask_cors import CORS
from deep_translator import GoogleTranslator
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
import os
import math
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize translator
translator_ar = GoogleTranslator(source='en', target='ar')
translator_en = GoogleTranslator(source='ar', target='en')

# Database setup - use environment variable
DATABASE_URL = os.getenv(
    'DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/hrhelpdesk')


def get_db_connection():
    """Get database connection"""
    try:
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None


def init_database():
    """Initialize the database with required tables (only if they don't exist)"""
    try:
        conn = get_db_connection()
        if not conn:
            print("Failed to connect to database")
            return

        cursor = conn.cursor()

        # Create questions table ONLY if it doesn't exist
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS questions (
                question_id BIGSERIAL PRIMARY KEY,
                question_text TEXT NOT NULL,
                answer_text TEXT,
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Create feedback table ONLY if it doesn't exist
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS feedback (
                feed_id BIGSERIAL PRIMARY KEY,
                question_id BIGINT NOT NULL,
                is_good BOOLEAN NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (question_id) REFERENCES questions (question_id) ON DELETE CASCADE
            )
        ''')

        # Check if tables exist and show counts
        cursor.execute('SELECT COUNT(*) as count FROM questions')
        questions_count = cursor.fetchone()['count']

        cursor.execute('SELECT COUNT(*) as count FROM feedback')
        feedback_count = cursor.fetchone()['count']

        conn.commit()
        cursor.close()
        conn.close()

        print(f"✅ Database connection successful!")
        print(f"📊 Existing questions: {questions_count}")
        print(f"📊 Existing feedback: {feedback_count}")
        print("🔄 Tables ready - preserving all existing data")

    except Exception as e:
        print(f"❌ Database initialization error: {e}")


def store_question(question_text, answer_text, status):
    """Store question and answer in database with better error handling"""
    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        if not conn:
            print("Failed to get database connection")
            return None

        cursor = conn.cursor()

        # Insert new question (will auto-increment question_id)
        insert_query = '''
            INSERT INTO questions (question_text, answer_text, status, created_at)
            VALUES (%s, %s, %s, %s) 
            RETURNING question_id
        '''

        cursor.execute(insert_query, (
            question_text,
            answer_text,
            status,
            datetime.now()
        ))

        result = cursor.fetchone()

        if result and 'question_id' in result:
            question_id = result['question_id']
            conn.commit()
            print(
                f"✅ Question stored with ID: {question_id}, Status: {status}")
            return question_id
        else:
            print("❌ No question_id returned from insert")
            conn.rollback()
            return None

    except Exception as e:
        print(f"❌ Database error storing question: {e}")
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
            print(f"❌ Question ID {question_id} does not exist")
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
            print(
                f"✅ Feedback stored with ID: {feed_id} for question {question_id}")
            return True
        else:
            print("❌ No feed_id returned from insert")
            conn.rollback()
            return False

    except Exception as e:
        print(f"❌ Feedback storage error: {e}")
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


# Initialize database on startup
init_database()

# Load Egyptian labor rules FAQ data
faq_data = []


def load_passages(file_path: str, target_list: list):
    """Load FAQ passages into the specified list without considering headers."""
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            reader = csv.reader(file, delimiter="\t")
            for row in reader:
                if not row:
                    continue
                if len(row) < 2:
                    raise ValueError(
                        "Each row must have at least two columns: docid and passage_text.")
                target_list.append(
                    {"docid": row[0].strip(), "text": row[1].strip()})
    except FileNotFoundError as e:
        print(f"Error: File {file_path} not found.")
        raise e
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
        raise e


def translate_text(text: str, target_lang: str = 'ar') -> str:
    """Translate text to target language."""
    try:
        if target_lang == 'ar':
            return translator_ar.translate(text)
        else:
            return translator_en.translate(text)
    except Exception as e:
        print(f"Translation error: {e}")
        return text


def detect_language(text: str) -> str:
    """Detect if text is Arabic or English."""
    try:
        arabic_chars = sum(1 for char in text if '\u0600' <= char <= '\u06FF')
        if arabic_chars > len(text) * 0.3:
            return 'ar'
        return 'en'
    except Exception as e:
        print(f"Language detection error: {e}")
        return 'en'


try:
    load_passages("A.tsv", faq_data)
    print(f"Loaded {len(faq_data)} FAQ entries.")
except Exception as e:
    print(f"Error loading TSV files: {e}")
    raise e

faq_model_path = "FAQ-Model"

try:
    faq_tokenizer = AutoTokenizer.from_pretrained(faq_model_path)
    faq_model = AutoModelForSequenceClassification.from_pretrained(
        faq_model_path)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")
    faq_model.to(device)
    print(f"FAQ model loaded successfully! Using device: {device}")
except Exception as e:
    print(f"Error loading model or tokenizer: {e}")
    raise e


def retrieve_passage(query: str, top_k: int = 10, max_passages: int = 200):
    try:
        print(f"Received Question: {query}")

        selected_tokenizer = faq_tokenizer
        selected_model = faq_model
        passages_to_process = faq_data[:max_passages]
        batch_size = 16

        results = []

        for i in range(0, len(passages_to_process), batch_size):
            batch = passages_to_process[i:i+batch_size]
            normalized_query = strip_tashkeel(query)
            normalized_passages = [strip_tashkeel(
                passage["text"]) for passage in batch]

            inputs = selected_tokenizer(
                text=[normalized_query] * len(batch),
                text_pair=normalized_passages,
                truncation=True,
                padding=True,
                return_tensors="pt"
            )

            inputs = {key: val.to(device) for key, val in inputs.items()}

            with torch.no_grad():
                outputs = selected_model(**inputs)
            logits = outputs.logits

            if logits.shape[1] == 1:
                relevance_scores = torch.sigmoid(logits.squeeze(-1)).tolist()
            else:
                probabilities = F.softmax(logits, dim=-1)
                relevance_scores = probabilities[:, 1].tolist()

            results.extend([
                {"docid": passage["docid"],
                    "text": passage["text"], "score": score}
                for passage, score in zip(batch, relevance_scores)
            ])

        results = sorted(results, key=lambda x: x["score"], reverse=True)
        return results[:top_k]

    except Exception as e:
        print(f"Error during retrieval: {e}")
        raise


# Flask App
app = Flask(__name__)
CORS(app)

# Health check endpoint


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring"""
    try:
        # Check database connection
        conn = get_db_connection()
        if conn:
            conn.close()
            db_status = 'healthy'
        else:
            db_status = 'unhealthy'

        # Check model loading
        if faq_model and faq_tokenizer:
            model_status = 'healthy'
        else:
            model_status = 'unhealthy'

        return jsonify({
            'status': 'healthy' if db_status == 'healthy' and model_status == 'healthy' else 'unhealthy',
            'database': db_status,
            'model': model_status,
            'timestamp': datetime.now().isoformat()
        }), 200 if db_status == 'healthy' and model_status == 'healthy' else 503

    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500


# Add a global state to track vacation query mode
vacation_query_sessions = {}


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
        print(f"❌ Error fetching employee vacation: {e}")
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
        print(f"❌ Error fetching employee department: {e}")
        return None


def get_department_by_name(department_name):
    """Get department information by name with flexible matching"""
    try:
        conn = get_db_connection()
        if not conn:
            print("❌ No database connection")
            return None

        cursor = conn.cursor()

        print(f"🔍 Searching for department: '{department_name}'")

        # First try exact match (case insensitive)
        cursor.execute('''
            SELECT department_id, department_name, department_head
            FROM departments 
            WHERE LOWER(TRIM(department_name)) = LOWER(TRIM(%s))
        ''', (department_name,))

        result = cursor.fetchone()
        print(f"📋 Exact match result: {result}")

        # If no exact match, try partial match
        if not result:
            print("🔍 Trying partial match...")
            cursor.execute('''
                SELECT department_id, department_name, department_head
                FROM departments 
                WHERE LOWER(TRIM(department_name)) LIKE LOWER(TRIM(%s))
                LIMIT 1
            ''', (f'%{department_name}%',))

            result = cursor.fetchone()
            print(f"📋 Partial match result: {result}")

        # Debug: Show all departments
        cursor.execute(
            'SELECT department_name FROM departments ORDER BY department_name')
        all_depts = cursor.fetchall()
        print(
            f"📊 All departments in DB: {[d['department_name'] for d in all_depts]}")

        cursor.close()
        conn.close()

        if result:
            found_dept = {
                'department_id': result['department_id'],
                'department_name': result['department_name'],
                'department_head': result['department_head']
            }
            print(f"✅ Department found: {found_dept}")
            return found_dept

        print(f"❌ No department found for: '{department_name}'")
        return None

    except Exception as e:
        print(f"❌ Error fetching department: {e}")
        return None


def get_all_departments():
    """Get all available departments"""
    try:
        conn = get_db_connection()
        if not conn:
            print("❌ No database connection for departments list")
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

        dept_list = [row['department_name'] for row in results]
        print(f"📊 Retrieved {len(dept_list)} departments: {dept_list}")
        return dept_list

    except Exception as e:
        print(f"❌ Error fetching departments: {e}")
        return []

# Add endpoint to get common questions (vacation + department change)


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
    """Endpoint to handle user questions with vacation and department change support."""
    try:
        data = request.get_json()

        if not data or 'question' not in data:
            return jsonify({"error": "Missing 'question' in request"}), 400

        original_question = data['question']
        top_k = data.get('top_k', 5)
        user_language = data.get('language', 'ar')
        session_id = data.get('session_id', 'default')
        is_common_question = data.get('is_common_question', False)

        print(f"Original question: {original_question}")
        print(f"User language: {user_language}")
        print(f"Session ID: {session_id}")
        print(f"Is common question: {is_common_question}")

        # ONLY trigger auto-response if it's from the dropdown
        # Update the auto-response detection section
        if is_common_question and session_id not in vacation_query_sessions:
            # Check if this is the vacation question from dropdown (more specific matching)
            vacation_questions = [
                "كم لي من إجازات متبقية؟",
                "How many vacation days do I have remaining?"
            ]

            # Check if this is the department change question from dropdown
            department_questions = [
                "أريد تغيير قسمي",
                "I want to change my department"
            ]

            # Check if this is the resignation question from dropdown
            resignation_questions = [
                "أريد تقديم استقالة",
                "I want to submit a resignation"
            ]

            # Check for vacation questions but exclude sick leave and remote work questions
            is_sick_leave_question = any(phrase in original_question.lower() for phrase in [
                                         'sick leave', 'إجازة مرضية', 'medical leave', 'مرض'])
            is_remote_work_question = any(phrase in original_question.lower() for phrase in [
                'remote work', 'work from home', 'العمل من المنزل', 'من البيت'])
            is_vacation_dropdown = not is_sick_leave_question and not is_remote_work_question and any(
                vq.strip() == original_question.strip() for vq in vacation_questions)
            is_department_dropdown = any(
                dq.strip() == original_question.strip() for dq in department_questions)
            is_resignation_dropdown = any(
                rq.strip() == original_question.strip() for rq in resignation_questions)

            if is_vacation_dropdown:
                # Vacation query logic - NO DATABASE STORAGE
                vacation_query_sessions[session_id] = {
                    'waiting_for_id': True, 'type': 'vacation'}

                id_request_message = user_language == 'ar' \
                    and 'يمكنك الاستعلام عن رصيد إجازاتك من خلال قسم الموارد البشرية أو من خلال نظام إدارة الموظفين. عادة ما يحصل الموظفون على 21 يوم إجازة سنوية، ويمكن استخدامها حسب سياسة الشركة.\n\nللمزيد من التفاصيل، يرجى التواصل مع قسم الموارد البشرية.' \
                    or 'You can check your vacation balance through the HR department or the employee management system. Typically, employees receive 21 annual vacation days, which can be used according to company policy.\n\nFor more details, please contact the HR department.'

                print(
                    f"Vacation query from dropdown detected - auto response (not saved)")

                return jsonify({
                    "answers": [id_request_message],
                    "confidence_scores": [1.0],
                    "question_id": None,  # No question ID for auto responses
                    "status": "vacation_query",
                    "session_id": session_id
                }), 200

            elif is_department_dropdown:
                # Department change query logic - NO DATABASE STORAGE
                vacation_query_sessions[session_id] = {
                    'waiting_for_department': True, 'type': 'department'}

                # Get all departments for user reference
                departments = get_all_departments()

                # Format departments list with proper line breaks
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

                print(
                    f"Department change query from dropdown detected - auto response (not saved)")
                print(f"Available departments: {departments}")

                return jsonify({
                    "answers": [dept_request_message],
                    "confidence_scores": [1.0],
                    "question_id": None,  # No question ID for auto responses
                    "status": "department_query",
                    "session_id": session_id
                }), 200

            elif is_resignation_dropdown:
                # Resignation query logic - NO DATABASE STORAGE
                vacation_query_sessions[session_id] = {
                    'waiting_for_id': True, 'type': 'resignation'}

                id_request_message = user_language == 'ar' \
                    and 'للتقديم على الاستقالة، يرجى اتباع الخطوات التالية:\n\n1. كتابة خطاب استقالة رسمي\n2. تقديمه إلى المدير المباشر\n3. إشعار قسم الموارد البشرية\n4. إكمال فترة الإشعار المطلوبة\n\nللمساعدة في هذه العملية، يرجى التواصل مع قسم الموارد البشرية.' \
                    or 'To submit a resignation, please follow these steps:\n\n1. Write a formal resignation letter\n2. Submit it to your direct manager\n3. Notify the HR department\n4. Complete the required notice period\n\nFor assistance with this process, please contact the HR department.'

                print(
                    f"Resignation query from dropdown detected - auto response (not saved)")

                return jsonify({
                    "answers": [id_request_message],
                    "confidence_scores": [1.0],
                    "question_id": None,  # No question ID for auto responses
                    "status": "resignation_query",
                    "session_id": session_id
                }), 200

            # Handle other common questions with fallback responses
            elif any(phrase in original_question.lower() for phrase in ['working hours', 'ساعات العمل', 'work schedule', 'أوقات الدوام']):
                response_message = user_language == 'ar' \
                    and 'ساعات العمل العادية هي 8 ساعات في اليوم، 48 ساعة في الأسبوع كحد أقصى. يمكن العمل ساعات إضافية بموافقة العامل وتحصيل أجر إضافي.\n\nللمزيد من التفاصيل حول جدول العمل المحدد، يرجى التواصل مع قسم الموارد البشرية.' \
                    or 'Normal working hours are 8 hours per day, with a maximum of 48 hours per week. Overtime work is possible with employee consent and additional compensation.\n\nFor specific work schedule details, please contact the HR department.'

            elif any(phrase in original_question.lower() for phrase in ['overtime', 'عمل إضافي', 'extra hours', 'ساعات زائدة']):
                response_message = user_language == 'ar' \
                    and 'ساعات العمل الإضافي تُحسب بأجر أعلى من الأجر العادي. عادة ما يكون الأجر الإضافي 135% من الأجر العادي في النهار و170% في الليل أو العطل الرسمية.\n\nللمزيد من التفاصيل حول حساب الأجر الإضافي، يرجى التواصل مع قسم الموارد البشرية.' \
                    or 'Overtime hours are calculated at a higher rate than regular pay. Typically, overtime pay is 135% of regular pay during the day and 170% at night or on official holidays.\n\nFor more details about overtime calculation, please contact the HR department.'

            elif any(phrase in original_question.lower() for phrase in ['remote work', 'work from home', 'العمل من المنزل', 'من البيت']):
                response_message = user_language == 'ar' \
                    and 'العمل من المنزل متاح حسب طبيعة الوظيفة وسياسة الشركة. يرجى التنسيق مع المدير المباشر وقسم الموارد البشرية لترتيب العمل عن بُعد.\n\nللمزيد من المعلومات حول سياسة العمل عن بُعد، يرجى التواصل مع قسم الموارد البشرية.' \
                    or 'Remote work is available depending on the job nature and company policy. Please coordinate with your direct manager and HR department to arrange remote work.\n\nFor more information about remote work policy, please contact the HR department.'

            elif any(phrase in original_question.lower() for phrase in ['sick leave', 'إجازة مرضية', 'medical leave', 'مرض']):
                response_message = user_language == 'ar' \
                    and 'الإجازة المرضية متاحة لمدة 90 يوم في السنة، أول 30 يوم بأجر كامل. باقي الأيام تُحسب بنسب أقل حسب المدة.\n\nللمزيد من التفاصيل حول الإجازة المرضية، يرجى التواصل مع قسم الموارد البشرية.' \
                    or 'Sick leave is available for 90 days per year, with the first 30 days at full pay. Remaining days are calculated at reduced rates based on duration.\n\nFor more details about sick leave, please contact the HR department.'

            elif any(phrase in original_question.lower() for phrase in ['leave types', 'أنواع الإجازات', 'types of leave', 'أنواع الإجازة']):
                response_message = user_language == 'ar' \
                    and 'أنواع الإجازات المتاحة تشمل: الإجازة السنوية (21 يوم)، الإجازة المرضية (90 يوم)، إجازة الوضع (3 شهور للنساء)، إجازة الأب (7 أيام)، الإجازات الرسمية (13 يوم)، وإجازة الحج (شهر واحد).\n\nللمزيد من التفاصيل حول أنواع الإجازات، يرجى التواصل مع قسم الموارد البشرية.' \
                    or 'Available leave types include: Annual leave (21 days), Sick leave (90 days), Maternity leave (3 months for women), Paternity leave (7 days), Official holidays (13 days), and Hajj leave (1 month).\n\nFor more details about leave types, please contact the HR department.'

            elif any(phrase in original_question.lower() for phrase in ['emergency leave', 'إجازة طارئة', 'urgent leave', 'إجازة عاجلة']):
                response_message = user_language == 'ar' \
                    and 'لطلب إجازة طارئة، يرجى التواصل مع المدير المباشر فوراً وتقديم سبب الإجازة. يمكن الموافقة على الإجازة الطارئة حسب طبيعة الحالة والظروف.\n\nللمزيد من التفاصيل حول الإجازة الطارئة، يرجى التواصل مع قسم الموارد البشرية.' \
                    or 'To request emergency leave, please contact your direct manager immediately and provide the reason for leave. Emergency leave can be approved based on the nature of the situation and circumstances.\n\nFor more details about emergency leave, please contact the HR department.'

            elif any(phrase in original_question.lower() for phrase in ['payday', 'صرف الراتب', 'salary payment', 'متى الراتب']):
                response_message = user_language == 'ar' \
                    and 'يتم صرف الراتب عادة في نهاية كل شهر. الحد الأدنى للأجر في القطاع الخاص هو 3000 جنيه شهريًا لعام 2025.\n\nللمزيد من التفاصيل حول مواعيد الصرف، يرجى التواصل مع قسم الموارد البشرية.' \
                    or 'Salary is typically paid at the end of each month. The minimum wage in the private sector is 3000 EGP per month for 2025.\n\nFor more details about payment schedules, please contact the HR department.'

            elif any(phrase in original_question.lower() for phrase in ['salary increase', 'زيادة الراتب', 'raise', 'علاوة']):
                response_message = user_language == 'ar' \
                    and 'يمكن طلب زيادة في الراتب من خلال التنسيق مع المدير المباشر وقسم الموارد البشرية. عادة ما يتم تقييم طلبات الزيادة سنوياً.\n\nللمزيد من المعلومات حول سياسة الزيادات، يرجى التواصل مع قسم الموارد البشرية.' \
                    or 'Salary increase requests can be made through coordination with your direct manager and HR department. Increase requests are typically evaluated annually.\n\nFor more information about salary increase policies, please contact the HR department.'

            elif any(phrase in original_question.lower() for phrase in ['bonuses', 'مكافآت', 'incentives', 'حوافز']):
                response_message = user_language == 'ar' \
                    and 'المكافآت والحوافز تُحدد حسب أداء الموظف وسياسة الشركة. بعض المكافآت المنتظمة قد تُحسب في التأمين الاجتماعي.\n\nللمزيد من التفاصيل حول نظام المكافآت، يرجى التواصل مع قسم الموارد البشرية.' \
                    or 'Bonuses and incentives are determined based on employee performance and company policy. Some regular bonuses may be included in social insurance calculations.\n\nFor more details about the bonus system, please contact the HR department.'

            elif any(phrase in original_question.lower() for phrase in ['health insurance', 'تأمين صحي', 'medical insurance', 'تأمين طبي']):
                response_message = user_language == 'ar' \
                    and 'التأمين الصحي متاح لجميع الموظفين ويشمل العلاج الطبي والرعاية الصحية. يرجى التواصل مع قسم الموارد البشرية للحصول على تفاصيل التغطية.\n\nللمزيد من المعلومات حول مزايا التأمين الصحي، يرجى التواصل مع قسم الموارد البشرية.' \
                    or 'Health insurance is available for all employees and includes medical treatment and healthcare. Please contact the HR department for coverage details.\n\nFor more information about health insurance benefits, please contact the HR department.'

            elif any(phrase in original_question.lower() for phrase in ['company policies', 'سياسات الشركة', 'policies', 'السياسات']):
                response_message = user_language == 'ar' \
                    and 'سياسات الشركة متاحة في دليل الموظف أو على الموقع الداخلي. تشمل السياسات قواعد العمل، الإجازات، الأجور، والسلوك المهني.\n\nللمزيد من التفاصيل حول السياسات، يرجى التواصل مع قسم الموارد البشرية.' \
                    or 'Company policies are available in the employee handbook or on the internal website. Policies include work rules, leave, compensation, and professional conduct.\n\nFor more details about policies, please contact the HR department.'

            elif any(phrase in original_question.lower() for phrase in ['dress code', 'نظام اللباس', 'clothing', 'الملابس']):
                response_message = user_language == 'ar' \
                    and 'نظام اللباس في العمل يتطلب ملابس مهنية ومناسبة. يرجى ارتداء ملابس نظيفة ومهنية تناسب بيئة العمل.\n\nللمزيد من التفاصيل حول نظام اللباس، يرجى التواصل مع قسم الموارد البشرية.' \
                    or 'Work dress code requires professional and appropriate clothing. Please wear clean, professional attire suitable for the work environment.\n\nFor more details about dress code, please contact the HR department.'

            elif any(phrase in original_question.lower() for phrase in ['attendance', 'الحضور', 'check in', 'تسجيل']):
                response_message = user_language == 'ar' \
                    and 'يتم تسجيل الحضور والانصراف إلكترونياً أو يدوياً حسب نظام الشركة. يرجى الالتزام بمواعيد العمل المحددة.\n\nللمزيد من التفاصيل حول نظام الحضور، يرجى التواصل مع قسم الموارد البشرية.' \
                    or 'Attendance is recorded electronically or manually according to the company system. Please adhere to the specified work hours.\n\nFor more details about the attendance system, please contact the HR department.'

            elif any(phrase in original_question.lower() for phrase in ['training', 'تدريب', 'development', 'تطوير']):
                response_message = user_language == 'ar' \
                    and 'برامج التدريب والتطوير متاحة لجميع الموظفين وتشمل التدريب المهني والتطوير الوظيفي. يرجى التنسيق مع قسم الموارد البشرية.\n\nللمزيد من المعلومات حول برامج التدريب، يرجى التواصل مع قسم الموارد البشرية.' \
                    or 'Training and development programs are available for all employees and include professional training and career development. Please coordinate with the HR department.\n\nFor more information about training programs, please contact the HR department.'

            elif any(phrase in original_question.lower() for phrase in ['career development', 'تطوير المسيرة', 'career growth', 'النمو المهني']):
                response_message = user_language == 'ar' \
                    and 'تطوير المسيرة المهنية يشمل التدريب المستمر والتطوير الوظيفي. يرجى التنسيق مع المدير المباشر وقسم الموارد البشرية لوضع خطة التطوير.\n\nللمزيد من التفاصيل حول التطوير المهني، يرجى التواصل مع قسم الموارد البشرية.' \
                    or 'Career development includes continuous training and professional development. Please coordinate with your direct manager and HR department to create a development plan.\n\nFor more details about career development, please contact the HR department.'

            elif any(phrase in original_question.lower() for phrase in ['promotion', 'ترقية', 'advancement', 'تقدم']):
                response_message = user_language == 'ar' \
                    and 'الترقيات تُحدد حسب الأداء والكفاءة وسياسة الشركة. يرجى التنسيق مع المدير المباشر وقسم الموارد البشرية لطلب الترقية.\n\nللمزيد من المعلومات حول سياسة الترقيات، يرجى التواصل مع قسم الموارد البشرية.' \
                    or 'Promotions are determined based on performance, competence, and company policy. Please coordinate with your direct manager and HR department to request promotion.\n\nFor more information about promotion policies, please contact the HR department.'

            elif any(phrase in original_question.lower() for phrase in ['workplace safety', 'السلامة المهنية', 'safety procedures', 'إجراءات السلامة']):
                response_message = user_language == 'ar' \
                    and 'السلامة المهنية مهمة جداً وتشمل اتباع إجراءات السلامة وارتداء معدات الحماية. يرجى الإبلاغ عن أي مخاطر فوراً.\n\nللمزيد من التفاصيل حول إجراءات السلامة، يرجى التواصل مع قسم الموارد البشرية.' \
                    or 'Workplace safety is very important and includes following safety procedures and wearing protective equipment. Please report any hazards immediately.\n\nFor more details about safety procedures, please contact the HR department.'

            elif any(phrase in original_question.lower() for phrase in ['harassment', 'تحرش', 'bullying', 'تنمر']):
                response_message = user_language == 'ar' \
                    and 'التحرش في العمل غير مقبول نهائياً. يرجى الإبلاغ عن أي حالات تحرش فوراً لقسم الموارد البشرية أو المدير المباشر.\n\nللمزيد من المعلومات حول سياسة مكافحة التحرش، يرجى التواصل مع قسم الموارد البشرية.' \
                    or 'Workplace harassment is absolutely unacceptable. Please report any harassment incidents immediately to HR department or your direct manager.\n\nFor more information about anti-harassment policies, please contact the HR department.'

            elif any(phrase in original_question.lower() for phrase in ['complaints', 'شكوى', 'complaint', 'شكاوى']):
                response_message = user_language == 'ar' \
                    and 'يمكن تقديم الشكاوى من خلال قنوات رسمية مثل قسم الموارد البشرية أو المدير المباشر. سيتم التعامل مع الشكاوى بسرية تامة.\n\nللمزيد من التفاصيل حول نظام الشكاوى، يرجى التواصل مع قسم الموارد البشرية.' \
                    or 'Complaints can be submitted through official channels such as HR department or direct manager. Complaints will be handled with complete confidentiality.\n\nFor more details about the complaint system, please contact the HR department.'

            elif any(phrase in original_question.lower() for phrase in ['notice period', 'فترة الإشعار', 'resignation notice', 'إشعار الاستقالة']):
                response_message = user_language == 'ar' \
                    and 'فترة الإشعار للاستقالة عادة ما تكون شهر واحد، ولكن قد تختلف حسب العقد وسياسة الشركة. يرجى مراجعة عقد العمل.\n\nللمزيد من التفاصيل حول فترة الإشعار، يرجى التواصل مع قسم الموارد البشرية.' \
                    or 'Resignation notice period is typically one month, but may vary according to contract and company policy. Please review your employment contract.\n\nFor more details about notice period, please contact the HR department.'

            elif any(phrase in original_question.lower() for phrase in ['exit interview', 'مقابلة ختامية', 'final interview', 'مقابلة نهائية']):
                response_message = user_language == 'ar' \
                    and 'المقابلة الختامية تُجرى عند ترك العمل لتقييم تجربة الموظف وجمع الملاحظات لتحسين بيئة العمل.\n\nللمزيد من المعلومات حول المقابلة الختامية، يرجى التواصل مع قسم الموارد البشرية.' \
                    or 'Exit interviews are conducted when leaving employment to evaluate employee experience and gather feedback for improving the work environment.\n\nFor more information about exit interviews, please contact the HR department.'

            # If it's one of the fallback questions, return the response
            if 'response_message' in locals():
                return jsonify({
                    "answers": [response_message],
                    "confidence_scores": [1.0],
                    "question_id": None,  # No question ID for fallback responses
                    "status": "fallback_response",
                    "session_id": session_id
                }), 200

        # Handle vacation ID response - NO DATABASE STORAGE
        elif session_id in vacation_query_sessions and vacation_query_sessions[session_id].get('waiting_for_id') and vacation_query_sessions[session_id].get('type') == 'vacation':
            # Check if user wants to exit
            if original_question.strip().lower() == 'q':
                del vacation_query_sessions[session_id]

                exit_message = user_language == 'ar' \
                    and 'تم إلغاء الاستعلام عن الإجازات. يمكنك الآن طرح أي سؤال آخر.' \
                    or 'Vacation query cancelled. You can now ask any other question.'

                print(f"User exited vacation query - auto response (not saved)")

                return jsonify({
                    "answers": [exit_message],
                    "confidence_scores": [1.0],
                    "question_id": None,
                    "status": "query_cancelled",
                    "session_id": session_id
                }), 200

            try:
                employee_id = int(original_question.strip())
                employee_data = get_employee_vacation(employee_id)

                if employee_data:
                    vacation_info_ar = f"مرحباً {employee_data['name']}، لديك {employee_data['remaining_vacations']} يوم إجازة متبقي."
                    vacation_info_en = f"Hello {employee_data['name']}, you have {employee_data['remaining_vacations']} vacation days remaining."

                    vacation_message = user_language == 'ar' and vacation_info_ar or vacation_info_en

                    del vacation_query_sessions[session_id]

                    print(f"Vacation info provided - auto response (not saved)")

                    return jsonify({
                        "answers": [vacation_message],
                        "confidence_scores": [1.0],
                        "question_id": None,  # No question ID for auto responses
                        "status": "vacation_answered",
                        "session_id": session_id
                    }), 200

                else:
                    not_found_message = user_language == 'ar' \
                        and f'رقم الموظف {employee_id} غير موجود في النظام. يرجى التحقق من الرقم والمحاولة مرة أخرى.\n\n(اكتب "q" للخروج)' \
                        or f'Employee ID {employee_id} not found in the system. Please check the ID and try again.\n\n(Type "q" to exit)'

                    print(f"Employee not found - auto response (not saved)")

                    return jsonify({
                        "answers": [not_found_message],
                        "confidence_scores": [1.0],
                        "question_id": None,  # No question ID for auto responses
                        "status": "vacation_not_found",
                        "session_id": session_id
                    }), 200

            except ValueError:
                invalid_format_message = user_language == 'ar' \
                    and 'يرجى إدخال رقم موظف صحيح (أرقام فقط).\n\n(اكتب "q" للخروج)' \
                    or 'Please enter a valid employee ID (numbers only).\n\n(Type "q" to exit)'

                print(f"Invalid ID format - auto response (not saved)")

                return jsonify({
                    "answers": [invalid_format_message],
                    "confidence_scores": [1.0],
                    "question_id": None,  # No question ID for auto responses
                    "status": "vacation_invalid_format",
                    "session_id": session_id
                }), 200

        # Handle department name response - NO DATABASE STORAGE
        elif session_id in vacation_query_sessions and vacation_query_sessions[session_id].get('waiting_for_department') and vacation_query_sessions[session_id].get('type') == 'department':
            # Check if user wants to exit
            if original_question.strip().lower() == 'q':
                del vacation_query_sessions[session_id]

                exit_message = user_language == 'ar' \
                    and 'تم إلغاء طلب تغيير القسم. يمكنك الآن طرح أي سؤال آخر.' \
                    or 'Department change request cancelled. You can now ask any other question.'

                print(f"User exited department query - auto response (not saved)")

                return jsonify({
                    "answers": [exit_message],
                    "confidence_scores": [1.0],
                    "question_id": None,
                    "status": "query_cancelled",
                    "session_id": session_id
                }), 200

            # Clean the input
            department_input = original_question.strip()
            target_department = get_department_by_name(department_input)

            print(f"User input: '{department_input}'")
            print(f"Department found: {target_department}")

            if target_department:
                # Valid department - now ask for employee ID
                vacation_query_sessions[session_id] = {
                    'waiting_for_employee_id': True,
                    'type': 'department',
                    'target_department': target_department
                }

                id_request_message = user_language == 'ar' \
                    and f'لطلب الانتقال إلى قسم "{target_department["department_name"]}"، يرجى اتباع الخطوات التالية:\n\n1. كتابة طلب رسمي للانتقال\n2. تقديمه إلى المدير المباشر\n3. إشعار قسم الموارد البشرية\n4. انتظار الموافقة من الإدارة\n\nللمساعدة في هذه العملية، يرجى التواصل مع قسم الموارد البشرية.' \
                    or f'To request a transfer to "{target_department["department_name"]}" department, please follow these steps:\n\n1. Write a formal transfer request\n2. Submit it to your direct manager\n3. Notify the HR department\n4. Wait for management approval\n\nFor assistance with this process, please contact the HR department.'

                print(f"Department selected - auto response (not saved)")

                return jsonify({
                    "answers": [id_request_message],
                    "confidence_scores": [1.0],
                    "question_id": None,  # No question ID for auto responses
                    "status": "department_id_request",
                    "session_id": session_id
                }), 200
            else:
                # Invalid department - show formatted list
                departments = get_all_departments()

                # Format departments list properly with better display
                if user_language == 'ar':
                    dept_list_formatted = "\n".join(
                        [f"• {dept}" for dept in departments])
                    invalid_dept_message = f'''القسم "{department_input}" غير موجود.

الأقسام المتاحة:
{dept_list_formatted}

يرجى اختيار اسم القسم بالضبط كما هو مكتوب أعلاه.

(اكتب "q" للخروج)'''
                else:
                    dept_list_formatted = "\n".join(
                        [f"• {dept}" for dept in departments])
                    invalid_dept_message = f'''Department "{department_input}" not found.

Available departments:
{dept_list_formatted}

Please choose the department name exactly as written above.

(Type "q" to exit)'''

                print(f"Invalid department - auto response (not saved)")
                print(f"Available departments: {departments}")

                return jsonify({
                    "answers": [invalid_dept_message],
                    "confidence_scores": [1.0],
                    "question_id": None,  # No question ID for auto responses
                    "status": "department_invalid",
                    "session_id": session_id
                }), 200

        # Handle employee ID for department change - NO DATABASE STORAGE
        elif session_id in vacation_query_sessions and vacation_query_sessions[session_id].get('waiting_for_employee_id') and vacation_query_sessions[session_id].get('type') == 'department':
            # Check if user wants to exit
            if original_question.strip().lower() == 'q':
                del vacation_query_sessions[session_id]

                exit_message = user_language == 'ar' \
                    and 'تم إلغاء طلب تغيير القسم. يمكنك الآن طرح أي سؤال آخر.' \
                    or 'Department change request cancelled. You can now ask any other question.'

                print(f"User exited department query - auto response (not saved)")

                return jsonify({
                    "answers": [exit_message],
                    "confidence_scores": [1.0],
                    "question_id": None,
                    "status": "query_cancelled",
                    "session_id": session_id
                }), 200

            try:
                employee_id = int(original_question.strip())
                employee_data = get_employee_department(employee_id)

                if employee_data:
                    target_department = vacation_query_sessions[session_id]['target_department']

                    # Check if they're trying to switch to the same department
                    if employee_data['current_department_id'] == target_department['department_id']:
                        same_dept_message = user_language == 'ar' \
                            and f'أنت موجود بالفعل في قسم {employee_data["current_department_name"]}. لا يمكنك الانتقال إلى نفس القسم الذي تعمل به.' \
                            or f'You are already in the {employee_data["current_department_name"]} department. You cannot switch to the same department you are currently in.'

                        del vacation_query_sessions[session_id]

                        print(f"Same department request - auto response (not saved)")

                        return jsonify({
                            "answers": [same_dept_message],
                            "confidence_scores": [1.0],
                            "question_id": None,  # No question ID for auto responses
                            "status": "department_same",
                            "session_id": session_id
                        }), 200

                    # Valid request - provide contact information
                    contact_message_ar = f'''مرحباً {employee_data["employee_name"]}،

للانتقال من قسم {employee_data["current_department_name"]} إلى قسم {target_department["department_name"]}، تحتاج للتواصل مع:

1. رئيس قسمك الحالي: {employee_data["current_department_head"]}
2. رئيس القسم المراد الانتقال إليه: {target_department["department_head"]}

يرجى التنسيق مع كلا الطرفين للموافقة على عملية النقل.'''

                    contact_message_en = f'''Hello {employee_data["employee_name"]},

To transfer from {employee_data["current_department_name"]} department to {target_department["department_name"]} department, you need to contact:

1. Your current department head: {employee_data["current_department_head"]}
2. Target department head: {target_department["department_head"]}

Please coordinate with both parties to approve the transfer.'''

                    contact_message = user_language == 'ar' and contact_message_ar or contact_message_en

                    del vacation_query_sessions[session_id]

                    print(
                        f"Department change info provided - auto response (not saved)")

                    return jsonify({
                        "answers": [contact_message],
                        "confidence_scores": [1.0],
                        "question_id": None,  # No question ID for auto responses
                        "status": "department_answered",
                        "session_id": session_id
                    }), 200

                else:
                    # Employee not found
                    not_found_message = user_language == 'ar' \
                        and f'رقم الموظف {employee_id} غير موجود في النظام. يرجى التحقق من الرقم والمحاولة مرة أخرى.\n\n(اكتب "q" للخروج)' \
                        or f'Employee ID {employee_id} not found in the system. Please check the ID and try again.\n\n(Type "q" to exit)'

                    print(
                        f"Employee not found for department change - auto response (not saved)")

                    return jsonify({
                        "answers": [not_found_message],
                        "confidence_scores": [1.0],
                        "question_id": None,  # No question ID for auto responses
                        "status": "department_employee_not_found",
                        "session_id": session_id
                    }), 200

            except ValueError:
                # Invalid ID format
                invalid_format_message = user_language == 'ar' \
                    and 'يرجى إدخال رقم موظف صحيح (أرقام فقط).\n\n(اكتب "q" للخروج)' \
                    or 'Please enter a valid employee ID (numbers only).\n\n(Type "q" to exit)'

                print(
                    f"Invalid ID format for department change - auto response (not saved)")

                return jsonify({
                    "answers": [invalid_format_message],
                    "confidence_scores": [1.0],
                    "question_id": None,  # No question ID for auto responses
                    "status": "department_invalid_format",
                    "session_id": session_id
                }), 200

        # Update the vacation/resignation ID response section to handle both vacation AND resignation
        elif session_id in vacation_query_sessions and vacation_query_sessions[session_id].get('waiting_for_id') and vacation_query_sessions[session_id].get('type') in ['vacation', 'resignation']:
            # Check if user wants to exit
            if original_question.strip().lower() == 'q':
                del vacation_query_sessions[session_id]

                query_type = vacation_query_sessions.get(
                    session_id, {}).get('type', 'vacation')

                if query_type == 'resignation':
                    exit_message = user_language == 'ar' \
                        and 'تم إلغاء طلب الاستقالة. يمكنك الآن طرح أي سؤال آخر.' \
                        or 'Resignation request cancelled. You can now ask any other question.'
                else:
                    exit_message = user_language == 'ar' \
                        and 'تم إلغاء الاستعلام عن الإجازات. يمكنك الآن طرح أي سؤال آخر.' \
                        or 'Vacation query cancelled. You can now ask any other question.'

                print(
                    f"User exited {query_type} query - auto response (not saved)")

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

                if query_type == 'resignation':
                    # Handle resignation request
                    employee_data = get_employee_department(employee_id)

                    if employee_data:
                        resignation_message_ar = f'''مرحباً {employee_data["employee_name"]}،

لتقديم طلب الاستقالة، يرجى التوجه إلى رئيس قسمك:

 رئيس قسم {employee_data["current_department_name"]}: {employee_data["current_department_head"]}

سيقوم رئيس القسم بإرشادك خلال إجراءات الاستقالة الرسمية والوثائق المطلوبة.

نتمنى لك التوفيق في مسيرتك المهنية القادمة.'''

                        resignation_message_en = f'''Hello {employee_data["employee_name"]},

To submit your resignation request, please contact your department head:

 {employee_data["current_department_name"]} Department Head: {employee_data["current_department_head"]}

Your department head will guide you through the formal resignation procedures and required documentation.

We wish you the best in your future career endeavors.'''

                        resignation_message = user_language == 'ar' and resignation_message_ar or resignation_message_en

                        del vacation_query_sessions[session_id]

                        print(
                            f"Resignation info provided - auto response (not saved)")

                        return jsonify({
                            "answers": [resignation_message],
                            "confidence_scores": [1.0],
                            "question_id": None,  # No question ID for auto responses
                            "status": "resignation_answered",
                            "session_id": session_id
                        }), 200

                    else:
                        not_found_message = user_language == 'ar' \
                            and f'رقم الموظف {employee_id} غير موجود في النظام. يرجى التحقق من الرقم والمحاولة مرة أخرى.\n\n(اكتب "q" للخروج)' \
                            or f'Employee ID {employee_id} not found in the system. Please check the ID and try again.\n\n(Type "q" to exit)'

                        print(
                            f"Employee not found for resignation - auto response (not saved)")

                        return jsonify({
                            "answers": [not_found_message],
                            "confidence_scores": [1.0],
                            "question_id": None,  # No question ID for auto responses
                            "status": "resignation_not_found",
                            "session_id": session_id
                        }), 200

                elif query_type == 'vacation':
                    # Handle vacation request (existing code)
                    employee_data = get_employee_vacation(employee_id)

                    if employee_data:
                        vacation_info_ar = f"مرحباً {employee_data['name']}، لديك {employee_data['remaining_vacations']} يوم إجازة متبقي."
                        vacation_info_en = f"Hello {employee_data['name']}, you have {employee_data['remaining_vacations']} vacation days remaining."

                        vacation_message = user_language == 'ar' and vacation_info_ar or vacation_info_en

                        del vacation_query_sessions[session_id]

                        print(f"Vacation info provided - auto response (not saved)")

                        return jsonify({
                            "answers": [vacation_message],
                            "confidence_scores": [1.0],
                            "question_id": None,  # No question ID for auto responses
                            "status": "vacation_answered",
                            "session_id": session_id
                        }), 200

                    else:
                        not_found_message = user_language == 'ar' \
                            and f'رقم الموظف {employee_id} غير موجود في النظام. يرجى التحقق من الرقم والمحاولة مرة أخرى.\n\n(اكتب "q" للخروج)' \
                            or f'Employee ID {employee_id} not found in the system. Please check the ID and try again.\n\n(Type "q" to exit)'

                        print(f"Employee not found - auto response (not saved)")

                        return jsonify({
                            "answers": [not_found_message],
                            "confidence_scores": [1.0],
                            "question_id": None,  # No question ID for auto responses
                            "status": "vacation_not_found",
                            "session_id": session_id
                        }), 200

            except ValueError:
                query_type = vacation_query_sessions[session_id].get(
                    'type', 'vacation')

                if query_type == 'resignation':
                    invalid_format_message = user_language == 'ar' \
                        and 'يرجى إدخال رقم موظف صحيح (أرقام فقط).\n\n(اكتب "q" للخروج)' \
                        or 'Please enter a valid employee ID (numbers only).\n\n(Type "q" to exit)'

                    print(
                        f"Invalid ID format for resignation - auto response (not saved)")

                    return jsonify({
                        "answers": [invalid_format_message],
                        "confidence_scores": [1.0],
                        "question_id": None,  # No question ID for auto responses
                        "status": "resignation_invalid_format",
                        "session_id": session_id
                    }), 200
                else:
                    invalid_format_message = user_language == 'ar' \
                        and 'يرجى إدخال رقم موظف صحيح (أرقام فقط).\n\n(اكتب "q" للخروج)' \
                        or 'Please enter a valid employee ID (numbers only).\n\n(Type "q" to exit)'

                    print(f"Invalid ID format - auto response (not saved)")

                    return jsonify({
                        "answers": [invalid_format_message],
                        "confidence_scores": [1.0],
                        "question_id": None,  # No question ID for auto responses
                        "status": "vacation_invalid_format",
                        "session_id": session_id
                    }), 200

        # Regular FAQ processing (ONLY THESE GET SAVED TO DATABASE)
        else:
            # Clear any existing vacation session if it's a new question
            if session_id in vacation_query_sessions and not any(key in vacation_query_sessions[session_id] for key in ['waiting_for_id', 'waiting_for_department', 'waiting_for_employee_id']):
                del vacation_query_sessions[session_id]

            print("Processing as regular FAQ question - sending to model (WILL BE SAVED)")

            detected_lang = detect_language(original_question)
            print(f"Detected language: {detected_lang}")

            if detected_lang == 'en' or user_language == 'en':
                arabic_question = translate_text(original_question, 'ar')
                print(f"Translated question to Arabic: {arabic_question}")
            else:
                arabic_question = original_question

            # Retrieve passages using the Arabic question
            results = retrieve_passage(arabic_question, top_k=top_k)

            if not results:
                # SAVE TO DATABASE - No results found
                question_id = store_question(
                    original_question,
                    "not answered",
                    'pending'
                )

                pending_message = (user_language == 'ar' and detected_lang == 'ar') \
                    and 'عذرًا، لم أجد إجابة مناسبة لسؤالك، لقد أرسلنا سؤالك لفريقنا للإجابة عليه في أقرب وقت ممكن.' \
                    or 'Sorry, I could not find a suitable answer to your question, we sent this question to our team to answer you as soon as possible.'

                print(
                    f"No model results - saved to database with ID: {question_id}")

                return jsonify({
                    "answers": [pending_message],
                    "confidence_scores": [0.0],
                    "question_id": question_id,
                    "status": "pending",
                    "session_id": session_id
                }), 200

            # Extract answers and confidence scores
            arabic_answers = [result["text"] for result in results]
            confidence_scores = [result["score"] for result in results]

            # Get top answer and confidence
            top_answer = arabic_answers[0]
            top_confidence = confidence_scores[0]

            # Normalize confidence if needed
            if top_confidence > 1.0:
                top_confidence = 1 / (1 + math.exp(-top_confidence))

            print(f"Confidence score: {top_confidence}")

            # Check confidence threshold
            if top_confidence < 0.1:  # Less than 10%
                # SAVE TO DATABASE - Low confidence
                question_id = store_question(
                    original_question,
                    "not answered",
                    'pending'
                )

                pending_message = (user_language == 'ar' and detected_lang == 'ar') \
                    and 'عذرًا، لم أجد إجابة مناسبة لسؤالك، لقد أرسلنا سؤالك لفريقنا للإجابة عليه في أقرب وقت ممكن.' \
                    or 'Sorry, I could not find a suitable answer to your question, we sent this question to our team to answer you as soon as possible.'

                print(
                    f"Low confidence - saved to database with ID: {question_id}")

                return jsonify({
                    "answers": [pending_message],
                    "confidence_scores": [top_confidence],
                    "question_id": question_id,
                    "status": "pending",
                    "session_id": session_id
                }), 200

            # High confidence - translate if needed and store as answered
            if user_language == 'en' and arabic_answers:
                english_answers = []
                for answer in arabic_answers:
                    translated_answer = translate_text(answer, 'en')
                    english_answers.append(translated_answer)
                    print(f"Translated answer to English: {translated_answer}")
                final_answers = english_answers
                final_answer = final_answers[0]
            else:
                final_answers = arabic_answers
                final_answer = final_answers[0]

            # SAVE TO DATABASE - High confidence model answer
            question_id = store_question(
                original_question,
                final_answer,
                'answered'
            )

            print(
                f"Model answer provided - saved to database with ID: {question_id}")

            return jsonify({
                "answers": final_answers,
                "confidence_scores": confidence_scores,
                "question_id": question_id,
                "status": "answered",
                "session_id": session_id
            }), 200

    except Exception as e:
        print(f"Error in ask_question: {e}")
        return jsonify({"error": "Internal server error"}), 500


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
        print(f"Error in submit_feedback: {e}")
        return jsonify({"error": "Internal server error"}), 500


# Add the Flask app execution block
if __name__ == '__main__':
    print("🚀 Starting Flask server...")
    print("📍 Server will be available at: http://localhost:5000")
    print("🔗 Common questions endpoint: http://localhost:5000/common-questions")
    print("🔗 Ask endpoint: http://localhost:5000/ask")
    print("🔗 Feedback endpoint: http://localhost:5000/feedback")
    print("=" * 50)

    try:
        app.run(
            host='0.0.0.0',
            port=5000,
            debug=True,
            threaded=True
        )
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        input("Press Enter to exit...")
