// Survey Data Processor - Transforms CSV data into analytics-ready format

export interface SurveyResponse {
    department: number;
    question1: string; // Role clarity
    question5: string; // Collaboration rating
    question7: string; // Manager support
    question8: string; // Leadership trust
    question9: string[]; // Leadership qualities (4 selections)
    question10: string; // Career growth
    question11: string[]; // Development opportunities
    question12: string; // Work motivation
    question15: string; // Improvement suggestions
}

export interface ProcessedSurveyData {
    totalResponses: number;
    departmentBreakdown: { [key: number]: number };
    question1Data: Array<{ name: string; value: number; color: string }>;
    question5Data: Array<{ name: string; value: number; color: string }>;
    question7Data: Array<{ name: string; value: number; color: string }>;
    question8Data: Array<{ name: string; value: number; color: string }>;
    question10Data: Array<{ name: string; value: number; color: string }>;
    question11Data: Array<{ name: string; value: number; color: string }>;
    question12Data: Array<{ name: string; value: number; color: string }>;
    leadershipQualities: Array<{
        quality: string;
        firstPlace: number;
        secondPlace: number;
        thirdPlace: number;
        fourthPlace: number;
    }>;
    departmentAnalytics: Array<{
        departmentId: number;
        departmentName: string;
        responseCount: number;
        avgSatisfaction: number;
        topConcerns: string[];
        strengths: string[];
    }>;
    improvementSuggestions: Array<{
        suggestion: string;
        frequency: number;
        category: string;
    }>;
}

// Department mapping
const DEPARTMENT_NAMES: { [key: number]: string } = {
    1: 'Engineering',
    2: 'Marketing',
    3: 'Sales',
    4: 'HR',
    5: 'Finance',
    6: 'Operations',
    7: 'Customer Support',
    8: 'IT',
    9: 'Product',
    10: 'Legal',
    11: 'Research & Development',
    12: 'Quality Assurance'
};

// Color palette for charts
const COLORS = ['#5A2D82', '#7B4397', '#C4A484', '#00B59D', '#008B7A', '#FF6B6B', '#4ECDC4', '#45B7D1'];

