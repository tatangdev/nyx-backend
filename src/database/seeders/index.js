require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });
const bcrypt = require('bcrypt');

const moment = require('moment-timezone');
const TIMEZONE = process.env.TIMEZONE || 'Asia/Jakarta';

const cards = require('./cards.json');
async function generateCard() {
    try {
        for (let category of cards) {
            let newCategory = await prisma.cardCategory.create({
                data: {
                    name: category.name,
                    is_active: category.is_active,
                    created_at_unix: category.created_at_unix,
                    updated_at_unix: category.updated_at_unix,
                }
            });

            for (let card of category.cards) {
                await prisma.card.create({
                    data: {
                        name: card.name,
                        description: card.description,
                        image: card.image,
                        category_id: newCategory.id,
                        levels: card.levels,
                        condition: card.condition,
                        is_published: card.is_published,
                        created_at_unix: card.created_at_unix,
                        updated_at_unix: card.updated_at_unix,
                        available_duration: card.available_duration,
                        published_at_unix: card.published_at_unix,
                    }
                });
            }
        }
    } catch (error) {
        console.log(error);
    }
}

const combos = require('./card_combos.json');
async function generateCardCombo() {
    try {
        for (let combo of combos) {
            await prisma.cardCombo.create({
                data: {
                    date: combo.date,
                    combination: combo.combination,
                    reward_coins: combo.reward_coins,
                    created_at_unix: combo.created_at_unix,
                    updated_at_unix: combo.updated_at_unix,
                }
            });
        }
    } catch (error) {
        console.log(error);
    }
}

const tasks = require('./tasks.json');
async function generateTask() {
    try {
        for (let task of tasks) {
            await prisma.cardCombo.create({
                data: {
                    name: task.name,
                    image: task.image,
                    type: task.type,
                    reward_coins: task.reward_coins,
                    config: task.config,
                    is_published: task.is_published,
                    requires_admin_approval: task.requires_admin_approval,
                    created_at_unix: task.created_at_unix,
                    updated_at_unix: task.updated_at_unix,
                }
            });
        }
    } catch (error) {
        console.log(error);
    }
}

const configs = require('./configs.json');
async function generateConfig() {
    try {
        for (let config of configs) {
            await prisma.config.create({
                data: {
                    key: config.key,
                    value: config.value,
                    is_active: config.is_active,
                    created_at_unix: config.created_at_unix,
                    updated_at_unix: config.updated_at_unix,
                }
            });
        }
    } catch (error) {
        console.log(error);
    }
}

async function generateAdmin() {
    try {
        const now = moment().tz(TIMEZONE);
        const defaultPassword = process.env.DEFAULT_PASSWORD || 'password';

        let users = [
            {
                username: "superadmin",
                password: bcrypt.hashSync(defaultPassword, 10),
                is_superadmin: true,
                created_at_unix: now.unix(),
                updated_at_unix: now.unix()
            },
            {
                username: "admin",
                password: bcrypt.hashSync(defaultPassword, 10),
                is_superadmin: false,
                created_at_unix: now.unix(),
                updated_at_unix: now.unix()
            }
        ];

        await prisma.user.createMany({
            data: users
        });
    } catch (error) {
        console.log(error);
    }
}

generateCard();
generateCardCombo();
generateTask();
generateConfig();
generateAdmin();