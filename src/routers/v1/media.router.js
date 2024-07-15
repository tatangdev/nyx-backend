const router = require('express').Router();
const { imageStorage, image } = require('../../libs/multer');
const media = require('../../controllers/v1/media.controllers');

router.post('/images', image.single('image'), media.uploadImage);
router.get('/images', media.listImages);

module.exports = router;