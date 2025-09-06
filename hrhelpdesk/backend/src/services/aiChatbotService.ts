import axios from 'axios';

export interface ChatbotResponse {
    answers: string[];
    confidence_scores: number[];
    question_id: number | null;
    status: string;
    session_id: string;
}

export interface CommonQuestion {
    id: string;
    text: string;
}

export interface FeedbackRequest {
    question_id: number;
    is_good: boolean;
}

export class AIChatbotService {
    private baseUrl: string;
    private timeout: number;

    constructor() {
        this.baseUrl = process.env.AI_CHATBOT_URL || 'http://localhost:5000';
        this.timeout = parseInt(process.env.AI_CHATBOT_TIMEOUT || '10000');
    }

    /**
     * Ask a question to the AI chatbot
     */
    async askQuestion(
        question: string,
        language: 'ar' | 'en' = 'ar',
        sessionId: string,
        isCommonQuestion: boolean = false,
        topK: number = 5
    ): Promise<ChatbotResponse> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/ask`,
                {
                    question,
                    language,
                    session_id: sessionId,
                    is_common_question: isCommonQuestion,
                    top_k: topK
                },
                {
                    timeout: this.timeout,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log(`AI Chatbot response received for session: ${sessionId}`);
            return response.data;
        } catch (error) {
            console.error(`Error calling AI chatbot service: ${error}`);
            throw new Error('Failed to get response from AI chatbot service');
        }
    }

    /**
     * Get common questions for the dropdown
     */
    async getCommonQuestions(language: 'ar' | 'en' = 'ar'): Promise<CommonQuestion[]> {
        try {
            const response = await axios.get(
                `${this.baseUrl}/common-questions?language=${language}`,
                {
                    timeout: this.timeout
                }
            );

            console.log(`Common questions retrieved for language: ${language}`);
            return response.data.questions || [];
        } catch (error) {
            console.error(`Error getting common questions: ${error}`);
            // Return fallback questions if service is unavailable
            return this.getFallbackQuestions(language);
        }
    }

    /**
     * Submit feedback for a question
     */
    async submitFeedback(feedback: FeedbackRequest): Promise<boolean> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/feedback`,
                feedback,
                {
                    timeout: this.timeout,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log(`Feedback submitted successfully for question: ${feedback.question_id}`);
            return response.status === 200;
        } catch (error) {
            console.error(`Error submitting feedback: ${error}`);
            return false;
        }
    }

    /**
     * Check if the AI chatbot service is healthy
     */
    async checkHealth(): Promise<boolean> {
        try {
            const response = await axios.get(`${this.baseUrl}/health`, {
                timeout: 5000
            });
            return response.status === 200;
        } catch (error) {
            console.warn(`AI chatbot service health check failed: ${error}`);
            return false;
        }
    }

    /**
     * Get fallback questions when service is unavailable
     */
    private getFallbackQuestions(language: 'ar' | 'en'): CommonQuestion[] {
        if (language === 'ar') {
            return [
                { id: 'vacation', text: 'كم لي من إجازات متبقية؟' },
                { id: 'department', text: 'أريد تغيير قسمي' },
                { id: 'resignation', text: 'أريد تقديم استقالة' }
            ];
        } else {
            return [
                { id: 'vacation', text: 'How many vacation days do I have remaining?' },
                { id: 'department', text: 'I want to change my department' },
                { id: 'resignation', text: 'I want to submit a resignation' }
            ];
        }
    }
}

export const aiChatbotService = new AIChatbotService();
