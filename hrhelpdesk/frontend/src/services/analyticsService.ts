const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export interface DashboardAnalytics {
    totalResponses: number;
    totalSurveys: number;
    questionAnalytics: QuestionAnalytics[];
    departmentBreakdown: Record<string, number>;
    recentResponses: RecentResponse[];
}

export interface QuestionAnalytics {
    questionId: string;
    questionText: string;
    questionOrder: number;
    responseCounts: Record<string, number>;
    totalResponses: number;
}

export interface RecentResponse {
    id: string;
    userName: string;
    department: string;
    completedAt: string | null;
    surveyTitle: string;
}

class AnalyticsService {
    private getAuthHeaders(): HeadersInit {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
        };
    }

    async getDashboardAnalytics(): Promise<DashboardAnalytics> {
        try {
            const response = await fetch(`${API_BASE_URL}/surveys/analytics/dashboard`, {
                method: 'GET',
                headers: this.getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching dashboard analytics:', error);
            throw error;
        }
    }

    // Transform API data to chart format
    transformToChartData(analytics: DashboardAnalytics) {
        const question1Data = this.getQuestionData(analytics, 1); // Role clarity
        const question5Data = this.getQuestionData(analytics, 5); // Collaboration
        const question7Data = this.getQuestionData(analytics, 7); // Manager feedback
        const question8Data = this.getQuestionData(analytics, 8); // Leadership trust
        const question10Data = this.getQuestionData(analytics, 10); // Career growth
        const question11Data = this.getQuestionData(analytics, 11); // Development opportunities
        const question12Data = this.getQuestionData(analytics, 12); // Work motivation

        return {
            totalResponses: analytics.totalResponses,
            question1Data,
            question5Data,
            question7Data,
            question8Data,
            question10Data,
            question11Data,
            question12Data,
            departmentBreakdown: analytics.departmentBreakdown,
            recentResponses: analytics.recentResponses.map(response => ({
                ...response,
                completedAt: response.completedAt || new Date().toISOString()
            })),
            leadershipQualities: [] // Will be populated from actual data when available
        };
    }

    private getQuestionData(analytics: DashboardAnalytics, questionOrder: number) {
        const question = analytics.questionAnalytics.find(q => q.questionOrder === questionOrder);
        if (!question) {
            return [];
        }

        // Transform numeric responses to text labels for rating scale questions
        const transformedResponses: Record<string, number> = {};

        Object.entries(question.responseCounts).forEach(([key, value]) => {
            // Check if this is a rating scale question (numeric values 1-5)
            if (/^[1-5]$/.test(key)) {
                const numericValue = parseInt(key);
                const textLabel = this.getRatingScaleLabel(numericValue);
                transformedResponses[textLabel] = (transformedResponses[textLabel] || 0) + value;
            } else {
                // For non-numeric responses (like checkboxes, text), use as-is
                transformedResponses[key] = value;
            }
        });

        const result = Object.entries(transformedResponses).map(([name, value], index) => ({
            name,
            value,
            color: this.getColorByIndex(index)
        }));
        return result;
    }

    private getRatingScaleLabel(value: number): string {
        const labels = {
            1: 'Strongly Disagree',
            2: 'Disagree',
            3: 'Neutral',
            4: 'Agree',
            5: 'Strongly Agree'
        };
        return labels[value as keyof typeof labels] || `Rating ${value}`;
    }

    private getColorByIndex(index: number): string {
        const colors = ['#5A2D82', '#7B4397', '#C4A484', '#00B59D', '#008B7A'];
        return colors[index % colors.length];
    }

    // Calculate engagement metrics
    calculateEngagementMetrics(chartData: any) {
        const totalResponses = chartData.totalResponses;

        // Calculate engagement score (positive responses to key questions)
        const roleClarityPositive = this.getPositiveResponses(chartData.question1Data);
        const managerSupportPositive = this.getPositiveResponses(chartData.question7Data);
        const leadershipTrustPositive = this.getPositiveResponses(chartData.question8Data);

        const engagementScore = Math.round(
            ((roleClarityPositive + managerSupportPositive + leadershipTrustPositive) / (totalResponses * 3)) * 100
        );

        // Calculate satisfaction score
        const satisfactionScore = Math.round(
            (this.getPositiveResponses(chartData.question1Data) / totalResponses) * 100
        );

        // Calculate growth score
        const growthScore = Math.round(
            (this.getPositiveResponses(chartData.question10Data) / totalResponses) * 100
        );

        return {
            engagementScore: Math.min(engagementScore, 100),
            satisfactionScore: Math.min(satisfactionScore, 100),
            growthScore: Math.min(growthScore, 100)
        };
    }

    private getPositiveResponses(questionData: any[]): number {
        return questionData
            .filter(item =>
                item.name.toLowerCase().includes('agree') ||
                item.name.toLowerCase().includes('excellent') ||
                item.name.toLowerCase().includes('good') ||
                item.name.toLowerCase().includes('strongly agree')
            )
            .reduce((sum, item) => sum + item.value, 0);
    }
}

export const analyticsService = new AnalyticsService();
