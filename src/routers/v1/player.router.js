const router = require('express').Router();
const auth = require('../../controllers/v1/player/auth.controller');
const { validate, isAdmin, isSuperadmin } = require('../../middlewares/auth.middleware');
const { image } = require('../../libs/multer');
const media = require('../../controllers/v1/media.controller');

// auth
router.post('/auth/login', auth.login);
router.get('/auth/whoami', validate, auth.whoami);

// media
router.post('/media/images', validate, isAdmin, image.single('image'), media.imageKitUpload);
router.get('/media/images', validate, isAdmin, media.imageKitList);

module.exports = router;