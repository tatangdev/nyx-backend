require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });
const yaml = require('js-yaml');

async function migrateToYaml() {
    try {
        let cards = await prisma.card.findMany();

        for (const card of cards) {
            let levels = yaml.load(JSON.parse(card.levels));
            console.log(levels);
        }
    } catch (error) {
        console.log(error);
        console.log(error.message);
    }
}
migrateToYaml();