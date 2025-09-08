export interface SurveyQuestion {
  id: string;
  text: string;
  type: 'RATING_SCALE';
  required: boolean;
  minValue: number;
  maxValue: number;
  order: number;
}

export interface SurveyTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  estimatedTime: string;
  questions: SurveyQuestion[];
}

export const SURVEY_TEMPLATES: SurveyTemplate[] = [
  {
    id: 'employee_satisfaction_engagement',
    title: 'Employee Satisfaction & Engagement Survey',
    description: 'Dear Team,\n\nWe value your feedback and want to better understand your experience at iscore. This survey covers job satisfaction, workplace culture, management, growth opportunities, and overall wellbeing.\n\nYour responses are completely confidential and will only be used to improve our workplace.\n\nEstimated time: 5 minutes',
    category: 'Employee Engagement',
    estimatedTime: '5 minutes',
    questions: [
      // Section 1: Job Satisfaction
      {
        id: 'q1',
        text: 'I clearly understand my role, responsibilities, and performance expectations.',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 1
      },
      {
        id: 'q2',
        text: 'I feel my work makes a meaningful contribution to the organization\'s success.',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 2
      },
      {
        id: 'q3',
        text: 'Which of the following factors most influences your overall job satisfaction? (Select up to 2)',
        type: 'CHECKBOX',
        required: true,
        options: ['Compensation & benefits', 'Recognition for achievements', 'Work-life balance', 'Career development opportunities', 'Company culture', 'Other'],
        minValue: 1,
        maxValue: 5,
        order: 3
      },
      // Section 2: Workplace Environment & Culture
      {
        id: 'q4',
        text: 'I feel included, respected, and valued within my team and the organization.',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 4
      },
      {
        id: 'q5',
        text: 'How would you rate overall collaboration and teamwork within the company?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 5
      },
      {
        id: 'q6',
        text: 'Which aspect of our culture do you value the most? (Select one)',
        type: 'MULTIPLE_CHOICE',
        required: true,
        options: ['Open communication', 'Respectful relationships', 'Diversity & inclusion', 'Innovation & creativity', 'Supportive teamwork', 'Other'],
        minValue: 1,
        maxValue: 5,
        order: 6
      },
      // Section 3: Management & Leadership
      {
        id: 'q7',
        text: 'My manager provides constructive feedback and supports my professional growth.',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 7
      },
      {
        id: 'q8',
        text: 'I trust the leadership team to make decisions in the best interest of employees and the company.',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 8
      },
      {
        id: 'q9',
        text: 'Rank the following leadership qualities based on their importance to you (1 = Most Important):',
        type: 'CHECKBOX',
        required: true,
        options: ['Transparent communication', 'Empowering employees', 'Recognizing achievements', 'Providing vision and direction'],
        minValue: 1,
        maxValue: 5,
        order: 9
      },
      // Section 4: Career Development & Growth
      {
        id: 'q10',
        text: 'I have sufficient opportunities to grow my skills and advance my career within the organization.',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 10
      },
      {
        id: 'q11',
        text: 'Which development opportunities would you find most valuable? (Select up to 2)',
        type: 'CHECKBOX',
        required: true,
        options: ['Training programs', 'Mentorship and coaching', 'Cross-departmental projects', 'Leadership development programs', 'External workshops/certifications', 'Other'],
        minValue: 1,
        maxValue: 5,
        order: 11
      },
      // Section 5: Well-being & Overall Engagement
      {
        id: 'q12',
        text: 'I feel motivated and engaged in my day to day work.',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 12
      },
      {
        id: 'q13',
        text: 'Overall, how satisfied are you with your experience working at iscore?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 13
      },
      // Section 6: Open-Ended Questions
      {
        id: 'q14',
        text: 'What do you enjoy most about working at iscore?',
        type: 'TEXTAREA',
        required: false,
        minValue: 1,
        maxValue: 5,
        order: 14
      },
      {
        id: 'q15',
        text: 'If you could change one thing to make iscore a better place to work, what would it be?',
        type: 'TEXTAREA',
        required: false,
        minValue: 1,
        maxValue: 5,
        order: 15
      }
    ]
  }
];

export function getSurveyTemplateById(id: string): SurveyTemplate | undefined {
  return SURVEY_TEMPLATES.find(template => template.id === id);
}

export function getSurveyTemplatesByCategory(category: string): SurveyTemplate[] {
  return SURVEY_TEMPLATES.filter(template => template.category === category);
}

export function getAllSurveyTemplates(): SurveyTemplate[] {
  return SURVEY_TEMPLATES;
}
