import 'dotenv/config';

const port = Number(process.env.PORT);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
        'PORT trong file .env phải là số nguyên từ 1 đến 65535'
    );
}

const jwtSecret = process.env.JWT_SECRET;

if (
    typeof jwtSecret !== 'string' ||
    !/^[a-fA-F0-9]{64}$/.test(jwtSecret)
) {
    throw new Error(
        'JWT_SECRET trong .env phải là chuỗi gồm 64 ký tự hex'
    );
}

const jwtExpiresInSeconds = Number(
    process.env.JWT_EXPIRES_IN_SECONDS
);

if (!Number.isSafeInteger(jwtExpiresInSeconds) ||
    jwtExpiresInSeconds < 1
) {
    throw new Error(
        'JWT_EXPIRES_IN_SECONDS trong .env phải là số nguyên dương'
    );
}

export const env = {
    PORT: port,
    NODE_ENV: process.env.NODE_ENV || 'development',
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN_SECONDS: jwtExpiresInSeconds,
};