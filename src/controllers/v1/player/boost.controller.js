const { PrismaClient } = require('@prisma/client');
const { max } = require('moment-timezone');
const prisma = new PrismaClient({ log: ['query'] });
yaml = require('js-yaml');

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
            let playerLevel = levels.find(l => l.level === player.level);

            let message = "";
            let energyLevel = earning ? earning.tap_earning_energy_level : 1;
            let _boostMaxTap = configs.find(c => c.key === 'boost_max_taps');
            let boostMaxTap = yaml.load(_boostMaxTap.value);
            switch (req.body.boost_id) {
                case 'boost_full_available_taps':
                    // all quota tu full the energy is runout
                    if (earning.recharge_earning_energy <= 0) {
                        return res.json({
                            status: false,
                            message: "Your quota is empty",
                            error: null,
                            data: null
                        });
                    }

                    // update the energy
                    let currentBoostMaxTap = boostMaxTap.find(b => b.level === energyLevel);
                    await prisma.playerEarning.update({
                        where: {
                            player_id: playerId
                        },
                        data: {
                            tap_earning_energy: playerLevel.tap_earning_energy + currentBoostMaxTap.addition_value,
                            tap_earning_energy_available: playerLevel.tap_earning_energy + currentBoostMaxTap.addition_value,
                            recharge_earning_energy: earning.recharge_earning_energy - 1
                        }
                    });

                    message = "Energy recharged!";
                    break;
                case 'boost_earnings_taps':
                    let tapLevel = earning ? earning.tap_earning_level : 1;
                    let _boostEarningTap = configs.find(c => c.key === 'boost_earnings_taps');
                    let boostEarningTap = yaml.load(_boostEarningTap.value);
                    let nextBoostEarningTap = boostEarningTap.find(b => b.level === tapLevel + 1);

                    if (!nextBoostEarningTap) {
                        return res.json({
                            status: false,
                            message: "Max level reached",
                            error: null,
                            data: null
                        });
                    }

                    if (earning.coins_balance < nextBoostEarningTap.upgrade_price) {
                        return res.json({
                            status: false,
                            message: "Insufficient balance",
                            error: null,
                            data: null
                        });
                    }

                    // update earning: tap_earning_level, coins_total, coins_balance, passive_per_hour, 

                    // point history

                    // passive earning history

                    message = `Boost is yours! Multitap ${nextBoostEarningTap.level} lvl`;
                    break;
                case 'boost_max_taps':
                    let nextBoostMaxTap = boostMaxTap.find(b => b.level === energyLevel + 1);

                    if (!nextBoostMaxTap) {
                        return res.json({
                            status: false,
                            message: "Max level reached",
                            error: null,
                            data: null
                        });
                    }

                    if (earning.coins_balance < nextBoostMaxTap.upgrade_price) {
                        return res.json({
                            status: false,
                            message: "Insufficient balance",
                            error: null,
                            data: null
                        });
                    }

                       // update earning: tap_earning_level, coins_total, coins_balance, passive_per_hour

                    // point history

                    // passive earning history

                    message = `Boost is yours! Energy Limit ${nextBoostMaxTap.level} lvl`;
                    break;
                default:
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