const prisma = require('../libs/prisma');
const yaml = require('js-yaml');

const moment = require('moment-timezone');
const TIMEZONE = process.env.TIMEZONE || 'Asia/Jakarta';

async function approveTasks() {
    try {
        let now = moment().tz(TIMEZONE);
        const submissions = await prisma.$queryRawUnsafe(`
            SELECT 
                task_submissions.id,
                task_submissions.player_id,
                task_submissions.submitted_at_unix,
                tasks.name AS task_name,
                tasks.reward_coins
            FROM 
                task_submissions
            INNER JOIN 
                tasks ON task_submissions.task_id = tasks.id
            WHERE 
                tasks.requires_admin_approval
                AND task_submissions.is_approved IS NULL;`);

        for (const submission of submissions) {
            if (now.unix() - submission.submitted_at_unix >= 3600) {
                const point = await prisma.playerEarning.findFirst({ where: { player_id: submission.player_id } });
                await prisma.playerEarning.update({
                    where: { id: point.id },
                    data: {
                        coins_balance: point.coins_balance + submission.reward_coins,
                        coins_total: point.coins_total + submission.reward_coins,
                        updated_at_unix: now.unix()
                    }
                });

                await prisma.pointHistory.create({
                    data: {
                        player_id: submission.player_id,
                        amount: submission.reward_coins,
                        type: 'TASK',
                        data: yaml.dump({
                            nominal: submission.reward_coins,
                            previous_balance: point.coins_balance,
                            previous_total: point.coins_total,
                            new_balance: point.coins_balance + submission.reward_coins,
                            new_total: point.coins_total + submission.reward_coins,
                            note: `Task reward for completing '${submission.task_name}'`
                        }),
                        created_at_unix: now.unix()
                    }
                });

                submission = await prisma.taskSubmission.update({
                    where: { id: submission.id },
                    data: {
                        is_approved: true,
                        approval_by: -1,
                        completed_at_unix: now.unix()
                    }
                });
            }
        }

        console.log('Approved tasks:', submissions.length);
    } catch (error) {
        console.log(error);
    }
}

async function resetFullEnergyQuota() {
    try {
        await prisma.playerEarning.updateMany({
            data: {
                recharge_earning_energy: 6
            }
        });
    } catch (error) {
        console.log(error);
    }
}

async function resetAttendance() {
    try {
        let now = moment().tz(TIMEZONE);
        let yesterday = now.add(-1, 'days').unix();
        let attendances = await prisma.attendance.updateMany({
            data: {
                days: 0,
                last_attendance: yesterday
            },
            where: {
                days: {
                    gte: 10,
                },
                last_attendance: {
                    lt: yesterday
                }
            }
        });

        console.log('Reset attendance:', attendances);
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    approveTasks,
    resetFullEnergyQuota,
    resetAttendance
};