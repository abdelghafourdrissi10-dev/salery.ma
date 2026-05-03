import { PrismaClient, Role, SalaryType } from '@prisma/client'
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding SaaS database...')

    // Clean DB conceptually (we rely on db push --accept-data-loss usually, but just in case)

    // 1. Create a Company
    const company = await prisma.company.create({
        data: {
            name: 'Salery Tech Corp',
            address: 'Casablanca Technopark',
            phone: '+212600000000',
            email: 'admin@salery.ma'
        }
    })
    console.log('Created company:', company.name)

    // 2. Create Admin User
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
        data: {
            email: 'admin@salery.ma',
            password: hashedPassword,
            role: Role.ADMIN,
            companyId: company.id
        }
    })
    console.log('Created Admin User:', admin.email)

    // 3. Create Employees
    const emp1 = await prisma.employee.create({
        data: {
            firstName: 'Ahmed',
            lastName: 'Benali',
            email: 'ahmed.benali@salery.ma',
            phone: '+212611111111',
            position: 'Software Engineer',
            salaryType: SalaryType.MONTHLY,
            baseSalary: 15000,
            companyId: company.id,
            hireDate: new Date('2023-01-15')
        }
    })

    const emp2 = await prisma.employee.create({
        data: {
            firstName: 'Fatima',
            lastName: 'Zahra',
            email: 'fatima.zahra@salery.ma',
            phone: '+212622222222',
            position: 'HR Manager',
            salaryType: SalaryType.MONTHLY,
            baseSalary: 18000,
            companyId: company.id,
            hireDate: new Date('2022-11-01')
        }
    })
    console.log('Created employees:', emp1.firstName, emp2.firstName)

    // 4. Sample Attendance
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const checkIn = new Date(today)
    checkIn.setHours(9, 0, 0, 0)

    const checkOut = new Date(today)
    checkOut.setHours(18, 0, 0, 0)

    await prisma.attendance.create({
        data: {
            employeeId: emp1.id,
            date: today,
            checkIn: checkIn,
            checkOut: checkOut,
            hoursWorked: 9
        }
    })
    console.log('Created attendance record.')

    // 5. Sample Salary
    await prisma.salary.create({
        data: {
            employeeId: emp1.id,
            month: '2023-10',
            baseSalary: 15000,
            overtimeHours: 5,
            overtimePay: 1000,
            bonuses: 500,
            deductions: 200,
            netSalary: 16300
        }
    })

    await prisma.salary.create({
        data: {
            employeeId: emp2.id,
            month: '2023-10',
            baseSalary: 18000,
            overtimeHours: 0,
            overtimePay: 0,
            bonuses: 1000,
            deductions: 500,
            netSalary: 18500
        }
    })
    console.log('Created production salary records.')

    console.log('SaaS Database seeding completed successfully.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
