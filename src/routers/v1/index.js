const router = require('express').Router();
const admin = require('./admin.router');
const player = require('./player.router');
const external = require('./external.router');

router.use('/external', external);
router.use('/admin', admin);
router.use('/', player);

module.exports = router;