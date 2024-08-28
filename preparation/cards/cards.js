require('dotenv').config();
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });
let data = require('./cards.json');

const moment = require('moment-timezone');
const TIMEZONE = process.env.TIMEZONE || 'Asia/Jakarta';

async function main() {
    let results = [];
    const now = moment().tz(TIMEZONE);

    for (const [categoryIndex, category] of data.categories.entries()) {
        // if (categoryIndex > 0) continue; // only process the first category

        let newCategory = await prisma.cardCategory.create({
            data: {
                name: category.name,
                is_active: true,
                created_at_unix: now.unix(),
                updated_at_unix: now.unix()
            }
        });

        for (const [cardIndex, card] of category.cards.entries()) {
            // if (cardIndex > 0) continue; // only process the first card

            card.levels = [];
            let previousLevel = null;
            for (let i = 0; i <= card.level_count; i++) {
                let price = null;
                let profitPerHour = null;
                let profitPerHourIncrease = null;
                let priceMultiplier = null;
                let profitPerHourMultiplier = null;

                if (i === 0) {
                    price = card.base_price;
                    profitPerHour = card.base_profit_per_hour;
                    profitPerHourIncrease = card.base_profit_per_hour;
                } else {
                    price = previousLevel.upgrade_price + (previousLevel.upgrade_price * card.price_multiplier);
                    profitPerHourIncrease = previousLevel.profit_per_hour * card.profit_per_hour_multiplier;
                    profitPerHour = previousLevel.profit_per_hour + profitPerHourIncrease;
                    priceMultiplier = card.price_multiplier;
                    profitPerHourMultiplier = card.profit_per_hour_multiplier;
                }

                let level = {
                    level: i,
                    upgrade_price: price,
                    profit_per_hour_increase: profitPerHourIncrease,
                    profit_per_hour: profitPerHour,
                    price_multiplier: priceMultiplier,
                    profit_per_hour_multiplier: profitPerHourMultiplier,
                    respawn_time: null
                };
                card.levels.push(level);
                previousLevel = level;
            }

            results.push({
                name: card.name,
                description: card.description,
                image: card.image,
                category_id: newCategory.id,
                levels: JSON.stringify(card.levels),
                condition: null,
                is_published: false,
                created_at_unix: now.unix(),
                updated_at_unix: now.unix(),
                available_duration: null,
                published_at_unix: null
            });
        }
    }

    await prisma.card.createMany({
        data: results
    });

    // results.forEach((result) => {
    //     console.log(JSON.parse(result.levels));
    // });

    // console.log("results:", results);
    fs.writeFileSync('./example/cards-haha.json', JSON.stringify(results, null, 4));
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
