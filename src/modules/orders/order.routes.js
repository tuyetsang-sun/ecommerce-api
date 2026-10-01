import { Router } from 'express';

import { requireAuth } from '../../middlewares/auth.middleware.js';

import {
    createOrder,
    getOrder,
    getOrderShipments,
} from './order.controller.js';

const router = Router();

router.use(requireAuth);

router.post('/', createOrder);
router.get('/:oid', getOrder);
router.get('/:oid/shipments', getOrderShipments);

export default router;