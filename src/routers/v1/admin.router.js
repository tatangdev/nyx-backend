const router = require('express').Router();
const admin = require('../../controllers/v1/admin.controller');
const user = require('../../controllers/v1/admin/user.controller');
const cardCategory = require('../../controllers/v1/admin/cardCategory.controller');
const card = require('../../controllers/v1/admin/card.controller');
const auth = require('../../middlewares/auth.middleware');

// auth
router.post('/login', admin.login);
router.get('/whoami', auth.validate, admin.whoami);

// users
router.post('/users', auth.validate, auth.isAdmin, user.create);
router.get('/users', auth.validate, user.index);
router.get('/users/:id', auth.validate, user.show);
router.put('/users/:id', auth.validate, auth.isAdmin, user.update);

// card categories
router.post('/card-categories', auth.validate, cardCategory.create);
router.get('/card-categories', auth.validate, cardCategory.index);
router.get('/card-categories/:id', auth.validate, cardCategory.show);
router.put('/card-categories/:id', auth.validate, cardCategory.update);

// cards
router.post('/cards', auth.validate, card.create);
router.get('/cards', auth.validate, card.index);
router.get('/cards/:id', auth.validate, card.show);
router.put('/cards/:id', auth.validate, card.update);

module.exports = router;