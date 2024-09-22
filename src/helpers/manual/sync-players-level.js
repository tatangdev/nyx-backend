require('dotenv').config();
const prisma = require('../../libs/prisma');
const yaml = require('js-yaml');
const moment = require('moment-timezone');
const TIMEZONE = process.env.TIMEZONE || 'Asia/Jakarta';

async function main() {
    const now = moment().tz(TIMEZONE);
    const levelConfig = await prisma.config.findFirst({
        where: {
            key: 'level'
        }
    });
    levels = yaml.load(levelConfig.value);

    const players = await prisma.$queryRawUnsafe(`
        SELECT 
            p.id,
            p.level AS player_level,
            pe.id AS player_earning_id,
            pe.coins_total - pe.coins_balance AS coins_spent
        FROM 
            players p
        INNER JOIN 
            player_earnings pe ON pe.player_id = p.id;`);

    let dataIndex = 0;
    for (const player of players) {
        // player.coins_spent = 0; //              1
        // player.coins_spent = 250000; //         2
        // player.coins_spent = 1250000; //        3
        // player.coins_spent = 2500000; //        4
        // player.coins_spent = 12500000; //       5
        // player.coins_spent = 35000000; //       6
        // player.coins_spent = 100000000; //      7
        // player.coins_spent = 750000000; //      8
        // player.coins_spent = 1250000000; //     9
        // player.coins_spent = 3750000000; //    10

        let correctLevel = levels.reduce((acc, level) => {
            return level.minimum_score <= player.coins_spent ? level : acc;
        }, levels[0]);

        if (correctLevel.level != player.player_level) {
            await prisma.player.update({
                where: { id: player.id },
                data: { level: correctLevel.level }
            });

            await prisma.playerEarning.update({
                where: { id: player.player_earning_id },
                data: { player_level: correctLevel.level }
            });

            await prisma.levelHistory.create({
                data: {
                    player_id: player.id,
                    level: correctLevel.level,
                    data: yaml.dump({
                        previous_level: player.player_level,
                        new_level: correctLevel.level,
                        note: `Level updated from ${player.player_level} to ${correctLevel.level} due to level the new level requirement`,
                        spend: player.coins_spent
                    }),
                    created_at_unix: now.unix(),
                }
            });


            // console.log({
            //     id: player.id,
            //     coins_spent: player.coins_spent,
            //     player_level: player.player_level,
            //     correct_level: correctLevel.level
            // });
        }



        // if (dataIndex == 0) {
        //     console.log(correctLevel);
        //     console.log("player_id", player.id);
        //     console.log("spent", player.coins_spent);
        // }

        // console.log({
        //     id: player.id,
        //     coins_spent: player.coins_spent,
        //     player_level: player.player_level,
        //     correct_level: correctLevel.level
        // });
        dataIndex++;
    }

    // for (const player of players) {
    //     const level = Math.floor(Math.random() * 100);
    //     await prisma.player.update({
    //     where: { id: player.id },
    //     data: { level }
    //     });
    // }

    prisma.$disconnect();
}
main();