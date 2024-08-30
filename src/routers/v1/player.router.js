const router = require('express').Router();
const auth = require('../../controllers/v1/player/auth.controller');
const { validate, isAdmin, isPlayer } = require('../../middlewares/auth.middleware');
const { image } = require('../../libs/multer');
const media = require('../../controllers/v1/media.controller');
const card = require('../../controllers/v1/player/card.controller');
const point = require('../../controllers/v1/player/point.controller');
const task = require('../../controllers/v1/player/task.controller');
const rank = require('../../controllers/v1/player/rank.controller');

// auth
router.post('/auth/login', auth.login);
router.get('/auth/whoami', validate, isPlayer, auth.whoami);

// media
router.post('/media/images', validate, isAdmin, image.single('image'), media.imageKitUpload);
router.get('/media/images', validate, isAdmin, media.imageKitList);

// cards
router.get('/cards/combo', validate, isPlayer, card.combo);
router.post('/cards/combo', validate, isPlayer, card.submitCombo);
router.get('/cards-v2', validate, isPlayer, card.listV2);
router.post('/card-upgrade', validate, isPlayer, card.upgrade);

// point
router.get('/sync', validate, isPlayer, point.sync);
router.post('/tap', validate, isPlayer, point.tapUpdate);
router.get('/rank', validate, isPlayer, rank.index);

// task
router.get('/tasks', validate, isPlayer, task.index);
router.post('/check-task', validate, isPlayer, task.check);

// referral
router.get('/referral-stats', validate, isPlayer, point.referralStats);

// router.post('/sync', validate, isPlayer, point.update);

module.exports = router;