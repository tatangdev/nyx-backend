const router = require('express').Router();
const media = require('./media.router');
const admin = require('./admin.router');
const player = require('./player.router');

router.use('/', media);
router.use('/admin', admin);
router.use('/', player);

module.exports = router;