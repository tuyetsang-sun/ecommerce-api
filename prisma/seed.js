import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const [role, membership] = await prisma.$transaction([
        prisma.role.upsert({
            where: {
                rolename: 'normal',
            },
            update: {},
            create: {
                rolename: 'normal',
            },
        }),

        prisma.memberShip.upsert({
            where: {
                mname: 'normal',
            },
            update: {},
            create: {
                mname: 'normal',
                score: 10,
            },
        }),
    ]);

    console.log('Khởi tạo dữ liệu nền thành công.');
    console.table([role]);
    console.table([membership]);
}

main()
    .catch((error) => {
        console.error('Khởi tạo dữ liệu thất bại:', error.message);
        process.exitCode = 1;
    })
    .finally(async() => {
        await prisma.$disconnect();
    });