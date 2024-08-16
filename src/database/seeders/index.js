const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const data = require('./data.json');

async function generateAdmin() {
    try {
        let now = Math.floor(Date.now() / 1000);

        let users = [
            {
                username: "superadmin",
                password: bcrypt.hashSync('password', 10),
                is_superadmin: true,
                created_at_unix: now,
                updated_at_unix: now
            },
            {
                username: "admin",
                password: bcrypt.hashSync('password', 10),
                is_superadmin: false,
                created_at_unix: now,
                updated_at_unix: now
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

async function generateCard() {
    try {
        let now = Math.floor(Date.now() / 1000);

        for (let cat of data.categories) {
            let category = await prisma.cardCategory.create({
                data: {
                    name: cat.name,
                    created_at_unix: now,
                    updated_at_unix: now
                }
            });

            for (let card of cat.cards) {
                let levels = data.levels.map((level) => {
                    let random = Math.random() * 20 + 1;
                    return {
                        level: level.level,
                        upgrade_price: Math.floor(level.upgrade_price * random),
                        profit_per_hour: Math.floor(level.profit_per_hour * random)
                    };
                });

                await prisma.card.create({
                    data: {
                        name: card.name,
                        icon_url: card.icon_url,
                        category_id: category.id,
                        levels: JSON.stringify(levels),
                        created_at_unix: now,
                        updated_at_unix: now
                    }
                });
            }
        }
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

generateCard()
    .catch((e) => {
        console.error("generateCard function error:", e);
        process.exit(1);
    });
