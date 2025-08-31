export interface SurveyTemplate {
    id: string;
    title: string;
    description: string;
    category: string;
    questions: TemplateQuestion[];
}

export interface TemplateQuestion {
    text: string;
    type: 'RATING_SCALE' | 'MULTIPLE_CHOICE' | 'TEXT';
    required: boolean;
    options?: string[];
    minValue?: number;
    maxValue?: number;
}

export const SURVEY_TEMPLATES: SurveyTemplate[] = [
    {
        id: 'employee-satisfaction',
        title: 'Employee Satisfaction Survey',
        description: 'Assess overall employee satisfaction and workplace experience',
        category: 'Satisfaction',
        questions: [
            {
                text: 'How satisfied are you with your current role and responsibilities?',
                type: 'RATING_SCALE',
                required: true,
                minValue: 1,
                maxValue: 5
            },
            {
                text: 'How would you rate the work-life balance in your current position?',
                type: 'RATING_SCALE',
                required: true,
                minValue: 1,
                maxValue: 5
            },
            {
                text: 'How satisfied are you with the communication from management?',
                type: 'RATING_SCALE',
                required: true,
                minValue: 1,
                maxValue: 5
            },
            {
                text: 'How likely are you to recommend this company as a place to work?',
                type: 'RATING_SCALE',
                required: true,
                minValue: 1,
                maxValue: 5
            },
            {
                text: 'How satisfied are you with your compensation and benefits?',
                type: 'RATING_SCALE',
                required: true,
                minValue: 1,
                maxValue: 5
            }
        ]
    },
    {
        id: 'workplace-culture',
        title: 'Workplace Culture Assessment',
        description: 'Evaluate the company culture and team dynamics',
        category: 'Culture',
        questions: [
            {
                text: 'How would you rate the sense of teamwork and collaboration?',
                type: 'RATING_SCALE',
                required: true,
                minValue: 1,
                maxValue: 5
            },
            {
                text: 'How inclusive and diverse do you feel the workplace is?',
                type: 'RATING_SCALE',
                required: true,
                minValue: 1,
                maxValue: 5
            },
            {
                text: 'How comfortable do you feel expressing your opinions at work?',
                type: 'RATING_SCALE',
                required: true,
                minValue: 1,
                maxValue: 5
            },
            {
                text: 'How well does the company live up to its stated values?',
                type: 'RATING_SCALE',
                required: true,
                minValue: 1,
                maxValue: 5
            },
            {
                text: 'How would you rate the level of trust between employees and management?',
                type: 'RATING_SCALE',
                required: true,
                minValue: 1,
                maxValue: 5
            }
        ]
    },
    {
        id: 'professional-development',
        title: 'Professional Development Survey',
        description: 'Assess training opportunities and career growth satisfaction',
        category: 'Development',
        questions: [
            {
                text: 'How satisfied are you with the learning and development opportunities?',
                type: 'RATING_SCALE',
                required: true,
                minValue: 1,
                maxValue: 5
            },
            {
                text: 'How clear are your career advancement opportunities?',
                type: 'RATING_SCALE',
                required: true,
                minValue: 1,
                maxValue: 5
            },
            {
                text: 'How would you rate the quality of feedback you receive from your supervisor?',
                type: 'RATING_SCALE',
                required: true,
                minValue: 1,
                maxValue: 5
            },
            {
                text: 'How satisfied are you with the mentoring and coaching available?',
                type: 'RATING_SCALE',
                required: true,
                minValue: 1,
                maxValue: 5
            },
            {
                text: 'How relevant are the training programs to your role?',
                type: 'RATING_SCALE',
                required: true,
                minValue: 1,
                maxValue: 5
            }
        ]
    },
    {
        id: 'remote-work-experience',
        title: 'Remote Work Experience',
        description: 'Evaluate remote work satisfaction and challenges',
        category: 'Remote Work',
        questions: [
            {
                text: 'How satisfied are you with your remote work setup and tools?',
                type: 'RATING_SCALE',
                required: true,
                minValue: 1,
                maxValue: 5
            },
            {
                text: 'How effectively can you collaborate with your team remotely?',
                type: 'RATING_SCALE',
                required: true,
                minValue: 1,
                maxValue: 5
            },
            {
                text: 'How well are you able to maintain work-life balance while working remotely?',
                type: 'RATING_SCALE',
                required: true,
                minValue: 1,
                maxValue: 5
            },
            {
                text: 'How would you rate the technical support for remote work?',
                type: 'RATING_SCALE',
                required: true,
                minValue: 1,
                maxValue: 5
            },
            {
                text: 'How satisfied are you with the frequency and quality of virtual meetings?',
                type: 'RATING_SCALE',
                required: true,
                minValue: 1,
                maxValue: 5
            }
        ]
    },
    {
        id: 'leadership-effectiveness',
        title: 'Leadership Effectiveness Survey',
        description: 'Evaluate management and leadership performance',
        category: 'Leadership',
        questions: [
            {
                text: 'How effective is your direct supervisor at providing clear direction?',
                type: 'RATING_SCALE',
                required: true,
                minValue: 1,
                maxValue: 5
            },
            {
                text: 'How well does leadership communicate company goals and vision?',
                type: 'RATING_SCALE',
                required: true,
                minValue: 1,
                maxValue: 5
            },
            {
                text: 'How fairly are decisions made by management?',
                type: 'RATING_SCALE',
                required: true,
                minValue: 1,
                maxValue: 5
            },
            {
                text: 'How well does leadership recognize and appreciate employee contributions?',
                type: 'RATING_SCALE',
                required: true,
                minValue: 1,
                maxValue: 5
            },
            {
                text: 'How confident are you in the leadership team\'s ability to guide the company?',
                type: 'RATING_SCALE',
                required: true,
                minValue: 1,
                maxValue: 5
            }
        ]
    }
];

export const getSurveyTemplateById = (id: string): SurveyTemplate | undefined => {
    return SURVEY_TEMPLATES.find(template => template.id === id);
};

export const getSurveyTemplatesByCategory = (category: string): SurveyTemplate[] => {
    return SURVEY_TEMPLATES.filter(template => template.category === category);
};

export const getAllCategories = (): string[] => {
    return [...new Set(SURVEY_TEMPLATES.map(template => template.category))];
};
