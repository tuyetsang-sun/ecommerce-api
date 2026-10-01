import express from 'express';
import { prisma } from './config/prisma.js';

import authRoutes from './modules/auth/auth.routes.js';
import { errorHandler } from './middlewares/error-handler.js';

import orderRoutes from './modules/orders/order.routes.js';

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).json({
        message: 'E-commerce API is running',
    });
});

app.get('/health', async(req, res) => {
    res.set('Cache-Control', 'no-store');

    try {
        await prisma.$queryRaw `SELECT 1`;

        return res.status(200).json({
            status: 'ok',
            database: 'up',
        });
    } catch {
        return res.status(503).json({
            status: 'error',
            database: 'down',
        });
    }
});

app.use('/api/auth', authRoutes);

app.use('/api/orders', orderRoutes);

app.use((req, res) => {
    res.status(404).json({
        message: 'Endpoint không tồn tại',
    });
});

app.use(errorHandler);

export default app;