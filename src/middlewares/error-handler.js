import { HttpError } from '../utils/http-error.js';

export function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof HttpError) {
        return res.status(err.statusCode).json({
            message: err.message,
        });
    }

    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            message: 'Nội dung JSON không hợp lệ',
        });
    }

    if (err.type === 'entity.too.large') {
        return res.status(413).json({
            message: 'Dữ liệu gửi lên quá lớn',
        });
    }

    if (err.code === 'P2002') {
        return res.status(409).json({
            message: 'Dữ liệu đã tồn tại',
        });
    }

    let errorLabel = err.code;

    if (errorLabel === null || errorLabel === undefined) {
        errorLabel = err.name;
    }

    console.error('Lỗi xử lý yêu cầu:', errorLabel);

    return res.status(500).json({
        message: 'Lỗi máy chủ',
    });
}