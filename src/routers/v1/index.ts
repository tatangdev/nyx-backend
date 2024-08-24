import { Router } from 'express';
import admin from './admin.router';
import player from './player.router';

const router = Router();

router.use('/admin', admin);
router.use('/', player);

export default router;