import { env } from './config/env.js';
import app from './app.js';

app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`E-commerce API đang chạy tại http://localhost:${env.PORT}`);
});