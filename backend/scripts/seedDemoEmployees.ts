/**
 * SALERY DEMO SEED — Add realistic Moroccan company employees
 * Run: node -e "require('ts-node').register({transpileOnly:true}); require('./scripts/seedDemoEmployees.ts');"
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const demoEmployees = [
    { firstName: 'Karim', lastName: 'El Idrissi', email: 'karim.elidrissi@salery.ma', phone: '+212661001001', position: 'Directeur Général', baseSalary: 35000, hireDate: '2020-01-15' },
    { firstName: 'Nadia', lastName: 'Bensouda', email: 'nadia.bensouda@salery.ma', phone: '+212661002002', position: 'Responsable Finance', baseSalary: 22000, hireDate: '2021-03-10' },
    { firstName: 'Youssef', lastName: 'Amrani', email: 'youssef.amrani@salery.ma', phone: '+212661003003', position: 'Développeur Senior', baseSalary: 16000, hireDate: '2021-06-20' },
    { firstName: 'Zineb', lastName: 'Cherkaoui', email: 'zineb.cherkaoui@salery.ma', phone: '+212661004004', position: 'Chef de Projet', baseSalary: 18000, hireDate: '2020-09-01' },
    { firstName: 'Mohamed', lastName: 'Tazi', email: 'mohamed.tazi@salery.ma', phone: '+212661005005', position: 'Commercial Senior', baseSalary: 12000, hireDate: '2022-02-14' },
    { firstName: 'Salma', lastName: 'Benali', email: 'salma.benali@salery.ma', phone: '+212661006006', position: 'Assistante RH', baseSalary: 9500, hireDate: '2022-05-30' },
    { firstName: 'Hassan', lastName: 'Ouazzani', email: 'hassan.ouazzani@salery.ma', phone: '+212661007007', position: 'Comptable', baseSalary: 11000, hireDate: '2021-11-08' },
    { firstName: 'Maryem', lastName: 'El Fassi', email: 'maryem.elfassi@salery.ma', phone: '+212661008008', position: 'Designer UX', baseSalary: 13000, hireDate: '2023-01-03' },
    { firstName: 'Omar', lastName: 'Lahlou', email: 'omar.lahlou@salery.ma', phone: '+212661009009', position: 'Technicien IT', baseSalary: 8500, hireDate: '2022-08-15' },
    { firstName: 'Houda', lastName: 'Squalli', email: 'houda.squalli@salery.ma', phone: '+212661010010', position: 'Marketing Manager', baseSalary: 17000, hireDate: '2020-12-01' },
];

async function seed() {
    const company = await prisma.company.findFirst();
    if (!company) {
        console.error('❌ No company found. Please run the main seed first.');
        process.exit(1);
    }

    console.log(`\n🚀 Adding ${demoEmployees.length} demo employees to company: ${company.name}\n`);

    let added = 0;
    let skipped = 0;

    for (const emp of demoEmployees) {
        const existing = await prisma.employee.findFirst({
            where: { email: emp.email }
        });

        if (existing) {
            console.log(`  ↻ Already exists: ${emp.firstName} ${emp.lastName}`);
            skipped++;
            continue;
        }

        await prisma.employee.create({
            data: {
                firstName: emp.firstName,
                lastName: emp.lastName,
                email: emp.email,
                phone: emp.phone,
                position: emp.position,
                salaryType: 'MONTHLY',
                baseSalary: emp.baseSalary,
                companyId: company.id,
                hireDate: new Date(emp.hireDate),
            }
        });

        console.log(`  ✅ Added: ${emp.firstName} ${emp.lastName} — ${emp.position} — ${emp.baseSalary.toLocaleString()} DH`);
        added++;
    }

    const total = await prisma.employee.count();
    console.log(`\n────────────────────────────────────────`);
    console.log(`✅ Added:  ${added}`);
    console.log(`↻  Skipped (already exist): ${skipped}`);
    console.log(`📊 Total employees in DB now: ${total}`);
    console.log(`────────────────────────────────────────\n`);

    await prisma.$disconnect();
}

seed().catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
});
