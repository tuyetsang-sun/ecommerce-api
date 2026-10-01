import { prisma } from '../../config/prisma.js';
import { HttpError } from '../../utils/http-error.js';

const orderInclude = {
    details: {
        orderBy: { pid: 'asc' },
        include: {
            product: {
                select: {
                    pid: true,
                    pname: true,
                },
            },
        },
    },
    shipments: {
        orderBy: { shipid: 'asc' },
    },
};

function isPositiveInt(value) {
    return (
        Number.isInteger(value) &&
        value > 0 &&
        value <= 2147483647
    );
}

function validateItems(items) {
    if (!Array.isArray(items) ||
        items.length === 0 ||
        items.length > 50
    ) {
        throw new HttpError(
            400,
            'items phải là mảng có từ 1 đến 50 sản phẩm'
        );
    }

    const seen = new Set();
    const result = [];

    for (const item of items) {
        if (
            item === null ||
            typeof item !== 'object' ||
            Array.isArray(item) ||
            !isPositiveInt(item.pid) ||
            !isPositiveInt(item.qty)
        ) {
            throw new HttpError(
                400,
                'Mỗi sản phẩm phải có pid và qty là số nguyên dương'
            );
        }

        if (seen.has(item.pid)) {
            throw new HttpError(
                400,
                'Mỗi pid chỉ được xuất hiện một lần trong đơn hàng'
            );
        }

        seen.add(item.pid);

        result.push({
            pid: item.pid,
            qty: item.qty,
        });
    }

    return result.sort((a, b) => a.pid - b.pid);
}

export async function createOrderForUser(uid, items) {
    const validItems = validateItems(items);

    return prisma.$transaction(async(tx) => {
        const details = [];

        for (const item of validItems) {
            // Chỉ trừ kho nếu số lượng hiện tại đủ để mua.
            const updated = await tx.product.updateMany({
                where: {
                    pid: item.pid,
                    quantity: {
                        gte: item.qty,
                    },
                },
                data: {
                    quantity: {
                        decrement: item.qty,
                    },
                },
            });

            const product = await tx.product.findUnique({
                where: {
                    pid: item.pid,
                },
                select: {
                    pid: true,
                    pname: true,
                    price: true,
                },
            });

            if (!product) {
                throw new HttpError(
                    404,
                    `Không tìm thấy sản phẩm có pid ${item.pid}`
                );
            }

            if (updated.count !== 1) {
                throw new HttpError(
                    409,
                    `Sản phẩm ${product.pname} không đủ số lượng tồn kho`
                );
            }

            details.push({
                pid: product.pid,
                qty: item.qty,
                unit_price: product.price,
            });
        }

        return tx.order.create({
            data: {
                user: {
                    connect: { uid },
                },
                details: {
                    create: details,
                },
                shipments: {
                    create: {
                        status: 'pending',
                    },
                },
            },
            include: orderInclude,
        });
    });
}

export async function findOrderForUser(oid, uid) {
    const order = await prisma.order.findFirst({
        where: {
            oid,
            uid,
        },
        include: orderInclude,
    });

    if (!order) {
        throw new HttpError(404, 'Không tìm thấy đơn hàng');
    }

    return order;
}