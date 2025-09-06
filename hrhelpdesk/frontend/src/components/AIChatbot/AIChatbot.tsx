import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import './AIChatbot.css';

const API_BASE_URL = 'http://localhost:3000/api';

interface Message {
    id: string;
    sender: 'user' | 'bot' | 'system';
    text: string;
    timestamp: Date;
    questionId?: number | null;
    status?: string;
}

interface CommonQuestion {
    id: string;
    text: string;
}

const AIChatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [language, setLanguage] = useState<'ar' | 'en'>('ar');
    const [commonQuestions, setCommonQuestions] = useState<CommonQuestion[]>([]);
    const [feedback, setFeedback] = useState<{ [key: number]: 'up' | 'down' | null }>({});
    const [sessionId] = useState(() => `session_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { user } = useSelector((state: RootState) => state.auth);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Initialize chat when component mounts
    useEffect(() => {
        if (isOpen) {
            initializeChat();
            fetchCommonQuestions();
        }
    }, [isOpen, language]);

    const initializeChat = () => {
        const now = new Date();
        const formattedDate = now.toLocaleDateString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        setMessages([
            {
                id: 'date',
                sender: 'system',
                text: formattedDate,
                timestamp: now
            },
            {
                id: 'welcome',
                sender: 'bot',
                text: language === 'ar' ? 'مرحباً! كيف يمكنني مساعدتك؟' : 'Hello! How can I help you?',
                timestamp: new Date()
            }
        ]);
    };

    const fetchCommonQuestions = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/ai-chatbot/common-questions?language=${language}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setCommonQuestions(data.questions || []);
            }
        } catch (error) {
            console.error('Error fetching common questions:', error);
        }
    };

    const sendMessage = async (messageText?: string, isCommonQuestion: boolean = false) => {
        const textToSend = messageText || input.trim();
        if (textToSend === '') return;

        const userMsg: Message = {
            id: `user_${Date.now()}`,
            sender: 'user',
            text: textToSend,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        if (!messageText) setInput('');
        setIsTyping(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/ai-chatbot/ask`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    question: textToSend,
                    language,
                    session_id: sessionId,
                    is_common_question: isCommonQuestion
                })
            });

            if (response.ok) {
                const data = await response.json();
                const botMsg: Message = {
                    id: `bot_${Date.now()}`,
                    sender: 'bot',
                    text: data.answers[0],
                    timestamp: new Date(),
                    questionId: data.question_id,
                    status: data.status
                };
                setMessages(prev => [...prev, botMsg]);
            } else {
                throw new Error('Failed to get response');
            }
        } catch (error) {
            const errorMsg: Message = {
                id: `error_${Date.now()}`,
                sender: 'bot',
                text: language === 'ar' ? 'عذراً، حدث خطأ أثناء معالجة سؤالك.' : 'Sorry, an error occurred while processing your question.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleCommonQuestionClick = (question: CommonQuestion) => {
        sendMessage(question.text, true);
    };

    const handleFeedback = async (questionId: number, feedbackType: 'up' | 'down') => {
        const currentFeedback = feedback[questionId];
        const newFeedback = currentFeedback === feedbackType ? null : feedbackType;

        setFeedback(prev => ({
            ...prev,
            [questionId]: newFeedback
        }));

        if (questionId && newFeedback !== null) {
            try {
                const token = localStorage.getItem('token');
                await fetch(`${API_BASE_URL}/ai-chatbot/feedback`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        question_id: questionId,
                        is_good: newFeedback === 'up'
                    })
                });
            } catch (error) {
                console.error('Error sending feedback:', error);
            }
        }
    };

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'ar' ? 'en' : 'ar');
    };

    const resetChat = () => {
        setMessages([]);
        setFeedback({});
        initializeChat();
    };

    if (!isOpen) {
        return (
            <button
                className="ai-chatbot-toggle"
                onClick={() => setIsOpen(true)}
                title={language === 'ar' ? 'افتح المساعد الذكي' : 'Open AI Assistant'}
            >
                <span className="ai-chatbot-icon">🤖</span>
                <span className="ai-chatbot-label">
                    {language === 'ar' ? 'المساعد الذكي' : 'AI Assistant'}
                </span>
            </button>
        );
    }

    return (
        <div className="ai-chatbot-container">
            {/* Header */}
            <div className="ai-chatbot-header">
                <div className="ai-chatbot-title">
                    <span className="ai-chatbot-icon">🤖</span>
                    <span>{language === 'ar' ? 'المساعد الذكي' : 'AI Assistant'}</span>
                </div>
                <div className="ai-chatbot-controls">
                    <button onClick={toggleLanguage} className="language-toggle">
                        {language === 'ar' ? 'EN' : 'عربي'}
                    </button>
                    <button onClick={resetChat} className="reset-chat">
                        {language === 'ar' ? 'إعادة تعيين' : 'Reset'}
                    </button>
                    <button onClick={() => setIsOpen(false)} className="close-chat">
                        ✕
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="ai-chatbot-messages">
                {messages.map((message) => (
                    <div key={message.id} className={`message ${message.sender}`}>
                        {message.sender === 'system' ? (
                            <div className="system-message">
                                ───────────── {message.text} ─────────────
                            </div>
                        ) : (
                            <>
                                <div className="message-content">
                                    <p className={language === 'ar' ? 'rtl' : 'ltr'}>
                                        {message.text}
                                    </p>
                                </div>

                                {/* Feedback buttons for bot messages */}
                                {message.sender === 'bot' && message.questionId && (
                                    <div className="message-feedback">
                                        <button
                                            onClick={() => handleFeedback(message.questionId!, 'up')}
                                            className={`feedback-btn ${feedback[message.questionId!] === 'up' ? 'active' : ''}`}
                                            title={language === 'ar' ? 'مفيد' : 'Helpful'}
                                        >
                                            👍
                                        </button>
                                        <button
                                            onClick={() => handleFeedback(message.questionId!, 'down')}
                                            className={`feedback-btn ${feedback[message.questionId!] === 'down' ? 'active' : ''}`}
                                            title={language === 'ar' ? 'غير مفيد' : 'Not helpful'}
                                        >
                                            👎
                                        </button>
                                    </div>
                                )}

                                <div className="message-timestamp">
                                    {message.timestamp.toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                ))}

                {isTyping && (
                    <div className="message bot">
                        <div className="message-content typing">
                            {language === 'ar' ? 'جاري البحث، أرجو الانتظار...' : 'Searching, please wait...'}
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Common Questions */}
            <div className="ai-chatbot-common-questions">
                <div className="common-questions-label">
                    {language === 'ar' ? 'الأسئلة الشائعة:' : 'Common Questions:'}
                </div>
                <div className="common-questions-list">
                    {commonQuestions.map((question) => (
                        <button
                            key={question.id}
                            onClick={() => handleCommonQuestionClick(question)}
                            className="common-question-btn"
                        >
                            {question.text}
                        </button>
                    ))}
                </div>
            </div>

            {/* Input */}
            <div className="ai-chatbot-input">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={language === 'ar' ? 'اكتب سؤالك هنا...' : 'Type your question here...'}
                    className={language === 'ar' ? 'rtl' : 'ltr'}
                />
                <button onClick={() => sendMessage()} className="send-btn">
                    ➤
                </button>
            </div>
        </div>
    );
};

export default AIChatbot;
