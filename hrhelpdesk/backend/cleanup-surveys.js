const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupAndCreateSurvey() {
    try {
        console.log('🧹 Starting survey cleanup...');

        // Delete all existing surveys and related data
        console.log('Deleting all existing survey responses...');
        await prisma.questionResponse.deleteMany({});

        console.log('Deleting all existing survey responses...');
        await prisma.surveyResponse.deleteMany({});

        console.log('Deleting all existing survey questions...');
        await prisma.surveyQuestion.deleteMany({});

        console.log('Deleting all existing surveys...');
        await prisma.survey.deleteMany({});

        console.log('✅ All test surveys deleted successfully!');

        // Get HR user to create the survey
        const hrUser = await prisma.user.findFirst({
            where: { role: 'HR' }
        });

        if (!hrUser) {
            throw new Error('HR user not found');
        }

        console.log('📝 Creating Employee Satisfaction & Engagement Survey...');

        // Create the new survey
        const newSurvey = await prisma.survey.create({
            data: {
                title: 'Employee Satisfaction & Engagement Survey',
                description: 'Dear Team,\n\nWe value your feedback and want to better understand your experience at iscore. This survey covers job satisfaction, workplace culture, management, growth opportunities, and overall wellbeing.\n\nYour responses are completely confidential and will only be used to improve our workplace.\n\nEstimated time: 5 minutes',
                status: 'DRAFT',
                isAnonymous: false,
                targetAllEmployees: true,
                targetDepartments: [],
                targetUsers: [],
                createdById: hrUser.id,
                startDate: null,
                endDate: null
            }
        });

        console.log('✅ Survey created with ID:', newSurvey.id);

        // Create all 15 questions for the survey
        const questions = [
            // Section 1: Job Satisfaction
            {
                text: 'I clearly understand my role, responsibilities, and performance expectations.',
                type: 'RATING_SCALE',
                required: true,
                order: 1,
                minValue: 1,
                maxValue: 5
            },
            {
                text: 'I feel my work makes a meaningful contribution to the organization\'s success.',
                type: 'RATING_SCALE',
                required: true,
                order: 2,
                minValue: 1,
                maxValue: 5
            },
            {
                text: 'Which of the following factors most influences your overall job satisfaction? (Select up to 2)',
                type: 'CHECKBOX',
                required: true,
                order: 3,
                options: ['Compensation & benefits', 'Recognition for achievements', 'Work-life balance', 'Career development opportunities', 'Company culture', 'Other']
            },
            // Section 2: Workplace Environment & Culture
            {
                text: 'I feel included, respected, and valued within my team and the organization.',
                type: 'RATING_SCALE',
                required: true,
                order: 4,
                minValue: 1,
                maxValue: 5
            },
            {
                text: 'How would you rate overall collaboration and teamwork within the company?',
                type: 'RATING_SCALE',
                required: true,
                order: 5,
                minValue: 1,
                maxValue: 5
            },
            {
                text: 'Which aspect of our culture do you value the most? (Select one)',
                type: 'MULTIPLE_CHOICE',
                required: true,
                order: 6,
                options: ['Open communication', 'Respectful relationships', 'Diversity & inclusion', 'Innovation & creativity', 'Supportive teamwork', 'Other']
            },
            // Section 3: Management & Leadership
            {
                text: 'My manager provides constructive feedback and supports my professional growth.',
                type: 'RATING_SCALE',
                required: true,
                order: 7,
                minValue: 1,
                maxValue: 5
            },
            {
                text: 'I trust the leadership team to make decisions in the best interest of employees and the company.',
                type: 'RATING_SCALE',
                required: true,
                order: 8,
                minValue: 1,
                maxValue: 5
            },
            {
                text: 'Rank the following leadership qualities based on their importance to you (1 = Most Important):',
                type: 'CHECKBOX',
                required: true,
                order: 9,
                options: ['Transparent communication', 'Empowering employees', 'Recognizing achievements', 'Providing vision and direction']
            },
            // Section 4: Career Development & Growth
            {
                text: 'I have sufficient opportunities to grow my skills and advance my career within the organization.',
                type: 'RATING_SCALE',
                required: true,
                order: 10,
                minValue: 1,
                maxValue: 5
            },
            {
                text: 'Which development opportunities would you find most valuable? (Select up to 2)',
                type: 'CHECKBOX',
                required: true,
                order: 11,
                options: ['Training programs', 'Mentorship and coaching', 'Cross-departmental projects', 'Leadership development programs', 'External workshops/certifications', 'Other']
            },
            // Section 5: Well-being & Overall Engagement
            {
                text: 'I feel motivated and engaged in my day to day work.',
                type: 'RATING_SCALE',
                required: true,
                order: 12,
                minValue: 1,
                maxValue: 5
            },
            {
                text: 'Overall, how satisfied are you with your experience working at iscore?',
                type: 'RATING_SCALE',
                required: true,
                order: 13,
                minValue: 1,
                maxValue: 5
            },
            // Section 6: Open-Ended Questions
            {
                text: 'What do you enjoy most about working at iscore?',
                type: 'TEXTAREA',
                required: false,
                order: 14
            },
            {
                text: 'If you could change one thing to make iscore a better place to work, what would it be?',
                type: 'TEXTAREA',
                required: false,
                order: 15
            }
        ];

        // Create all questions
        for (const questionData of questions) {
            await prisma.surveyQuestion.create({
                data: {
                    ...questionData,
                    surveyId: newSurvey.id
                }
            });
        }

        console.log('✅ All 15 questions created successfully!');
        console.log('🎉 Employee Satisfaction & Engagement Survey is ready to publish!');
        console.log('📊 Survey ID:', newSurvey.id);
        console.log('📝 Title:', newSurvey.title);
        console.log('📅 Status:', newSurvey.status);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanupAndCreateSurvey();