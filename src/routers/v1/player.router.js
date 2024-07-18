const router = require('express').Router();
const auth = require('../../controllers/v1/player/auth.controller');
const { validate } = require('../../middlewares/auth.middleware');

// auth
router.post('/login', auth.login);
router.get('/whoami', validate, auth.whoami);

module.exports = router;