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
    id: 'employee_satisfaction',
    title: 'Employee Satisfaction & Engagement Survey',
    description: 'Comprehensive assessment of employee satisfaction, engagement, and workplace experience.',
    category: 'Employee Engagement',
    estimatedTime: '8-10 minutes',
    questions: [
      {
        id: 'q1',
        text: 'How satisfied are you with your current role and responsibilities?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 1
      },
      {
        id: 'q2',
        text: 'How would you rate your work-life balance?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 2
      },
      {
        id: 'q3',
        text: 'How satisfied are you with your compensation and benefits package?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 3
      },
      {
        id: 'q4',
        text: 'How would you rate the communication within your team?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 4
      },
      {
        id: 'q5',
        text: 'How likely are you to recommend this company as a place to work?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 5
      },
      {
        id: 'q6',
        text: 'How satisfied are you with the recognition and appreciation you receive?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 6
      },
      {
        id: 'q7',
        text: 'How would you rate the overall workplace atmosphere?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 7
      },
      {
        id: 'q8',
        text: 'How satisfied are you with the opportunities for career growth?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 8
      }
    ]
  },
  {
    id: 'workplace_culture',
    title: 'Workplace Culture & Values Assessment',
    description: 'Evaluation of company culture, values alignment, and workplace environment.',
    category: 'Culture & Values',
    estimatedTime: '6-8 minutes',
    questions: [
      {
        id: 'q1',
        text: 'How well do the company values align with your personal values?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 1
      },
      {
        id: 'q2',
        text: 'How inclusive and diverse do you find the workplace environment?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 2
      },
      {
        id: 'q3',
        text: 'How would you rate the level of respect among colleagues?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 3
      },
      {
        id: 'q4',
        text: 'How comfortable do you feel expressing your opinions at work?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 4
      },
      {
        id: 'q5',
        text: 'How well does the company live up to its stated values?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 5
      },
      {
        id: 'q6',
        text: 'How would you rate the level of trust between employees and management?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 6
      }
    ]
  },
  {
    id: 'leadership_effectiveness',
    title: 'Leadership & Management Effectiveness Survey',
    description: 'Assessment of leadership quality, management practices, and decision-making effectiveness.',
    category: 'Leadership',
    estimatedTime: '8-10 minutes',
    questions: [
      {
        id: 'q1',
        text: 'How would you rate your direct supervisor\'s leadership skills?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 1
      },
      {
        id: 'q2',
        text: 'How effective is your supervisor at providing clear direction and goals?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 2
      },
      {
        id: 'q3',
        text: 'How would you rate the quality of feedback you receive from your supervisor?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 3
      },
      {
        id: 'q4',
        text: 'How transparent is upper management in their decision-making?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 4
      },
      {
        id: 'q5',
        text: 'How well does leadership communicate company goals and vision?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 5
      },
      {
        id: 'q6',
        text: 'How fairly are decisions made by management?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 6
      },
      {
        id: 'q7',
        text: 'How well does leadership recognize and appreciate employee contributions?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 7
      },
      {
        id: 'q8',
        text: 'How confident are you in the leadership team\'s ability to guide the company?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 8
      }
    ]
  },
  {
    id: 'training_development',
    title: 'Training & Professional Development Survey',
    description: 'Evaluation of learning opportunities, skill development, and career growth support.',
    category: 'Professional Development',
    estimatedTime: '6-8 minutes',
    questions: [
      {
        id: 'q1',
        text: 'How satisfied are you with the current training and learning opportunities?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 1
      },
      {
        id: 'q2',
        text: 'How clear are your career advancement opportunities?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 2
      },
      {
        id: 'q3',
        text: 'How relevant are the training programs to your current role?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 3
      },
      {
        id: 'q4',
        text: 'How satisfied are you with the mentoring and coaching available?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 4
      },
      {
        id: 'q5',
        text: 'How would you rate the support for your professional development goals?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 5
      },
      {
        id: 'q6',
        text: 'How effective are the learning resources and tools provided?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 6
      }
    ]
  },
  {
    id: 'remote_work_experience',
    title: 'Remote Work & Technology Experience Survey',
    description: 'Assessment of remote work effectiveness, technology tools, and virtual collaboration.',
    category: 'Work Environment',
    estimatedTime: '6-8 minutes',
    questions: [
      {
        id: 'q1',
        text: 'How satisfied are you with your current remote work setup and tools?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 1
      },
      {
        id: 'q2',
        text: 'How effective are the virtual communication tools for your work?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 2
      },
      {
        id: 'q3',
        text: 'How well can you collaborate with your team remotely?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 3
      },
      {
        id: 'q4',
        text: 'How would you rate your productivity while working remotely?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 4
      },
      {
        id: 'q5',
        text: 'How satisfied are you with the technical support for remote work?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 5
      },
      {
        id: 'q6',
        text: 'How well are you able to maintain work-life balance while working remotely?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 6
      }
    ]
  },
  {
    id: 'team_collaboration',
    title: 'Team Collaboration & Communication Survey',
    description: 'Evaluation of team dynamics, collaboration effectiveness, and communication quality.',
    category: 'Team Dynamics',
    estimatedTime: '6-8 minutes',
    questions: [
      {
        id: 'q1',
        text: 'How would you rate the sense of teamwork and collaboration in your team?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 1
      },
      {
        id: 'q2',
        text: 'How effective is the communication between team members?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 2
      },
      {
        id: 'q3',
        text: 'How well does your team work together to solve problems?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 3
      },
      {
        id: 'q4',
        text: 'How would you rate the level of support you receive from your colleagues?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 4
      },
      {
        id: 'q5',
        text: 'How effective are team meetings and discussions?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 5
      },
      {
        id: 'q6',
        text: 'How well does your team handle conflicts and disagreements?',
        type: 'RATING_SCALE',
        required: true,
        minValue: 1,
        maxValue: 5,
        order: 6
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
