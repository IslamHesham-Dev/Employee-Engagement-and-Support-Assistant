import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting database seed...');

    // Create HR user
    const hashedPassword = await bcrypt.hash('hrpassword123', 12);

    const hrUser = await prisma.user.upsert({
        where: { email: 'hr@iscore.com' },
        update: {},
        create: {
            email: 'hr@iscore.com',
            password: hashedPassword,
            firstName: 'HR',
            lastName: 'Manager',
            employeeId: 'HR001',
            role: 'HR',
            status: 'ACTIVE',
            language: 'ENGLISH'
        },
    });

    console.log('HR user created:', hrUser.email);

    // Create a sample employee
    const employeePassword = await bcrypt.hash('employeepass123', 12);

    const employee = await prisma.user.upsert({
        where: { email: 'employee@iscore.com' },
        update: {},
        create: {
            email: 'employee@iscore.com',
            password: employeePassword,
            firstName: 'John',
            lastName: 'Doe',
            employeeId: 'EMP001',
            role: 'EMPLOYEE',
            status: 'ACTIVE',
            language: 'ENGLISH'
        },
    });

    console.log('Sample employee created:', employee.email);
    console.log('Database seeding completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

