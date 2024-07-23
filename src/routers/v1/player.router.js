const router = require('express').Router();
const auth = require('../../controllers/v1/player/auth.controller');
const { validate, isAdmin, isPlayer } = require('../../middlewares/auth.middleware');
const { image } = require('../../libs/multer');
const media = require('../../controllers/v1/media.controller');
const card = require('../../controllers/v1/player/card.controller');

// auth
router.post('/auth/login', auth.login);
router.get('/auth/whoami', validate, isPlayer, auth.whoami);

// media
router.post('/media/images', validate, isAdmin, image.single('image'), media.imageKitUpload);
router.get('/media/images', validate, isAdmin, media.imageKitList);

// cards
router.get('/cards', validate, isPlayer, card.list);
router.post('/card-upgrade', validate, isPlayer, card.upgrade);

// home
router.get('/', validate, isPlayer, auth.home);

module.exports = router;