const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
    try {
        console.log('Testing database connection...');
        
        // Check if users exist
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                employeeId: true
            }
        });
        
        console.log('Found users:');
        users.forEach(user => {
            console.log(`- ${user.email} (${user.role}) - ${user.firstName} ${user.lastName} - ID: ${user.employeeId}`);
        });
        
        // Try to find HR user specifically
        const hrUser = await prisma.user.findUnique({
            where: { email: 'hr@iscore.com' }
        });
        
        if (hrUser) {
            console.log('\n✅ HR user found:', hrUser.email);
        } else {
            console.log('\n❌ HR user NOT found!');
        }
        
        // Try to find Employee user specifically
        const empUser = await prisma.user.findUnique({
            where: { email: 'employee@iscore.com' }
        });
        
        if (empUser) {
            console.log('✅ Employee user found:', empUser.email);
        } else {
            console.log('❌ Employee user NOT found!');
        }
        
    } catch (error) {
        console.error('❌ Database test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testDatabase();