// Raw CSV data (processed from the uploaded file)
const rawSurveyData = [
    { department: 1, q1: 'Agree', q5: 'Good', q7: 'Agree', q8: 'Agree', q9: ['Recognizing Achievements', 'Providing Vision and Direction', 'Empowering Employees', 'Transparent Communication'], q10: 'Agree', q11: ['Mentorship & Coaching', 'Leadership Development Programs'], q12: 'Agree', q15: 'Enhancing Internal Communication Channels and provide more training Oppportunities' },
    { department: 1, q1: 'Agree', q5: 'Good', q7: 'Agree', q8: 'Strongly Agree', q9: ['Recognizing Achievements', 'NA', 'NA', 'NA'], q10: 'Agree', q11: ['Leadership Development Programs', 'External Workshops & Certifications'], q12: 'Agree', q15: '' },
    { department: 1, q1: 'Neutral', q5: 'Good', q7: 'Agree', q8: 'Agree', q9: ['Transparent Communication', 'Recognizing Achievements', 'Empowering Employees', 'Providing Vision and Direction'], q10: 'Neutral', q11: ['Training Programs', 'External Workshops & Certifications'], q12: 'Agree', q15: '' },
    { department: 2, q1: 'Strongly Agree', q5: 'Excellent', q7: 'Strongly Agree', q8: 'Strongly Agree', q9: ['Transparent Communication', 'Empowering Employees', 'Recognizing Achievements', 'Providing Vision and Direction'], q10: 'Agree', q11: ['Cross-departmental Projects'], q12: 'Neutral', q15: 'Introduce an HR System and Internal Communication tool like Teams' },
    { department: 3, q1: 'Strongly Agree', q5: 'Neutral', q7: 'Strongly Agree', q8: 'Neutral', q9: ['Providing Vision and Direction', 'Empowering Employees', 'Transparent Communication', 'Recognizing Achievements'], q10: 'Agree', q11: ['Mentorship & Coaching', 'External Workshops & Certifications'], q12: 'Disagree', q15: 'Systems and Automation' },
    { department: 4, q1: 'Agree', q5: 'Good', q7: 'Strongly Agree', q8: 'Strongly Agree', q9: ['Empowering Employees', 'Transparent Communication', 'Recognizing Achievements', 'Providing Vision and Direction'], q10: 'Strongly Agree', q11: ['Mentorship & Coaching', 'Cross-departmental Projects'], q12: 'Strongly Agree', q15: 'Work Stations' },
    { department: 6, q1: 'Agree', q5: 'Good', q7: 'Agree', q8: 'Agree', q9: ['Empowering Employees', 'Providing Vision and Direction', 'NA', 'NA'], q10: 'Agree', q11: ['Cross-departmental Projects'], q12: 'Agree', q15: '' },
    { department: 4, q1: 'Agree', q5: 'Poor', q7: 'Agree', q8: 'Agree', q9: ['Recognizing Achievements', 'Providing Vision and Direction', 'Empowering Employees', 'Transparent Communication'], q10: 'Agree', q11: ['Cross-departmental Projects', 'External Workshops & Certifications'], q12: 'Agree', q15: 'More Collaboration' },
    { department: 5, q1: 'Neutral', q5: 'Poor', q7: 'Disagree', q8: 'Neutral', q9: ['Transparent Communication', 'Empowering Employees', 'Recognizing Achievements', 'NA'], q10: 'Strongly Disagree', q11: ['Training Programs', 'Mentorship & Coaching', 'Cross-departmental Projects', 'Leadership Development Programs', 'External Workshops & Certifications'], q12: 'Neutral', q15: 'Team-work, Being Involved, Being Seen, Working on skills' },
    { department: 5, q1: 'Agree', q5: 'Excellent', q7: 'Agree', q8: 'Strongly Agree', q9: ['Providing Vision and Direction', 'NA', 'NA', 'NA'], q10: 'Agree', q11: ['Mentorship & Coaching'], q12: 'Agree', q15: '' },
    { department: 5, q1: 'Strongly Agree', q5: 'Excellent', q7: 'Strongly Agree', q8: 'Strongly Agree', q9: ['Empowering Employees', 'NA', 'NA', 'NA'], q10: 'Strongly Agree', q11: ['Training Programs', 'Cross-departmental Projects'], q12: 'Strongly Agree', q15: '' },
    { department: 1, q1: 'Strongly Disagree', q5: 'Good', q7: 'Strongly Agree', q8: 'Strongly Agree', q9: ['Transparent Communication', 'Providing Vision and Direction', 'Recognizing Achievements', 'Empowering employees'], q10: 'Strongly Agree', q11: ['Mentorship & Coaching', 'Cross-departmental Projects'], q12: 'Strongly Agree', q15: '' },
    { department: 7, q1: 'Strongly Agree', q5: 'Neutral', q7: 'Strongly Agree', q8: 'Strongly Agree', q9: ['Empowering Employees', 'Recognizing Achievements', 'providing vision and direction', 'transparent communication'], q10: 'Neutral', q11: ['Leadership Development Programs', 'External Workshops & Certifications'], q12: 'Agree', q15: 'more collaboration between teams' },
    { department: 8, q1: 'Agree', q5: 'Neutral', q7: 'Neutral', q8: 'Neutral', q9: ['Transparent Communication', 'NA', 'NA', 'NA'], q10: '', q11: [], q12: 'Neutral', q15: 'better internal communication' },
    { department: 9, q1: 'Strongly Agree', q5: 'Poor', q7: 'Neutral', q8: 'Agree', q9: ['Empowering Employees', 'Providing Vision and Direction', 'Transparent Communication', 'recognizing achievements'], q10: 'Agree', q11: ['Cross-departmental Projects'], q12: 'Neutral', q15: '' },
    { department: 9, q1: 'Agree', q5: 'Neutral', q7: 'Agree', q8: 'Neutral', q9: ['Empowering Employees', 'Recognizing Achievements', 'Transparent Communication', 'providing vision and direction'], q10: 'Neutral', q11: ['Training Programs', 'External Workshops & Certifications'], q12: 'Disagree', q15: 'work remotely' },
    { department: 9, q1: 'Agree', q5: 'Neutral', q7: 'Agree', q8: 'Neutral', q9: ['Empowering Employees', 'Recognizing Achievements', 'Transparent Communication', 'providing vision and direction'], q10: 'Neutral', q11: ['Training Programs', 'External Workshops & Certifications'], q12: 'Disagree', q15: 'work remotely' },
    { department: 9, q1: 'Neutral', q5: 'Good', q7: 'Agree', q8: 'Agree', q9: ['Transparent Communication', 'Providing Vision and Direction', 'Recognizing Achievements', 'Empowering employees'], q10: 'Agree', q11: ['Training Programs', 'Cross-departmental Projects'], q12: 'Agree', q15: 'Nothing to change, but if more events were made to engage, it would help us to improve this environment' },
    { department: 10, q1: 'Strongly Agree', q5: 'Good', q7: 'Agree', q8: 'Strongly Agree', q9: ['Empowering Employees', 'Providing Vision and Direction', 'Transparent Communication', 'recognizing achievements'], q10: 'Agree', q11: ['External Workshops & Certifications'], q12: 'Agree', q15: 'Implementation of the process' },
    { department: 1, q1: 'Agree', q5: 'Good', q7: 'Agree', q8: 'Agree', q9: ['Providing Vision and Direction', 'Empowering Employees', 'Recognizing Achievements', 'transparent communication'], q10: 'Neutral', q11: ['Cross-departmental Projects', 'Leadership Development Programs'], q12: 'Neutral', q15: '' },
    { department: 1, q1: 'Agree', q5: 'Good', q7: 'Agree', q8: 'Neutral', q9: ['Empowering Employees', 'Recognizing Achievements', 'providing vision and direction', 'transparent communication'], q10: 'Agree', q11: ['Cross-departmental Projects', 'External Workshops & Certifications'], q12: 'Neutral', q15: 'communication tools' },
    { department: 1, q1: 'Agree', q5: 'Excellent', q7: 'Strongly Agree', q8: 'Strongly Agree', q9: ['Providing Vision and Direction', 'NA', 'NA', 'NA'], q10: 'Agree', q11: ['Mentorship & Coaching', 'Leadership Development Programs'], q12: 'Agree', q15: '' },
    { department: 10, q1: 'Strongly Agree', q5: 'Good', q7: 'Strongly Agree', q8: 'Agree', q9: ['Transparent Communication', 'Recognizing Achievements', 'providing vision and direction', 'Empowering employees'], q10: 'Agree', q11: ['Training Programs', 'External Workshops & Certifications'], q12: 'Agree', q15: 'PC connection' },
    { department: 7, q1: 'Agree', q5: 'Neutral', q7: 'Strongly Agree', q8: 'Agree', q9: ['Empowering Employees', 'Transparent Communication', 'providing vision and direction', 'recognizing achievements'], q10: 'Agree', q11: ['Leadership Development Programs', 'External Workshops & Certifications'], q12: 'Agree', q15: 'Empower employees with more ownership and involvement in decision making during critical situations, supported by a clear process to follow' },
    { department: 3, q1: 'Strongly Disagree', q5: 'Good', q7: 'Strongly Disagree', q8: 'Strongly Disagree', q9: ['Providing Vision and Direction', 'Empowering Employees', 'Recognizing Achievements', 'transparent communication'], q10: 'Agree', q11: ['Training Programs', 'External Workshops & Certifications'], q12: 'Strongly Agree', q15: '' },
    { department: 8, q1: 'Strongly Agree', q5: 'Neutral', q7: 'Strongly Agree', q8: 'Agree', q9: ['Providing Vision and Direction', 'Transparent Communication', 'Empowering Employees', 'recognizing achievements'], q10: 'Agree', q11: ['Leadership Development Programs', 'Training Programs'], q12: 'Agree', q15: 'Communication' },
    { department: 1, q1: 'Neutral', q5: 'Poor', q7: 'Agree', q8: 'Agree', q9: ['Providing Vision and Direction', 'Transparent Communication', 'Recognizing Achievements', 'Empowering employees'], q10: 'Disagree', q11: ['Mentorship & Coaching', 'Cross-departmental Projects'], q12: 'Disagree', q15: 'More transparency and trust between management and staff' },
    { department: 1, q1: 'Neutral', q5: 'Poor', q7: 'Neutral', q8: 'Agree', q9: ['Providing Vision and Direction', 'Transparent Communication', 'Empowering Employees', 'recognizing achievements'], q10: 'Disagree', q11: ['Mentorship & Coaching', 'Cross-departmental Projects'], q12: 'Disagree', q15: 'Transparency and need to enhance communication between teams' },
    { department: 8, q1: 'Strongly Disagree', q5: 'Good', q7: 'Agree', q8: 'Neutral', q9: ['Providing Vision and Direction', 'Transparent Communication', 'Empowering Employees', 'recognizing achievements'], q10: 'Strongly Agree', q11: ['Training Programs', 'Mentorship & Coaching'], q12: 'Agree', q15: 'Develop strong communication accross various teams to create synergy' },
    { department: 2, q1: 'Strongly Agree', q5: 'Good', q7: 'Strongly Agree', q8: 'Strongly Agree', q9: ['Providing Vision and Direction', 'recognizing achievements', 'Transparent Communication', 'Empowering Employees'], q10: 'Strongly Agree', q11: ['Mentorship & Coaching', 'External Workshops & Certifications'], q12: 'Strongly Agree', q15: 'approval cycles' },
    { department: 2, q1: 'Agree', q5: 'Good', q7: 'Agree', q8: 'Agree', q9: ['Providing Vision and Direction', 'Empowering Employees', 'recognizing achievements', 'Transparent Communication'], q10: 'Agree', q11: ['External Workshops & Certifications'], q12: 'Neutral', q15: 'need more space and pingpong' },
    { department: 2, q1: 'Neutral', q5: 'Neutral', q7: 'Agree', q8: 'Agree', q9: ['Providing Vision and Direction', 'Empowering Employees', 'recognizing achievements', 'Transparent Communication'], q10: 'Neutral', q11: ['Training Programs', 'External Workshops & Certifications'], q12: 'Disagree', q15: 'work environment' },
    { department: 2, q1: 'Disagree', q5: 'Neutral', q7: 'Strongly Agree', q8: 'Agree', q9: ['Providing Vision and Direction', 'recognizing achievements', 'Transparent Communication', 'Empowering Employees'], q10: 'Neutral', q11: ['Training Programs', 'Cross-departmental Projects'], q12: 'Neutral', q15: 'cross functional projects and the training programs as well as the work environment and work space' },
    { department: 2, q1: 'Agree', q5: 'Neutral', q7: 'Agree', q8: 'Agree', q9: ['Empowering Employees', 'Providing Vision and Direction', 'Transparent Communication', 'recognizing achievements'], q10: 'Agree', q11: ['External Workshops & Certifications', 'Mentorship & Coaching'], q12: 'Neutral', q15: 'better environment' },
    { department: 2, q1: 'Agree', q5: 'Neutral', q7: 'Agree', q8: 'Agree', q9: ['recognizing achievements', 'Providing Vision and Direction', 'Transparent Communication', 'Empowering Employees'], q10: 'Neutral', q11: ['Training Programs', 'External Workshops & Certifications'], q12: 'Neutral', q15: '' },
    { department: 11, q1: 'Strongly Agree', q5: 'Excellent', q7: 'Strongly Agree', q8: 'Strongly Agree', q9: ['Empowering Employees', 'Transparent Communication', 'recognizing achievements', 'Providing Vision and Direction'], q10: 'Strongly Agree', q11: ['Mentorship & Coaching'], q12: 'Strongly Agree', q15: 'nothing' },
    { department: 7, q1: 'Strongly Agree', q5: 'Good', q7: 'Agree', q8: 'Strongly Agree', q9: ['Empowering Employees', 'recognizing achievements', 'Providing Vision and Direction', 'Transparent Communication'], q10: 'Agree', q11: ['Leadership Development Programs', 'External Workshops & Certifications'], q12: 'Agree', q15: 'open minded' },
    { department: 12, q1: 'Agree', q5: 'Good', q7: 'Strongly Agree', q8: 'Strongly Agree', q9: ['Transparent Communication', 'Empowering Employees', 'Providing Vision and Direction', 'recognizing achievements'], q10: 'Neutral', q11: ['Cross-departmental Projects', 'Training Programs'], q12: 'Strongly Agree', q15: 'attetion to employee training ang give them more financial benifits' },
    { department: 10, q1: 'Agree', q5: 'Good', q7: 'Agree', q8: 'Agree', q9: ['Providing Vision and Direction', 'recognizing achievements', 'Empowering Employees', 'Transparent Communication'], q10: 'Neutral', q11: ['Mentorship & Coaching', 'Leadership Development Programs'], q12: 'Agree', q15: '' },
    { department: 8, q1: 'Agree', q5: 'Neutral', q7: 'Agree', q8: 'Agree', q9: ['Transparent Communication', 'recognizing achievements', 'Providing Vision and Direction', 'Empowering Employees'], q10: 'Agree', q11: ['External Workshops & Certifications'], q12: 'Agree', q15: '' }
];

