const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const data = require('./data.json');

async function generateAdmin() {
    try {
        const now = moment().tz(TIMEZONE);

        let users = [
            {
                username: "superadmin",
                password: bcrypt.hashSync('password', 10),
                is_superadmin: true,
                created_at_unix: now.unix(),
                updated_at_unix: now.unix()
            },
            {
                username: "admin",
                password: bcrypt.hashSync('password', 10),
                is_superadmin: false,
                created_at_unix: now.unix(),
                updated_at_unix: now.unix()
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

function normalizeTitle(title) {
    const smallWords = ['and', 'or', 'the', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'a', 'an', 'but', 'nor', 'to', 'from'];

    return title
        .toLowerCase()
        .split(' ')
        .map((word, index) =>
            smallWords.includes(word) && index !== 0 && index !== title.split(' ').length - 1
                ? word
                : word.charAt(0).toUpperCase() + word.slice(1)
        )
        .join(' ');
}

async function generateCard() {
    try {
        const now = moment().tz(TIMEZONE);

        for (let cat of data.categories) {
            let category = await prisma.cardCategory.create({
                data: {
                    name: cat.name,
                    created_at_unix: now.unix(),
                    updated_at_unix: now.unix()
                }
            });

            for (let card of cat.cards) {
                if (!card.base_price) {
                    card.base_price = Math.round(Math.random() * 9000) + 1000; // Random between 1000 and 10000
                }
                if (!card.base_profit_per_hour) {
                    card.base_profit_per_hour = card.base_price * 1.4;
                }
                if (!card.level_count) {
                    card.level_count = 25;
                }
                if (!card.image) {
                    let randomIndex = Math.floor(Math.random() * data.coins.length);
                    card.image = data.coins[randomIndex].image_url;
                }


                let levels = [];
                let previousLevel = {};

                for (let i = 0; i < card.level_count; i++) {
                    let isFirstLevel = i === 0;

                    let profitPerHourIncrease = isFirstLevel
                        ? Math.round(card.base_profit_per_hour * card.base_profit_per_hour_multiplier)
                        : Math.round(previousLevel.profit_per_hour_increase * (1 + card.base_profit_per_hour_multiplier));

                    let upgradePrice = isFirstLevel
                        ? Math.round(card.base_price * card.base_price_multiplier)
                        : Math.round(previousLevel.upgrade_price * (1 + card.base_price_multiplier));

                    // Example respawn time calculation: increasing by 10 minutes per level
                    let respawnTime = isFirstLevel
                        ? 0 // No respawn time for level 1
                        : previousLevel.respawn_time + 10; // Increase by 10 minutes for each subsequent level


                    let level = {
                        level: i + 1,
                        upgrade_price: upgradePrice,
                        profit_per_hour_increase: profitPerHourIncrease,
                        profit_per_hour: isFirstLevel ? profitPerHourIncrease : previousLevel.profit_per_hour + profitPerHourIncrease,
                        price_multiplier: card.base_price_multiplier,
                        profit_per_hour_multiplier: card.base_profit_per_hour_multiplier,
                        respawn_time: respawnTime // Add respawn time to the level data
                    };

                    levels.push(level);
                    previousLevel = level;
                }

                await prisma.card.create({
                    data: {
                        name: card.name,
                        image: card.image,
                        category_id: category.id,
                        levels: JSON.stringify(levels),
                        created_at_unix: now.unix(),
                        updated_at_unix: now.unix()
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

async function generateCardCombo() {
    try {
        const now = moment().tz(TIMEZONE);

        let combos = await prisma.card.findMany({
            where: {
                is_published: true
            }
        });

        // generate date from now to +30 days with format 2024-12-31 in a array
        let dates = [];
        for (let i = 0; i < 30; i++) {
            let date = new Date();
            date.setDate(date.getDate() + i);
            dates.push(date.toISOString().split('T')[0]);
        }

        // let firstCard = combos[Math.floor(Math.random() * combos.length)];
        // let secondCard = combos[Math.floor(Math.random() * combos.length)];
        // let thirdCard = combos[Math.floor(Math.random() * combos.length)];

        // // validate if the cards are not the same
        // if (firstCard.id === secondCard.id || firstCard.id === thirdCard.id || secondCard.id === thirdCard.id) {
        //     return generateCardCombo();
        // }

        // let users = [
        //     {
        //         username: "superadmin",
        //         password: bcrypt.hashSync('password', 10),
        //         is_superadmin: true,
        //         created_at_unix: now.unix(),
        //         updated_at_unix: now.unix()
        //     },
        //     {
        //         username: "admin",
        //         password: bcrypt.hashSync('password', 10),
        //         is_superadmin: false,
        //         created_at_unix: now.unix(),
        //         updated_at_unix: now.unix()
        //     }
        // ];

        // await prisma.user.createMany({
        //     data: users
        // });

        console.log("Data seeding completed successfully.");
    } catch (error) {
        console.error("Error seeding data:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// generateAdmin()
//     .catch((e) => {
//         console.error("generateAdmin function error:", e);
//         process.exit(1);
//     });

generateCard()
    .catch((e) => {
        console.error("generateCard function error:", e);
        process.exit(1);
    });
