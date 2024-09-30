const router = require('express').Router();
const { validate, isPlayer } = require('../../middlewares/auth.middleware');
const authController = require('../../controllers/v1/external/auth.controller');

router.post('/login', authController.login);
router.post('/otp/verify', authController.verifyOTP);
router.get('/verify', validate, isPlayer, authController.whoami);
router.get('/referrals', validate, isPlayer, authController.referrals);

module.exports = router;