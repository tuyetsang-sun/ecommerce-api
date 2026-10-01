import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';

function unauthorized(res, message) {
    res.set('WWW-Authenticate', 'Bearer');

    return res.status(401).json({
        message,
    });
}

export async function requireAuth(req, res, next) {
    const authorization = req.get('Authorization');

    if (!authorization) {
        return unauthorized(res, 'Bạn cần đăng nhập');
    }

    const parts = authorization.trim().split(/\s+/);

    if (
        parts.length !== 2 ||
        parts[0].toLowerCase() !== 'bearer'
    ) {
        return unauthorized(
            res,
            'Authorization phải có dạng Bearer <token>'
        );
    }

    const token = parts[1];
    let payload;

    try {
        payload = jwt.verify(token, env.JWT_SECRET, {
            algorithms: ['HS256'],
            issuer: 'ecommerce-api',
            audience: 'ecommerce-client',
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return unauthorized(
                res,
                'Token đã hết hạn, vui lòng đăng nhập lại'
            );
        }

        return unauthorized(res, 'Token không hợp lệ');
    }

    // Token phải có mã người dùng và thời hạn.
    if (
        typeof payload !== 'object' ||
        payload === null ||
        typeof payload.sub !== 'string' ||
        !/^[1-9]\d*$/.test(payload.sub) ||
        !Number.isInteger(payload.exp)
    ) {
        return unauthorized(res, 'Token không hợp lệ');
    }

    const uid = Number(payload.sub);

    if (!Number.isSafeInteger(uid) || uid > 2147483647) {
        return unauthorized(res, 'Token không hợp lệ');
    }

    // Chỉ chọn những trường được phép sử dụng và trả về.
    const user = await prisma.user.findUnique({
        where: {
            uid,
        },
        select: {
            uid: true,
            username: true,
            fullname: true,
            role: {
                select: {
                    rolename: true,
                },
            },
            membership: {
                select: {
                    mname: true,
                    score: true,
                },
            },
        },
    });

    if (!user) {
        return unauthorized(res, 'Tài khoản không còn tồn tại');
    }

    req.user = user;

    return next();
}