const router = require('express').Router();
const admin = require('../../controllers/v1/admin.controller');
const auth = require('../../middlewares/auth.middleware');

router.post('/login', admin.login);
router.get('/whoami', auth.validate, admin.whoami);

// router.post('/register', admin.register);

module.exports = router;