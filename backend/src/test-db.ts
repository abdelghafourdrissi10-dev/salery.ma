import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function runTests() {
    try {
        console.log('--- SaaS Database Connection Test ---\n')

        // 1. Fetch Companies
        const companies = await prisma.company.findMany()
        console.log('🏢 COMPANIES:')
        companies.forEach(c => console.log(` - ID: ${c.id} | Name: ${c.name}`))
        console.log('')

        // 2. Fetch Employees
        const employees = await prisma.employee.findMany({
            include: { company: true }
        })
        console.log('👨‍💼 EMPLOYEES:')
        employees.forEach(e => console.log(` - ${e.firstName} ${e.lastName} | ${e.position} | Salary Type: ${e.salaryType} | Base: ${e.baseSalary}`))
        console.log('')

        // 3. Fetch Last Salaries
        const salaries = await prisma.salary.findMany({
            include: { employee: true },
            orderBy: { createdAt: 'desc' },
            take: 5
        })
        console.log('💰 LAST SALARIES:')
        salaries.forEach(s => console.log(` - ${s.month} | ${s.employee.firstName} ${s.employee.lastName} | Net Salary: ${s.netSalary} (Base: ${s.baseSalary}, Bonus: ${s.bonuses}, Ded: ${s.deductions})`))

        console.log('\n✅ All database tests passed! Structure is sound.')

    } catch (error) {
        console.error('❌ Connection failed.')
        console.error(error)
    } finally {
        await prisma.$disconnect()
    }
}

runTests()
