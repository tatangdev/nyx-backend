const router = require('express').Router();
const { validate, isPlayer } = require('../../middlewares/auth.middleware');
const authController = require('../../controllers/v1/external/auth.controller');
const playerAuthController = require('../../controllers/v1/player/auth.controller');

router.post('/login', authController.login);
router.post('/otp/verify', authController.verifyOTP);
router.get('/verify', validate, isPlayer, playerAuthController.whoami);

module.exports = router;