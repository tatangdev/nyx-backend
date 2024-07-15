const router = require('express').Router();
const { imageStorage } = require('../../libs/multer');
const media = require('../../controllers/v1/media.controllers');

router.post('/images', imageStorage.single('image'), media.uploadImage);

module.exports = router;