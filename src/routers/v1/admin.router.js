const router = require('express').Router();
const admin = require('../../controllers/v1/admin.controller');
const user = require('../../controllers/v1/admin/user.controller');
const cardCategory = require('../../controllers/v1/admin/cardCategory.controller');
const card = require('../../controllers/v1/admin/card.controller');
const { validate, isAdmin, isSuperadmin } = require('../../middlewares/auth.middleware');

// auth
router.post('/login', admin.login);
router.get('/whoami', validate, isAdmin, admin.whoami);

// users
router.post('/users', validate, isSuperadmin, user.create); // only superadmin can create user
router.get('/users', validate, isAdmin, user.index);
router.get('/users/:id', validate, isAdmin, user.show);
router.put('/users/:id', validate, isSuperadmin, user.update); // only superadmin can update user

// card categories
router.post('/card-categories', validate, isAdmin, cardCategory.create);
router.get('/card-categories', validate, isAdmin, cardCategory.index);
router.get('/card-categories/:id', validate, isAdmin, cardCategory.show);
router.put('/card-categories/:id', validate, isAdmin, cardCategory.update);

// cards
router.post('/cards', validate, isAdmin, card.create);
router.get('/cards', validate, isAdmin, card.index);
router.get('/cards/:id', validate, isAdmin, card.show);
router.put('/cards/:id', validate, isAdmin, card.update);

module.exports = router;