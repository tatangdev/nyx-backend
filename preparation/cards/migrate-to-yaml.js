require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });
const yaml = require('js-yaml');

// async function migrateToYaml() {
//     try {
//         let cards = await prisma.card.findMany();

//         for (const card of cards) {
//             let levels = yaml.dump(JSON.parse(card.levels));
            
//             await prisma.card.update({
//                 where: {
//                     id: card.id
//                 },
//                 data: {
//                     levels: levels
//                 }
//             });
//         }
//     } catch (error) {
//         console.log(error);
//         console.log(error.message);
//     }
// }
// migrateToYaml();

async function migrateToYaml() {
    try {
        let cardCombos = await prisma.cardCombo.findMany();

        for (const combo of cardCombos) {
            let combination = yaml.dump(JSON.parse(combo.combination));
            
            await prisma.cardCombo.update({
                where: {
                    id: combo.id
                },
                data: {
                    combination: combination
                }
            });
        }
    } catch (error) {
        console.log(error);
        console.log(error.message);
    }
}
migrateToYaml();