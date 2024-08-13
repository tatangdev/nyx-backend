const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });

function buildTree(data, refereeId = null) {
    return data
        .filter(user => user.referee_id === refereeId)
        .map(user => ({
            id: user.id,
            username: user.username,
            name: `${user.first_name} ${user.last_name}`,
            level: 1, // todo: get level:
            referral: buildTree(data, user.id)
        }));
}

// function buildTree(data, refereeId) {
//     return data
//         .filter(user => user.referee_id === refereeId)
//         .map(user => ({
//             username: user.username,
//             referral: buildTree(data, user.id)
//         }));
// }

// function buildFullNetwork(data) {
//     return data.map(user => ({
//         username: user.username,
//         referral: buildTree(data, user.id)
//     }));
// }

module.exports = {
    network: async (req, res, next) => {
        try {
            let users = await prisma.player.findMany();

            return res.status(200).json({
                status: true,
                // message: "User created",
                error: null,
                data: [
                    {
                        id: 0,
                        username: "chipmunkkombat",
                        name: "Chipmunk Kombat",
                        level: 0, // todo: get level
                        referral: buildTree(users)
                    }
                ]
            });
        } catch (error) {
            next(error);
        }
    }
};