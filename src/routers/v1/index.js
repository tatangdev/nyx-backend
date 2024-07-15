const router = require('express').Router();
const media = require('./media.router');

router.use('/', media);

module.exports = router;