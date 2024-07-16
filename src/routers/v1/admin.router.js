const router = require('express').Router();
const admin = require('../../controllers/v1/admin.controller');
const user = require('../../controllers/v1/admin/user.controller');
const coinCategory = require('../../controllers/v1/admin/coinCategory.controller');
const auth = require('../../middlewares/auth.middleware');

// auth
router.post('/login', admin.login);
router.get('/whoami', auth.validate, admin.whoami);

// users
router.post('/users', auth.validate, auth.isAdmin, user.create);
router.get('/users', auth.validate, user.index);
router.get('/users/:id', auth.validate, user.show);
router.put('/users/:id', auth.validate, auth.isAdmin, user.update);

// coin categories
router.post('/coin-categories', auth.validate, coinCategory.create);
router.get('/coin-categories', auth.validate, coinCategory.index);
router.get('/coin-categories/:id', auth.validate, coinCategory.show);
router.put('/coin-categories/:id', auth.validate, coinCategory.update);

module.exports = router;