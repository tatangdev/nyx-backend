const router = require('express').Router();
const admin = require('../../controllers/v1/admin.controller');
const user = require('../../controllers/v1/admin/user.controller');
const auth = require('../../middlewares/auth.middleware');

router.post('/login', admin.login);
router.get('/whoami', auth.validate, admin.whoami);

router.post('/users', auth.validate, auth.isAdmin, user.create);
router.get('/users', auth.validate, user.index);
router.get('/users/:id', auth.validate, user.show);
router.put('/users/:id', auth.validate, auth.isAdmin, user.update);

module.exports = router;