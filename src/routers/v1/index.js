const router = require('express').Router();
const admin = require('./admin.router');
const player = require('./player.router');

router.use('/admin', admin);
router.use('/', player);

module.exports = router;