export function processSurveyData(): ProcessedSurveyData {
    const responses = rawSurveyData;
    const totalResponses = responses.length;

    // Department breakdown
    const departmentBreakdown: { [key: number]: number } = {};
    responses.forEach(response => {
        departmentBreakdown[response.department] = (departmentBreakdown[response.department] || 0) + 1;
    });

    // Helper function to count responses by category
    const countResponses = (responses: any[], field: string) => {
        const counts: { [key: string]: number } = {};
        responses.forEach(response => {
            const value = response[field];
            if (value && value !== 'NA' && value !== '') {
                counts[value] = (counts[value] || 0) + 1;
            }
        });
        return Object.entries(counts).map(([name, value], index) => ({
            name,
            value,
            color: COLORS[index % COLORS.length]
        }));
    };

    // Process each question
    const question1Data = countResponses(responses, 'q1');
    const question5Data = countResponses(responses, 'q5');
    const question7Data = countResponses(responses, 'q7');
    const question8Data = countResponses(responses, 'q8');
    const question10Data = countResponses(responses, 'q10');
    const question12Data = countResponses(responses, 'q12');

    // Process development opportunities (question 11)
    const devOpportunities: { [key: string]: number } = {};
    responses.forEach(response => {
        if (response.q11 && Array.isArray(response.q11)) {
            response.q11.forEach(opp => {
                if (opp && opp !== 'NA') {
                    devOpportunities[opp] = (devOpportunities[opp] || 0) + 1;
                }
            });
        }
    });
    const question11Data = Object.entries(devOpportunities)
        .sort(([, a], [, b]) => b - a)
        .map(([name, value], index) => ({
            name,
            value,
            color: COLORS[index % COLORS.length]
        }));

    // Process leadership qualities ranking
    const leadershipQualities = [
        'Providing Vision and Direction',
        'Empowering Employees',
        'Transparent Communication',
        'Recognizing Achievements'
    ];

    const leadershipRankings = leadershipQualities.map(quality => {
        let firstPlace = 0, secondPlace = 0, thirdPlace = 0, fourthPlace = 0;

        responses.forEach(response => {
            if (response.q9 && Array.isArray(response.q9)) {
                const index = response.q9.findIndex(q =>
                    q.toLowerCase().includes(quality.toLowerCase()) ||
                    quality.toLowerCase().includes(q.toLowerCase())
                );
                if (index === 0) firstPlace++;
                else if (index === 1) secondPlace++;
                else if (index === 2) thirdPlace++;
                else if (index === 3) fourthPlace++;
            }
        });

        return {
            quality,
            firstPlace,
            secondPlace,
            thirdPlace,
            fourthPlace
        };
    });

    // Process department analytics
    const departmentAnalytics = Object.entries(departmentBreakdown).map(([deptId, count]) => {
        const deptResponses = responses.filter(r => r.department === parseInt(deptId));

        // Calculate average satisfaction (based on question 5)
        const satisfactionScores = deptResponses
            .map(r => {
                switch (r.q5) {
                    case 'Excellent': return 5;
                    case 'Good': return 4;
                    case 'Neutral': return 3;
                    case 'Poor': return 2;
                    default: return 3;
                }
            })
            .filter(score => score > 0);

        const avgSatisfaction = satisfactionScores.length > 0
            ? satisfactionScores.reduce((a, b) => a + b, 0) / satisfactionScores.length
            : 3;

        // Extract top concerns and strengths from question 15
        const suggestions = deptResponses
            .map(r => r.q15)
            .filter(s => s && s.trim() !== '')
            .map(s => s.toLowerCase());

        return {
            departmentId: parseInt(deptId),
            departmentName: DEPARTMENT_NAMES[parseInt(deptId)] || `Department ${deptId}`,
            responseCount: count,
            avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
            topConcerns: suggestions.slice(0, 3),
            strengths: [] // Could be derived from positive responses
        };
    });

    // Process improvement suggestions
    const allSuggestions = responses
        .map(r => r.q15)
        .filter(s => s && s.trim() !== '')
        .map(s => s.toLowerCase());

    const suggestionCounts: { [key: string]: number } = {};
    allSuggestions.forEach(suggestion => {
        // Categorize suggestions
        let category = 'General';
        if (suggestion.includes('communication')) category = 'Communication';
        else if (suggestion.includes('training') || suggestion.includes('development')) category = 'Training & Development';
        else if (suggestion.includes('environment') || suggestion.includes('space')) category = 'Work Environment';
        else if (suggestion.includes('collaboration') || suggestion.includes('team')) category = 'Collaboration';
        else if (suggestion.includes('transparency') || suggestion.includes('trust')) category = 'Transparency';

        suggestionCounts[suggestion] = (suggestionCounts[suggestion] || 0) + 1;
    });

    const improvementSuggestions = Object.entries(suggestionCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([suggestion, frequency]) => ({
            suggestion,
            frequency,
            category: suggestion.includes('communication') ? 'Communication' :
                suggestion.includes('training') ? 'Training & Development' :
                    suggestion.includes('environment') ? 'Work Environment' : 'General'
        }));

    return {
        totalResponses,
        departmentBreakdown,
        question1Data,
        question5Data,
        question7Data,
        question8Data,
        question10Data,
        question11Data,
        question12Data,
        leadershipQualities: leadershipRankings,
        departmentAnalytics,
        improvementSuggestions
    };
}

// Calculate engagement metrics
export function calculateEngagementMetrics(data: ProcessedSurveyData) {
    // Calculate engagement score based on positive responses
    const positiveResponses = data.question1Data
        .filter(q => q.name === 'Agree' || q.name === 'Strongly Agree')
        .reduce((sum, q) => sum + q.value, 0);

    const engagementScore = Math.round((positiveResponses / data.totalResponses) * 100);

    // Calculate satisfaction score based on collaboration rating
    const satisfactionResponses = data.question5Data
        .filter(q => q.name === 'Good' || q.name === 'Excellent')
        .reduce((sum, q) => sum + q.value, 0);

    const satisfactionScore = Math.round((satisfactionResponses / data.totalResponses) * 100);

    // Calculate growth score based on career growth opportunities
    const growthResponses = data.question10Data
        .filter(q => q.name === 'Agree' || q.name === 'Strongly Agree')
        .reduce((sum, q) => sum + q.value, 0);

    const growthScore = Math.round((growthResponses / data.totalResponses) * 100);

    return {
        engagementScore,
        satisfactionScore,
        growthScore
    };
}

