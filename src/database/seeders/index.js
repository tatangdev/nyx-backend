const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function generateAdmin() {
    try {
        let users = [
            {
                username: "superadmin",
                password: bcrypt.hashSync('password', 10),
                is_superadmin: true,
            },
            {
                username: "admin",
                password: bcrypt.hashSync('password', 10),
                is_superadmin: false,
            }
        ];

        await prisma.user.createMany({
            data: users
        });

        console.log("Data seeding completed successfully.");
    } catch (error) {
        console.error("Error seeding data:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

generateAdmin()
    .catch((e) => {
        console.error("generateAdmin function error:", e);
        process.exit(1);
    });
