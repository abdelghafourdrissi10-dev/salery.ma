/**
 * SALERY SEED SCRIPT — Import frontend Zustand employees into PostgreSQL
 * ──────────────────────────────────────────────────────────────────────
 * Usage:
 *   npx ts-node scripts/seedFromStore.ts [path-to-employees.json]
 *
 * 1. Go to browser → Console → type:
 *      copy(JSON.stringify(JSON.parse(localStorage.getItem('salery-store')).state.employees))
 * 2. Paste into a file named: employees_export.json
 * 3. Run: npx ts-node scripts/seedFromStore.ts employees_export.json
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function seedEmployees() {
    const filePath = process.argv[2] || path.join(__dirname, 'employees_export.json');

    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        console.log('\nTo export employees from the browser console:');
        console.log('  copy(JSON.stringify(JSON.parse(localStorage.getItem(\'salery-store\')).state.employees))');
        console.log('  Then paste into employees_export.json and run this script again.\n');
        process.exit(1);
    }

    const rawData = fs.readFileSync(filePath, 'utf-8');
    const employees = JSON.parse(rawData);

    if (!Array.isArray(employees) || employees.length === 0) {
        console.log('⚠️ No employees found in file.');
        process.exit(0);
    }

    console.log(`\n🚀 Starting seed of ${employees.length} employees...\n`);

    // Get the first company as the target
    const company = await prisma.company.findFirst();
    if (!company) {
        console.error('❌ No company found in database. Please seed company first.');
        process.exit(1);
    }

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const emp of employees) {
        // Skip deleted/archived employees
        if (emp.isDeleted) { skipped++; continue; }

        const email = emp.email || null;
        const firstName = emp.firstName || (emp.fullName ? emp.fullName.split(' ')[0] : 'Inconnu');
        const lastName = emp.lastName || (emp.fullName ? emp.fullName.split(' ').slice(1).join(' ') || 'N/A' : 'N/A');

        try {
            // Check if already exists by name or email
            const existing = email
                ? await prisma.employee.findFirst({ where: { email } })
                : await prisma.employee.findFirst({ where: { firstName, lastName } });

            if (existing) {
                // Update the record to keep data fresh
                await prisma.employee.update({
                    where: { id: existing.id },
                    data: {
                        baseSalary: emp.baseSalary || existing.baseSalary,
                        position: emp.jobTitle || emp.position || existing.position,
                        phone: emp.phoneNumber || emp.phone || existing.phone,
                    }
                });
                console.log(`  ↻ Updated: ${firstName} ${lastName}`);
                skipped++;
                continue;
            }

            await prisma.employee.create({
                data: {
                    firstName,
                    lastName,
                    phone: emp.phoneNumber || emp.phone || null,
                    email: email,
                    position: emp.jobTitle || emp.position || 'Employé',
                    salaryType: 'MONTHLY',
                    baseSalary: Number(emp.baseSalary) || 3500,
                    companyId: company.id,
                    hireDate: emp.hireDate ? new Date(emp.hireDate) : new Date(),
                    badgeId: emp.cin || null,
                }
            });

            console.log(`  ✅ Imported: ${firstName} ${lastName} — ${emp.jobTitle || 'N/A'} — ${emp.baseSalary} DH`);
            imported++;
        } catch (err: any) {
            console.error(`  ❌ Failed for ${firstName} ${lastName}: ${err.message}`);
            errors++;
        }
    }

    console.log(`\n────────────────────────────────────────`);
    console.log(`✅ Imported:  ${imported}`);
    console.log(`↻  Updated/Skipped: ${skipped}`);
    console.log(`❌ Errors:   ${errors}`);
    console.log(`────────────────────────────────────────`);
    console.log(`Total in DB now: ${await prisma.employee.count()}\n`);

    await prisma.$disconnect();
}

seedEmployees().catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
});
