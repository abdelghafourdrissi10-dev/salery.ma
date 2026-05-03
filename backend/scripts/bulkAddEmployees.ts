/**
 * SALERY — Bulk Employee Import Script
 * Read a CSV/JSON with your real employees and insert them into PostgreSQL
 *
 * HOW TO USE:
 * 1. Edit the EMPLOYEES array below with your real employee data
 * 2. Run: node -e "require('ts-node').register({transpileOnly:true}); require('./scripts/bulkAddEmployees.ts');"
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════
//  👇 EDIT THIS LIST WITH YOUR REAL EMPLOYEES
// ═══════════════════════════════════════════════════════
const EMPLOYEES: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    position: string;
    baseSalary: number;
    hireDate?: string; // YYYY-MM-DD
}[] = [
        // Example — REPLACE WITH YOUR REAL EMPLOYEES:
        // { firstName: 'Amine', lastName: 'Alaoui', email: 'amine@company.ma', phone: '+212661000001', position: 'Technicien', baseSalary: 7500, hireDate: '2021-03-15' },
        // { firstName: 'Sara', lastName: 'Bennani', email: 'sara@company.ma', phone: '+212661000002', position: 'Comptable', baseSalary: 10000, hireDate: '2020-06-01' },
        // ... add more here
    ];
// ═══════════════════════════════════════════════════════

async function bulkAdd() {
    if (EMPLOYEES.length === 0) {
        console.log('\n⚠️  No employees defined in the script.');
        console.log('Please edit scripts/bulkAddEmployees.ts and fill in the EMPLOYEES array.\n');
        process.exit(0);
    }

    const company = await prisma.company.findFirst();
    if (!company) {
        console.error('❌ No company found in database.');
        process.exit(1);
    }

    console.log(`\n🚀 Adding ${EMPLOYEES.length} employees to: ${company.name}\n`);

    let added = 0, skipped = 0;

    for (const emp of EMPLOYEES) {
        const existing = emp.email
            ? await prisma.employee.findFirst({ where: { email: emp.email } })
            : await prisma.employee.findFirst({ where: { firstName: emp.firstName, lastName: emp.lastName } });

        if (existing) {
            console.log(`  ↻ Already exists: ${emp.firstName} ${emp.lastName}`);
            skipped++;
            continue;
        }

        await prisma.employee.create({
            data: {
                firstName: emp.firstName,
                lastName: emp.lastName,
                email: emp.email || null,
                phone: emp.phone || null,
                position: emp.position,
                salaryType: 'MONTHLY',
                baseSalary: emp.baseSalary,
                companyId: company.id,
                hireDate: emp.hireDate ? new Date(emp.hireDate) : new Date(),
            }
        });

        console.log(`  ✅ ${emp.firstName} ${emp.lastName} — ${emp.position} — ${emp.baseSalary.toLocaleString()} DH`);
        added++;
    }

    const total = await prisma.employee.count();
    console.log(`\n──────────────────────────────────────────`);
    console.log(`✅ Imported  : ${added}`);
    console.log(`↻  Skipped   : ${skipped}`);
    console.log(`📊 Total in DB: ${total} employees`);
    console.log(`──────────────────────────────────────────\n`);
    console.log('✅ All future PDFs will now include ALL', total, 'employees!\n');

    await prisma.$disconnect();
}

bulkAdd().catch(async e => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
