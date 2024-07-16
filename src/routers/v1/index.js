const router = require('express').Router();
const media = require('./media.router');
const admin = require('./admin.router');

router.use('/', media);
router.use('/admin', admin);

module.exports = router;