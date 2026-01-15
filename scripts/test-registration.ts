
import 'dotenv/config';
import prisma from '../src/lib/prisma.js';

async function testRegistration() {
    const username = `testuser_${Date.now()}`;
    console.log(`Testing registration for ${username}...`);

    try {
        // 1. Check existence
        console.log('Checking existence...');
        const existing = await prisma.user.findUnique({ where: { username } });
        console.log('Exists?', !!existing);

        // 2. Create user
        console.log('Creating user...');
        const user = await prisma.user.create({
            data: {
                username,
                passwordHash: 'dummyhash',
                pointsAccount: {
                    create: {
                        balance: 100,
                    },
                },
            },
        });
        console.log('User created:', user.id);

        // 3. Create transaction
        console.log('Creating transaction...');
        await prisma.pointsTransaction.create({
            data: {
                userId: user.id,
                type: 'gift',
                amount: 100,
                balance: 100,
                description: 'Test gift',
            },
        });
        console.log('Transaction created.');

        // Clean up
        console.log('Cleaning up...');
        await prisma.pointsTransaction.deleteMany({ where: { userId: user.id } });
        await prisma.pointsAccount.delete({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
        console.log('Cleanup done.');

    } catch (error) {
        console.error('Registration flow failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testRegistration();
