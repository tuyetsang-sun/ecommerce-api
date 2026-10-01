import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';

import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

export async function register(req, res) {
    let body = req.body;

    if (body === null || body === undefined) {
        body = {};
    }

    const { username, fullname, password } = body;

    // Kiểm tra kiểu dữ liệu trước khi xử lý chuỗi.
    if (
        typeof username !== 'string' ||
        typeof fullname !== 'string' ||
        typeof password !== 'string'
    ) {
        return res.status(400).json({
            message: 'username, fullname và password phải là chuỗi',
        });
    }

    const cleanUsername = username.trim();
    const cleanFullname = fullname.trim();

    if (!/^[a-zA-Z0-9_.-]{3,50}$/.test(cleanUsername)) {
        return res.status(400).json({
            message: 'Tên đăng nhập dài 3–50 ký tự, chỉ gồm chữ không dấu, số, dấu chấm, gạch dưới hoặc gạch ngang',
        });
    }

    if (cleanFullname.length < 2 || cleanFullname.length > 100) {
        return res.status(400).json({
            message: 'Họ tên phải dài từ 2 đến 100 ký tự',
        });
    }

    if (
        password.length < 8 ||
        password.trim().length === 0 ||
        bcrypt.truncates(password)
    ) {
        return res.status(400).json({
            message: 'Mật khẩu phải có ít nhất 8 ký tự, không chỉ gồm khoảng trắng và không vượt quá 72 byte',
        });
    }

    // Server tự chọn quyền và membership mặc định.
    const [role, membership] = await Promise.all([
        prisma.role.findUnique({
            where: { rolename: 'normal' },
        }),
        prisma.memberShip.findUnique({
            where: { mname: 'normal' },
        }),
    ]);

    if (!role || !membership) {
        return res.status(503).json({
            message: 'Hệ thống chưa sẵn sàng tạo tài khoản',
        });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
        data: {
            username: cleanUsername,
            fullname: cleanFullname,
            password: passwordHash,
            roleid: role.roleid,
            mid: membership.mid,
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

    return res.status(201).json({
        message: 'Đăng ký thành công',
        user,
    });
}

export async function login(req, res) {
    let body = req.body;

    if (body === null || body === undefined) {
        body = {};
    }

    const { username, password } = body;

    if (
        typeof username !== 'string' ||
        typeof password !== 'string'
    ) {
        return res.status(400).json({
            message: 'username và password phải là chuỗi',
        });
    }

    const cleanUsername = username.trim();

    if (!/^[a-zA-Z0-9_.-]{3,50}$/.test(cleanUsername) ||
        password.length === 0 ||
        bcrypt.truncates(password)
    ) {
        return res.status(400).json({
            message: 'Tên đăng nhập hoặc định dạng mật khẩu không hợp lệ',
        });
    }

    const user = await prisma.user.findUnique({
        where: {
            username: cleanUsername,
        },
        select: {
            uid: true,
            username: true,
            fullname: true,
            password: true,
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

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({
            message: 'Tên đăng nhập hoặc mật khẩu không đúng',
        });
    }

    const accessToken = jwt.sign({},
        env.JWT_SECRET, {
            algorithm: 'HS256',
            subject: String(user.uid),
            expiresIn: env.JWT_EXPIRES_IN_SECONDS,
            issuer: 'ecommerce-api',
            audience: 'ecommerce-client',
        }
    );

    res.set('Cache-Control', 'no-store');

    return res.status(200).json({
        message: 'Đăng nhập thành công',
        accessToken,
        tokenType: 'Bearer',
        expiresIn: env.JWT_EXPIRES_IN_SECONDS,
        user: {
            uid: user.uid,
            username: user.username,
            fullname: user.fullname,
            role: user.role,
            membership: user.membership,
        },
    });
}

export function getMe(req, res) {
    res.set('Cache-Control', 'no-store');

    return res.status(200).json({
        user: req.user,
    });
}