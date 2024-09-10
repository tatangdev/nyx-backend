const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });
yaml = require('js-yaml');

const moment = require('moment-timezone');
const TIMEZONE = process.env.TIMEZONE || 'Asia/Jakarta';

module.exports = {
    index: async (req, res, next) => {
        try {
            let playerId = req.user.id;
            let configs = await prisma.config.findMany({
                where: {
                    is_active: true,
                    key: {
                        in: ['boost_earnings_taps', 'boost_max_taps']
                    }
                }
            });

            let earning = await prisma.playerEarning.findFirst({
                where: {
                    player_id: playerId
                }
            });

            let boosts = [];
            // full energy
            boosts.push({
                id: 'boost_full_available_taps',
                name: 'Full Energy',
                quota: 6,
                used: earning.recharge_earning_energy,
            });

            // tap earning boost
            let tapLevel = earning ? earning.tap_earning_level : 1;
            let _boostEarningTap = configs.find(c => c.key === 'boost_earnings_taps');
            let boostEarningTap = yaml.load(_boostEarningTap.value);
            let currentBoostEarningTap = boostEarningTap.find(b => b.level === tapLevel);
            let nextBoostEarningTap = boostEarningTap.find(b => b.level === tapLevel + 1);
            let maxBoostEarningTap = boostEarningTap.find(b => b.level === boostEarningTap.length);
            boosts.push({
                id: 'boost_earnings_taps',
                name: 'Multitap',
                level: currentBoostEarningTap.level,
                next_level: nextBoostEarningTap ? nextBoostEarningTap.level : null,
                max_level: maxBoostEarningTap.level,
                price: nextBoostEarningTap ? nextBoostEarningTap.upgrade_price : null,
                increase_value: nextBoostEarningTap ? 1 : null,
            });

            // tap energy boost
            let energyLevel = earning ? earning.tap_earning_energy_level : 1;
            let _boostMaxTap = configs.find(c => c.key === 'boost_max_taps');
            let boostMaxTap = yaml.load(_boostMaxTap.value);
            let currentBoostMaxTap = boostMaxTap.find(b => b.level === energyLevel);
            let nextBoostMaxTap = boostMaxTap.find(b => b.level === energyLevel + 1);
            let maxBoostMaxTap = boostMaxTap.find(b => b.level === boostMaxTap.length);
            boosts.push({
                id: 'boost_max_taps',
                name: 'Energy Limit',
                level: currentBoostMaxTap.level,
                next_level: nextBoostMaxTap ? nextBoostMaxTap.level : null,
                max_level: maxBoostMaxTap.level,
                price: nextBoostMaxTap ? nextBoostMaxTap.upgrade_price : null,
                increase_value: nextBoostMaxTap ? nextBoostMaxTap.increase_value : null,
            });

            res.json({
                status: true,
                message: "OK",
                error: null,
                data: boosts
            });
        } catch (error) {
            next(error);
        }
    },

    upgrade: async (req, res, next) => {
        const now = moment().tz(TIMEZONE);
        try {
            let playerId = req.user.id;

            let player = await prisma.player.findFirst({
                where: {
                    id: playerId
                }
            });

            let earning = await prisma.playerEarning.findFirst({
                where: {
                    player_id: playerId
                }
            });

            let configs = await prisma.config.findMany({
                where: {
                    is_active: true,
                }
            });

            // player level
            let _levelConfig = configs.find(c => c.key === 'level');
            let levels = yaml.load(_levelConfig.value);

            let message = "";

            let updateEarningData = {};
            let requireUpdatePlayerLevel = false;
            let playerLevel = levels.find(l => l.level === player.level);
            let newPlayerSpend = 0;
            let newBalance = 0;
            switch (req.body.boost_id) {
                case 'boost_full_available_taps':
                    if (earning.recharge_earning_energy <= 0) {
                        return res.status(400).json({
                            status: false,
                            message: "Reach quota limit",
                            error: null,
                            data: null
                        });
                    }

                    if (earning.tap_earning_energy_available === earning.tap_earning_energy) {
                        return res.status(400).json({
                            status: false,
                            message: "Energy is full",
                            error: null,
                            data: null
                        });
                    }

                    updateEarningData = {
                        tap_earning_energy_available: earning.tap_earning_energy,
                        recharge_earning_energy: earning.recharge_earning_energy - 1,
                    };

                    message = "Energy recharged!";
                    break;
                case 'boost_earnings_taps':
                    let tapLevel = earning ? earning.tap_earning_level : 1;
                    let _boostEarningTap = configs.find(c => c.key === 'boost_earnings_taps');
                    let boostEarningTap = yaml.load(_boostEarningTap.value);
                    let nextBoostEarningTap = boostEarningTap.find(b => b.level === tapLevel + 1);

                    if (!nextBoostEarningTap) {
                        return res.status(400).json({
                            status: false,
                            message: "Max level reached",
                            error: null,
                            data: null
                        });
                    }

                    if (earning.coins_balance < nextBoostEarningTap.upgrade_price) {
                        return res.status(400).json({
                            status: false,
                            message: "Insufficient balance",
                            error: null,
                            data: null
                        });
                    }

                    newBalance = earning.coins_balance - nextBoostEarningTap.upgrade_price;
                    newPlayerSpend = earning.coins_total - newBalance;

                    // determine current user level
                    playerLevel = levels.reduce((acc, level) => {
                        return level.minimum_score <= newPlayerSpend ? level : acc;
                    }, levels[0]);

                    // update player level
                    if (playerLevel.level > player.level) {
                        requireUpdatePlayerLevel = true;
                    }

                    updateEarningData = {
                        coins_balance: newBalance,
                        tap_earning_value: playerLevel.tap_earning_value + nextBoostEarningTap.addition_value,
                        tap_earning_level: nextBoostEarningTap.level,
                        updated_at_unix: now.unix()
                    };

                    message = `Boost is yours! Multitap ${nextBoostEarningTap.level} lvl`;
                    break;
                case 'boost_max_taps':
                    let energyLevel = earning ? earning.tap_earning_energy_level : 1;
                    let _boostMaxTap = configs.find(c => c.key === 'boost_max_taps');
                    let boostMaxTap = yaml.load(_boostMaxTap.value);
                    let nextBoostMaxTap = boostMaxTap.find(b => b.level === energyLevel + 1);

                    if (!nextBoostMaxTap) {
                        return res.status(400).json({
                            status: false,
                            message: "Max level reached",
                            error: null,
                            data: null
                        });
                    }

                    if (earning.coins_balance < nextBoostMaxTap.upgrade_price) {
                        return res.status(400).json({
                            status: false,
                            message: "Insufficient balance",
                            error: null,
                            data: null
                        });
                    }

                    newBalance = earning.coins_balance - nextBoostMaxTap.upgrade_price;
                    newPlayerSpend = earning.coins_total - newBalance;

                    // determine current user level
                    playerLevel = levels.reduce((acc, level) => {
                        return level.minimum_score <= newPlayerSpend ? level : acc;
                    }, levels[0]);

                    // update player level
                    if (playerLevel.level > player.level) {
                        requireUpdatePlayerLevel = true;
                    }

                    updateEarningData = {
                        coins_balance: newBalance,
                        tap_earning_energy: playerLevel.tap_earning_energy + nextBoostMaxTap.addition_value,
                        tap_earning_energy_level: nextBoostMaxTap.level,
                        updated_at_unix: now.unix()
                    };

                    // update earning: tap_earning_level, coins_total, coins_balance, passive_per_hour

                    // point history

                    // passive earning history

                    message = `Boost is yours! Energy Limit ${nextBoostMaxTap.level} lvl`;
                    break;
                default:
                    return res.status(400).json({
                        status: false,
                        message: "Invalid boost id",
                        error: null,
                        data: null
                    });
            }

            // update the energy
            if (Object.keys(updateEarningData).length > 0) {
                await prisma.playerEarning.update({
                    where: {
                        player_id: playerId
                    },
                    data: updateEarningData
                });

                // point history
                await prisma.pointHistory.create({
                    data: {
                        player_id: playerId,
                        amount: newPlayerSpend,
                        type: req.body.boost_id,
                        data: yaml.dump({
                            nominal: newPlayerSpend,
                            previous_balance: earning.coins_balance,
                            previous_total: earning.coins_total,
                            new_balance: newBalance,
                            new_total: earning.coins_total,
                            note: message,
                        }),
                        created_at_unix: now.unix(),
                    }
                });

                if (requireUpdatePlayerLevel) {
                    // update player level
                    await prisma.player.update({
                        where: {
                            id: playerId
                        },
                        data: {
                            level: playerLevel.level
                        }
                    });


                    // level history
                    await prisma.levelHistory.create({
                        data: {
                            player_id: playerId,
                            level: playerLevel.level,
                            data: yaml.dump({
                                previous_level: player.level,
                                new_level: playerLevel.level,
                                note: `Upgrade player to level ${playerLevel.level}`,
                                spend: newPlayerSpend
                            }),
                            created_at_unix: now.unix(),
                        }
                    });

                    // referral bonus
                    if (player.referee_id) {
                        await prisma.playerEarning.update({
                            where: { player_id: player.referee_id },
                            data: {
                                coins_balance: {
                                    increment: playerLevel.level_up_reward
                                },
                                coins_total: {
                                    increment: playerLevel.level_up_reward
                                },
                                updated_at_unix: now.unix()
                            }
                        });

                        let refereePoint = await prisma.playerEarning.findFirst({
                            where: { player_id: player.referee_id }
                        });

                        await prisma.pointHistory.create({
                            data: {
                                player_id: player.referee_id,
                                amount: playerLevel.level_up_reward,
                                type: 'REFERRAL_BONUS',
                                data: yaml.dump({
                                    nominal: playerLevel.level_up_reward,
                                    previous_balance: refereePoint.coins_balance,
                                    previous_total: refereePoint.coins_total,
                                    new_balance: refereePoint.coins_balance + playerLevel.level_up_reward,
                                    new_total: refereePoint.coins_total + playerLevel.level_up_reward,
                                    note: `Referral bonus for player level up to level ${playerLevel.level}`,
                                }),
                                created_at_unix: now.unix(),
                            }
                        });
                    }
                }
            }

            return res.json({
                status: true,
                message: message,
                error: null,
                data: null
            });
        } catch (error) {
            next(error);
        }
    },
};