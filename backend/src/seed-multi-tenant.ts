
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function migrate() {
    const adminEmail = 'admin@salery.ma';
    const demoEmail = 'contact@salery.ma';

    // 1. Get companies
    const techCorp = await prisma.company.findFirst({ where: { name: 'Salery Tech Corp' } });
    const demoCorp = await prisma.company.findFirst({ where: { name: 'Salery Demo Corp' } });

    if (!techCorp || !demoCorp) {
        console.error('Error: Companies not found!');
        return;
    }

    // 2. Get users
    const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
    const demo = await prisma.user.findUnique({ where: { email: demoEmail } });

    if (admin) {
        await (prisma as any).userCompany.upsert({
            where: { userId_companyId: { userId: admin.id, companyId: techCorp.id } },
            create: { userId: admin.id, companyId: techCorp.id, role: 'ADMIN' },
            update: {}
        });
        await prisma.user.update({
            where: { id: admin.id },
            data: { currentCompanyId: techCorp.id }
        });
        console.log(`✅ Admin ${adminEmail} linked to ${techCorp.name}`);
    }

    if (demo) {
        await (prisma as any).userCompany.upsert({
            where: { userId_companyId: { userId: demo.id, companyId: demoCorp.id } },
            create: { userId: demo.id, companyId: demoCorp.id, role: 'ADMIN' },
            update: {}
        });
        await prisma.user.update({
            where: { id: demo.id },
            data: { currentCompanyId: demoCorp.id }
        });
        console.log(`✅ Demo User ${demoEmail} linked to ${demoCorp.name}`);
    }
}

migrate()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
