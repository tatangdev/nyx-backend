const router = require('express').Router();
const admin = require('../../controllers/v1/admin.controller');
const user = require('../../controllers/v1/admin/user.controller');
const cardCategory = require('../../controllers/v1/admin/cardCategory.controller');
const level = require('../../controllers/v1/admin/level.controller');
const card = require('../../controllers/v1/admin/card.controller');
const dashboard = require('../../controllers/v1/admin/dashboard.controller');
const broadcast = require('../../controllers/v1/admin/broadcast.controller');
const player = require('../../controllers/v1/admin/player.controller');
const history = require('../../controllers/v1/admin/history.controller');
const task = require('../../controllers/v1/admin/task.controller');
const combo = require('../../controllers/v1/admin/combo.controller');
const { validate, isAdmin, isSuperadmin } = require('../../middlewares/auth.middleware');
const { sheet } = require('../../libs/multer');

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
router.post('/cards/sheet', sheet.single('file'), card.sheet);
// router.post('/cards/sheet', validate, isAdmin, sheet.single('file'), card.sheet);

// tasks
router.post('/tasks', validate, isAdmin, task.create);
router.get('/tasks', validate, isAdmin, task.index);
router.get('/tasks/:id', validate, isAdmin, task.show);
router.put('/tasks/:id', validate, isAdmin, task.update);
router.delete('/tasks/:id', validate, isAdmin, task.destroy);

// task submissions
router.get('/task-submissions', validate, isAdmin, task.submissions);
router.put('/task-submissions/:id', validate, isAdmin, task.approval);

router.post('/levels', validate, isAdmin, level.update);
router.get('/levels', validate, isAdmin, level.get);

// dashboard
router.get('/dashboard', dashboard.index);
router.get('/players/network', player.network);
router.get('/players', player.index);
router.get('/players/:id', player.show);
router.put('/players/:id', player.update);
// router.get('/dashboard', validate, isAdmin, dashboard.index);

// logs
router.get('/logs/point', validate, isAdmin, history.points);
router.get('/logs/profit', validate, isAdmin, history.profit);
router.get('/logs/level', validate, isAdmin, history.level);

// combo
router.post('/combos', validate, isAdmin, combo.create);
router.get('/combos', validate, isAdmin, combo.index);
router.get('/combos/:id', validate, isAdmin, combo.show);
router.put('/combos/:id', validate, isAdmin, combo.update);
router.delete('/combos/:id', validate, isAdmin, combo.destroy);

// broadcast
router.post('/broadcasts', validate, isAdmin, broadcast.send);

module.exports = router;