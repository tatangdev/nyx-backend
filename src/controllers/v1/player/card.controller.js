const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });
const moment = require('moment-timezone');
const TIMEZONE = process.env.TIMEZONE || 'Asia/Jakarta';

module.exports = {
    list: async (req, res, next) => {
        try {
            let filter = 'is_published';
            if (req.query.category_id) {
                filter += ` AND category_id = ${parseInt(req.query.category_id)}`;
            }

            let cards = await prisma.$queryRawUnsafe(`
                SELECT 
                    c.id, 
                    c.name, 
                    c.image, 
                    COALESCE(CAST(cl.level AS INTEGER), 0) AS level,
                    cat.id AS category_id,
                    cat.name AS category_name,
                    c.levels
                FROM
                    cards c
                LEFT JOIN 
                    card_levels cl ON cl.card_id = c.id AND cl.player_id = ${req.user.id}
                INNER JOIN 
                    card_categories cat ON cat.id = c.category_id
                WHERE ${filter}
                    AND c.is_published
                    AND cat.is_active
                ORDER BY c.id;
            `);

            cards = cards.map(card => {
                card.upgrade = null;
                card.current = {
                    level: card.level,
                    profit_per_hour: 0
                };
                card.category = {
                    id: card.category_id,
                    name: card.category_name
                };

                if (card.levels) {
                    let levels = JSON.parse(card.levels);
                    let currentLevel = levels.find(item => item.level === card.level);
                    let nextLevel = levels.find(item => item.level === card.level + 1);

                    if (currentLevel) {
                        card.current = {
                            level: currentLevel.level,
                            profit_per_hour: currentLevel.profit_per_hour
                        };
                    }
                    if (nextLevel) {
                        card.upgrade = {
                            level: nextLevel.level,
                            upgrade_price: nextLevel.upgrade_price,
                            profit_per_hour: nextLevel.profit_per_hour
                        };
                    }
                }

                delete card.level;
                delete card.category_id;
                delete card.category_name;
                delete card.levels;
                return card;
            });

            return res.status(200).json({
                status: true,
                message: "Cards found",
                error: null,
                data: cards
            });
        } catch (error) {
            next(error);
        }
    },

    listV2: async (req, res, next) => {
        try {
            let filter = 'is_published';
            if (req.query.category_id) {
                filter += ` AND category_id = ${parseInt(req.query.category_id)}`;
            }

            let categories = await prisma.cardCategory.findMany({
                where: { is_active: true },
                select: {
                    id: true,
                    name: true,
                }
            });

            let cards = await prisma.$queryRawUnsafe(`
                SELECT 
                    c.id, 
                    c.name, 
                    c.image, 
                    COALESCE(CAST(cl.level AS INTEGER), 0) AS level,
                    cat.id AS category_id,
                    c.levels,
                    c.condition
                FROM
                    cards c
                LEFT JOIN 
                    card_levels cl ON cl.card_id = c.id AND cl.player_id = ${req.user.id}
                INNER JOIN 
                    card_categories cat ON cat.id = c.category_id
                WHERE ${filter}
                    AND c.is_published
                    AND cat.is_active
                ORDER BY c.id;
            `);

            cards = cards.map(card => {
                card.upgrade = null;
                card.profit_per_hour = 0;

                if (card.levels) {
                    let levels = JSON.parse(card.levels);
                    let currentLevel = levels.find(item => item.level === card.level);
                    let nextLevel = levels.find(item => item.level === card.level + 1);

                    if (currentLevel) {
                        card.level = currentLevel.level;
                        card.profit_per_hour = currentLevel.profit_per_hour;
                    }
                    if (nextLevel) {
                        let isAvailable = true;
                        let condition = JSON.parse(card.condition);
                        if (condition) {
                            isAvailable = false;
                            let requiredCard = cards.find(item => item.id === condition.id);
                            if (requiredCard && requiredCard.level >= condition.level) {
                                isAvailable = true;
                            }
                        }

                        card.upgrade = {
                            level: nextLevel.level,
                            price: nextLevel.upgrade_price,
                            profit_per_hour: nextLevel.profit_per_hour,
                            profit_per_hour_delta: nextLevel.profit_per_hour - card.profit_per_hour,
                            is_available: isAvailable,
                            condition
                        };
                    }
                }

                delete card.levels;
                delete card.condition;
                return card;
            });

            return res.status(200).json({
                status: true,
                message: "Cards found",
                error: null,
                data: { categories, cards }
            });
        } catch (error) {
            next(error);
        }
    },

    upgrade: async (req, res, next) => {
        try {
            let playerId = req.user.id;
            let player = req.user;
            let cardId = parseInt(req.body.card_id);

            let cards = await prisma.$queryRawUnsafe(`
                SELECT 
                    c.id, 
                    c.name, 
                    c.image, 
                    COALESCE(CAST(cl.level AS INTEGER), 0) AS level,
                    cat.id AS category_id,
                    c.levels,
                    c.condition,
                    p.level AS player_level
                FROM
                    cards c
                LEFT JOIN 
                    card_levels cl ON cl.card_id = c.id AND cl.player_id = ${playerId}
                INNER JOIN 
                    card_categories cat ON cat.id = c.category_id
                INNER JOIN
                    players p ON p.id = ${playerId}
                WHERE c.is_published
                    AND cat.is_active
                ORDER BY c.id;
            `);

            let card = cards.find(item => item.id === cardId);
            if (!card) {
                return res.status(404).json({
                    status: false,
                    message: "Card not found",
                    error: null,
                    data: null
                });
            }
            card.upgrade = null;
            card.profit_per_hour = 0;

            if (card.levels) {
                let levels = JSON.parse(card.levels);
                let currentLevel = levels.find(item => item.level === card.level);
                let nextLevel = levels.find(item => item.level === card.level + 1);

                if (currentLevel) {
                    card.level = currentLevel.level;
                    card.profit_per_hour = currentLevel.profit_per_hour;
                }
                if (nextLevel) {
                    let isAvailable = true;
                    let condition = JSON.parse(card.condition);
                    if (condition) {
                        isAvailable = false;
                        let requiredCard = cards.find(item => item.id === condition.id);
                        if (requiredCard && requiredCard.level >= condition.level) {
                            isAvailable = true;
                        }
                    }

                    card.upgrade = {
                        level: nextLevel.level,
                        price: nextLevel.upgrade_price,
                        profit_per_hour: nextLevel.profit_per_hour,
                        profit_per_hour_delta: nextLevel.profit_per_hour - card.profit_per_hour,
                        is_available: isAvailable,
                        condition
                    };
                }
            }

            // get levels configuration
            let playerLevels = [];
            let levelConfig = await prisma.config.findFirst({ where: { key: 'level' } });
            if (levelConfig) {
                playerLevels = JSON.parse(levelConfig.value);
            }

            if (!card.upgrade || !card.upgrade.is_available) {
                return res.status(400).json({
                    status: false,
                    message: "Card can't be upgraded",
                    error: null,
                    data: null
                });
            }

            await prisma.$transaction(async (prisma) => {
                let now = Math.floor(Date.now() / 1000);
                let point = await prisma.playerEarning.findFirst({
                    where: {
                        player_id: playerId
                    }
                });

                if (point.coins_balance < card.upgrade.price) {
                    throw new Error("Insufficient balance");
                }

                let newBalance = point.coins_balance - card.upgrade.price;
                let newProfitPerHour = point.passive_per_hour + card.upgrade.profit_per_hour_delta;
                let newPlayerSpend = point.coins_total - newBalance;

                // determine current user level
                let currentLevel = playerLevels.reduce((acc, level) => {
                    return level.minimum_score <= newPlayerSpend ? level : acc;
                }, playerLevels[0]);
                if (currentLevel.level > card.player_level) {
                    await prisma.player.update({
                        where: { id: playerId },
                        data: {
                            level: currentLevel.level,
                            updated_at_unix: now
                        }
                    });

                    await prisma.levelHistory.create({
                        data: {
                            player_id: playerId,
                            level: currentLevel.level,
                            data: JSON.stringify({
                                level: currentLevel.level,
                                note: `Upgrade player to level ${currentLevel.level}`,
                            }),
                            created_at_unix: now,
                            updated_at_unix: now,
                        }
                    });

                    if (player.referee_id) {
                        await prisma.playerEarning.update({
                            where: { player_id: player.referee_id },
                            data: {
                                coins_balance: {
                                    increment: currentLevel.level_up_reward
                                },
                                coins_total: {
                                    increment: currentLevel.level_up_reward
                                },
                                updated_at_unix: now
                            }
                        });

                        await prisma.pointHistory.create({
                            data: {
                                player_id: player.referee_id,
                                amount: currentLevel.level_up_reward,
                                type: 'REFERRAL_BONUS',
                                data: JSON.stringify({
                                    referral_bonus: currentLevel.level_up_reward,
                                    note: 'Referral bonus',
                                }),
                                created_at_unix: now,
                                updated_at_unix: now,
                            }
                        });
                    }
                }

                await prisma.playerEarning.update({
                    where: { id: point.id },
                    data: {
                        coins_balance: newBalance,
                        passive_per_hour: newProfitPerHour,
                        updated_at_unix: now
                    }
                });

                let pointHistory = await prisma.pointHistory.create({
                    data: {
                        player_id: playerId,
                        amount: -card.upgrade.price,
                        type: 'CARD_UPGRADE',
                        data: JSON.stringify({
                            ...card.upgrade,
                            note: `Upgrade card ${card.name} to level ${card.upgrade.level}`,
                            upgrade_at: new Date()
                        }),
                        created_at_unix: now,
                        updated_at_unix: now,
                    }
                });

                let passiveEarningHistory = await prisma.passiveEarningHistory.create({
                    data: {
                        player_id: playerId,
                        amount: card.upgrade.profit_per_hour_delta,
                        type: 'CARD_UPGRADE',
                        data: JSON.stringify({
                            ...card.upgrade,
                            note: `Upgrade card ${card.name} to level ${card.upgrade.level}`,
                            upgrade_at: new Date()
                        }),
                        created_at_unix: now,
                        updated_at_unix: now,
                    }
                });

                let levelData = card.level_data ? JSON.parse(card.level_data) : [];
                levelData.push({
                    ...card.upgrade,
                    point_history_id: pointHistory.id,
                    passive_earning_history_id: passiveEarningHistory.id,
                    note: `Upgrade card ${card.name} to level ${card.upgrade.level}`,
                    upgrade_at: Math.floor(Date.now() / 1000)
                });

                let cardLevel = await prisma.cardLevel.findFirst({
                    where: {
                        card_id: card.id,
                        player_id: playerId
                    }
                });

                if (cardLevel) {
                    await prisma.cardLevel.update({
                        where: { id: cardLevel.id },
                        data: {
                            level: card.upgrade.level,
                            data: JSON.stringify(levelData),
                            updated_at_unix: now
                        }
                    });
                } else {
                    await prisma.cardLevel.create({
                        data: {
                            card_id: card.id,
                            player_id: playerId,
                            level: card.upgrade.level,
                            data: JSON.stringify(levelData),
                            created_at_unix: now,
                            updated_at_unix: now,
                        }
                    });
                }
            });

            return res.status(200).json({
                status: true,
                message: "Card upgraded successfully",
                error: null,
                data: null
            });
        } catch (error) {
            next(error);
        }
    },

    combo: async (req, res, next) => {
        try {
            const today = moment().tz(TIMEZONE);
            const remainSeconds = moment(today).endOf('day').diff(today, 'seconds');
            let playerId = req.user.id;

            let combo = await prisma.cardCombo.findFirst({
                where: {
                    date: today.format('YYYY-MM-DD')
                }
            });

            let isSubmitted = false;
            let submittedAt = null;
            let comboSubmission = await prisma.comboSubmission.findFirst({
                where: {
                    player_id: playerId,
                    date: today.format('YYYY-MM-DD')
                }
            });
            if (comboSubmission) {
                isSubmitted = true;
                submittedAt = moment.unix(comboSubmission.created_at_unix).tz(TIMEZONE).format();
            }


            return res.status(200).json({
                status: true,
                message: "Combo found",
                error: null,
                data: {
                    // "upgradeIds": [],
                    bonus_coins: combo ? combo.three_combo_reward : 0,
                    is_submitted: isSubmitted,
                    remain_seconds: remainSeconds,
                    submitted_at: submittedAt
                }
            });

        } catch (error) {
            next(error);
        }
    },

    submitCombo: async (req, res, next) => {
        try {
            const today = moment().tz(TIMEZONE);
            const remainSeconds = moment(today).endOf('day').diff(today, 'seconds');
            const playerId = req.user.id;
            const { combo } = req.body;

            if (!Array.isArray(combo) || combo.length !== 3) {
                return res.status(400).json({
                    status: false,
                    message: "Please provide all required fields",
                    error: null,
                    data: null
                });
            }

            const [firstCardId, secondCardId, thirdCardId] = combo;

            const comboData = await prisma.cardCombo.findFirst({
                where: { date: today.format('YYYY-MM-DD') }
            });
            if (!comboData) {
                return res.status(404).json({
                    status: false,
                    message: "Combo not found",
                    error: null,
                    data: null
                });
            }

            const existingSubmission = await prisma.comboSubmission.findFirst({
                where: { player_id: playerId, date: today.format('YYYY-MM-DD') }
            });
            if (existingSubmission) {
                return res.status(400).json({
                    status: false,
                    message: "Combo already submitted",
                    error: null,
                    data: null
                });
            }

            const correctCombo = [comboData.first_card_id, comboData.second_card_id, comboData.third_card_id]
                .filter((id, index) => id === combo[index])
                .length;

            const rewardCoins = [0, comboData.one_combo_reward, comboData.two_combo_reward, comboData.three_combo_reward][correctCombo];

            const newSubmission = await prisma.comboSubmission.create({
                data: {
                    player_id: playerId,
                    date: today.format('YYYY-MM-DD'),
                    first_card_id: firstCardId,
                    second_card_id: secondCardId,
                    third_card_id: thirdCardId,
                    correct_combo: correctCombo
                }
            });

            if (correctCombo > 0) {
                const playerEarning = await prisma.playerEarning.findFirst({
                    where: { player_id: playerId }
                });

                await prisma.playerEarning.update({
                    where: { id: playerEarning.id },
                    data: {
                        coins_balance: playerEarning.coins_balance + rewardCoins,
                        coins_total: playerEarning.coins_total + rewardCoins,
                        updated_at_unix: today.unix(),
                    }
                });

                await prisma.pointHistory.create({
                    data: {
                        player_id: playerId,
                        amount: rewardCoins,
                        type: 'COMBO_REWARD',
                        data: JSON.stringify({
                            reward_coins: rewardCoins,
                            note: "Combo reward",
                            combo_submission_id: newSubmission.id
                        }),
                        created_at_unix: today.unix(),
                        updated_at_unix: today.unix(),
                    }
                });
            }

            return res.status(200).json({
                status: true,
                message: "Combo submitted",
                error: null,
                data: {
                    correct_combo: correctCombo,
                    bonus_coins: rewardCoins,
                    is_submitted: true,
                    remain_seconds: remainSeconds
                }
            });

        } catch (error) {
            next(error);
        }
    }
};
