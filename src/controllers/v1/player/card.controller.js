const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });
const moment = require('moment-timezone');
const TIMEZONE = process.env.TIMEZONE || 'Asia/Jakarta';

module.exports = {
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
                    c.description,
                    c.image, 
                    COALESCE(CAST(cl.level AS INTEGER), 0) AS level,
                    cat.id AS category_id,
                    c.levels,
                    c.condition,
                    cl.updated_at_unix AS last_upgrade_at,
                    c.is_published,
                    c.available_duration,
                    c.published_at_unix
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

            let now = Math.floor(Date.now() / 1000);
            cards = cards.map(card => {
                card.upgrade = null;
                card.profit_per_hour = 0;

                if (card.levels) {
                    let levels = JSON.parse(card.levels);
                    let currentLevel = levels.find(item => item.level === card.level);
                    let nextLevel = levels.find(item => item.level === card.level + 1);



                    if (currentLevel) {
                        card.level = currentLevel.level;
                        card.profit_per_hour = currentLevel.profit_per_hour - currentLevel.profit_per_hour_increase;

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

                            let availableAt = null;
                            if (currentLevel && currentLevel.respawn_time && card.last_upgrade_at) {
                                availableAt = card.last_upgrade_at + currentLevel.respawn_time * 60;

                                if (now < availableAt) {
                                    isAvailable = false;
                                } else {
                                    availableAt = null;
                                }
                            }

                            // limited available time
                            let isLimited = false;
                            let availableUntil = null;
                            if (!currentLevel.level && card.available_duration && card.published_at_unix) {
                                let availableAtUnix = card.published_at_unix + card.available_duration * 60 * 60;
                                if (now > availableAtUnix) {
                                    isAvailable = false;
                                    availableAt = null;
                                }
                                availableUntil = availableAtUnix;
                                isLimited = true;
                            }

                            card.upgrade = {
                                level: nextLevel.level,
                                price: currentLevel.upgrade_price,
                                profit_per_hour: currentLevel.profit_per_hour,
                                profit_per_hour_delta: currentLevel.profit_per_hour_increase,
                                is_available: isAvailable,
                                available_at: availableAt,
                                is_limited: isLimited,
                                available_until: availableUntil,
                                condition
                            };
                        }
                    }
                }

                delete card.levels;
                delete card.condition;
                delete card.last_upgrade_at;
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
                    p.level AS player_level,
                    cl.updated_at_unix AS last_upgrade_at,
                    c.is_published,
                    c.available_duration,
                    c.published_at_unix
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

            let now = Math.floor(Date.now() / 1000);
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

                    let availableAt = null;
                    if (currentLevel && currentLevel.respawn_time && card.last_upgrade_at) {
                        availableAt = card.last_upgrade_at + currentLevel.respawn_time * 60;

                        if (now < availableAt) {
                            isAvailable = false;
                        } else {
                            availableAt = null;
                        }
                    }

                    // limited available time
                    let isLimited = false;
                    let availableUntil = null;
                    if (!currentLevel && card.available_duration && card.published_at_unix) {
                        let availableAtUnix = card.published_at_unix + card.available_duration * 60 * 60;
                        if (now > availableAtUnix) {
                            isAvailable = false;
                            availableAt = null;
                        }
                        availableUntil = availableAtUnix;
                        isLimited = true;
                    }

                    card.upgrade = {
                        level: nextLevel.level,
                        price: nextLevel.upgrade_price,
                        profit_per_hour: nextLevel.profit_per_hour,
                        profit_per_hour_delta: nextLevel.profit_per_hour - card.profit_per_hour,
                        is_available: isAvailable,
                        condition,
                        available_at: availableAt,
                        is_limited: isLimited,
                        available_until: availableUntil,
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
                let message = "Card can't be upgraded";
                if (card.upgrade && card.upgrade.is_limited) message = "Card is not available anymore";
                return res.status(400).json({
                    status: false,
                    message: message,
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
                                previous_level: player.level,
                                new_level: currentLevel.level,
                                note: `Upgrade player to level ${currentLevel.level}`,
                                spend: newPlayerSpend
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

                        let refereePoint = await prisma.playerEarning.findFirst({
                            where: { player_id: player.referee_id }
                        });

                        await prisma.pointHistory.create({
                            data: {
                                player_id: player.referee_id,
                                amount: currentLevel.level_up_reward,
                                type: 'REFERRAL_BONUS',
                                data: JSON.stringify({
                                    nominal: currentLevel.level_up_reward,
                                    previous_balance: refereePoint.coins_balance,
                                    previous_total: refereePoint.coins_total,
                                    new_balance: refereePoint.coins_balance + currentLevel.level_up_reward,
                                    new_total: refereePoint.coins_total + currentLevel.level_up_reward,
                                    note: `Referral bonus for player level up to level ${currentLevel.level}`,
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
                            nominal: -card.upgrade.price,
                            previous_balance: point.coins_balance,
                            previous_total: point.coins_total,
                            new_balance: newBalance,
                            new_total: point.coins_total,
                            note: `Upgrade card ${card.name} to level ${card.upgrade.level}`,
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
                            nominal: card.upgrade.profit_per_hour_delta,
                            previous_value: point.passive_per_hour,
                            new_value: newProfitPerHour,
                            note: `Upgrade card ${card.name} to level ${card.upgrade.level}`,
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
                    bonus_coins: combo ? combo.reward_coins : 0,
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

            if (!Array.isArray(combo) || combo.length !== 4) {
                return res.status(400).json({
                    status: false,
                    message: "Please provide all required fields",
                    error: null,
                    data: null
                });
            }

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

            let comboConfig = JSON.parse(comboData.combination);
            let correctCombo = 0;
            for (let i = 0; i < combo.length; i++) {
                if (combo[i] === comboConfig[i]) {
                    correctCombo++;
                }
            }

            let rewardCoins = Math.floor((correctCombo / 4) * comboData.reward_coins);

            const newSubmission = await prisma.comboSubmission.create({
                data: {
                    player_id: playerId,
                    date: today.format('YYYY-MM-DD'),
                    combination: JSON.stringify(combo),
                    correct_combo: correctCombo,
                    created_at_unix: today.unix(),
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
                            nominal: rewardCoins,
                            previous_balance: playerEarning.coins_balance,
                            previous_total: playerEarning.coins_total,
                            new_balance: playerEarning.coins_balance + rewardCoins,
                            new_total: playerEarning.coins_total + rewardCoins,
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
