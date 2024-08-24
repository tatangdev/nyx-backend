import { Router } from 'express';
// import * as auth from '../../controllers/v1/player/auth.controller';
// import { validate, isAdmin, isPlayer } from '../../middlewares/auth.middleware';
// import { image } from '../../libs/multer';
// import * as media from '../../controllers/v1/media.controller';
// import * as card from '../../controllers/v1/player/card.controller';
// import * as point from '../../controllers/v1/player/point.controller';
// import * as task from '../../controllers/v1/player/task.controller';

const router = Router();

// auth
// router.post('/auth/login', auth.login);
// router.get('/auth/whoami', validate, isPlayer, auth.whoami);

// media
// router.post('/media/images', validate, isAdmin, image.single('image'), media.imageKitUpload);
// router.get('/media/images', validate, isAdmin, media.imageKitList);

// cards
// router.get('/cards/combo', validate, isPlayer, card.combo);
// router.post('/cards/combo', validate, isPlayer, card.submitCombo);
// router.get('/cards-v2', validate, isPlayer, card.listV2);
// router.post('/card-upgrade', validate, isPlayer, card.upgrade);

// point
// router.get('/sync', validate, isPlayer, point.sync);
// router.post('/tap', validate, isPlayer, point.tapUpdate);

// task
// router.get('/tasks', validate, isPlayer, task.index);
// router.post('/check-task', validate, isPlayer, task.check);

// router.post('/sync', validate, isPlayer, point.update);

export default router;
