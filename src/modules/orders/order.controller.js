import {
    createOrderForUser,
    findOrderForUser,
} from './order.service.js';

import { HttpError } from '../../utils/http-error.js';

function parseOrderId(value) {
    if (!/^[1-9]\d*$/.test(value)) {
        throw new HttpError(400, 'Mã đơn hàng không hợp lệ');
    }

    const oid = Number(value);

    if (!Number.isSafeInteger(oid) || oid > 2147483647) {
        throw new HttpError(400, 'Mã đơn hàng không hợp lệ');
    }

    return oid;
}

export async function createOrder(req, res) {
    let items;

    if (req.body !== null && typeof req.body === 'object') {
        items = req.body.items;
    }

    const order = await createOrderForUser(req.user.uid, items);

    return res.status(201).json({
        message: 'Đặt hàng thành công',
        order,
    });
}

export async function getOrder(req, res) {
    const oid = parseOrderId(req.params.oid);
    const order = await findOrderForUser(oid, req.user.uid);

    return res.status(200).json({ order });
}

export async function getOrderShipments(req, res) {
    const oid = parseOrderId(req.params.oid);
    const order = await findOrderForUser(oid, req.user.uid);

    return res.status(200).json({
        oid: order.oid,
        shipments: order.shipments,
    });
}