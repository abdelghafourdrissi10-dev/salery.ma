
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkData() {
    const companies = await prisma.company.findMany();
    const subscriptions = await prisma.subscription.findMany();
    console.log('Companies:', JSON.stringify(companies, null, 2));
    console.log('Subscriptions:', JSON.stringify(subscriptions, null, 2));
}

checkData().finally(() => prisma.$disconnect());
