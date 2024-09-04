require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });

const yaml = require('js-yaml');
const moment = require('moment-timezone');
const TIMEZONE = process.env.TIMEZONE || 'Asia/Jakarta';
const fs = require('fs').promises;

async function main() {
    try {
        const tables = [
            'configs',
            'card_categories',
            'cards',
            'card_combos',
            'tasks',
        ];

        for (const table of tables) {
            console.log(`Backing up table ${table}`);
            const data = await prisma.$queryRawUnsafe(`SELECT * FROM ${table}`);
            fs.writeFile(`./preparation/migration/${table}.json`, JSON.stringify(data, null, 2), (err) => {
                if (err) {
                    console.error(`Error writing file for table ${table}:`, err);
                } else {
                    console.log(`Successfully backed up table ${table}`);
                }
            });
        }

    } catch (error) {
        console.log(error);
    }
}
main();