const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });
yaml = require('js-yaml');

module.exports = {
    index: async (req, res, next) => {
        try {
            let configs = await prisma.config.findMany({
                where: {
                    active: true,
                    key: {
                        in: ['boost_earnings_taps', 'boost_max_taps']
                    }
                }
            });

            let boosts = [];

            // full energy
            boosts.push({
                id: 'boost_full_available_taps',
                name: 'Full Energy',
                quota: 6,
                used: 0,
            });

            // tap earning boost
            let _boostEarningTap = configs.find(c => c.key === 'boost_earnings_taps');
            let boostEarningTap = yaml.load(_boostEarningTap.value);
            boosts.push({
                id: 'boost_earnings_taps',
                name: 'Multitap',
                level: 0,
                max_level: 5,
                price: 0,

            });

            // tap energy boost
            let _boostMaxTap = configs.find(c => c.key === 'boost_max_taps');
            let boostMaxTap = yaml.load(_boostMaxTap.value);
            boosts.push({
                id: 'boost_max_taps',
                name: 'Energy Limit',
                level: 0,
                max_level: 5,
                price: 0,
                tap_energy_inc
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

        } catch (error) {
            next(error);
        }
    },
};