import { ObjectId } from 'mongodb'

import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import { makeId } from '../../services/util.service.js'
import { asyncLocalStorage } from '../../services/als.service.js'
import { socketService } from '../../services/socket.service.js'

export const orderService = {
    query,
    getById,
    add,
    update,
}

async function query(filterBy = {}) {
    try {
        const store = asyncLocalStorage.getStore()
        const loggedinUser = store?.loggedinUser
        if (!loggedinUser) throw new Error('User not logged in')

        let criteria = {}
        
        if (filterBy.userId && filterBy.role) {
            if (filterBy.role === 'seller') {
                criteria = { 'seller._id': filterBy.userId }
            } else if (filterBy.role === 'buyer') {
                criteria = { 'buyer._id': filterBy.userId }
            }
        } else {
            criteria = {
                $or: [
                    { 'buyer._id': loggedinUser._id },
                    { 'seller._id': loggedinUser._id }
                ]
            }
        }

        const collection = await dbService.getCollection('order')
        const orders = await collection.find(criteria).toArray()

        return orders
    } catch (err) {
        logger.error('Cannot fetch orders', err)
        throw err
    }
}

async function getById(orderId) {
    try {
        const criteria = { _id: ObjectId.createFromHexString(orderId) }

        const collection = await dbService.getCollection('order')
        const order = await collection.findOne(criteria)

        return order
    } catch (err) {
        logger.error(`while finding order ${orderId}`, err)
        throw err
    }
}

async function add(order) {
    try {
        const collection = await dbService.getCollection('order')
        order.createdAt = Date.now()
        await collection.insertOne(order)

        const msg = `New order received from ${order.buyer.fullname}`
        
        try {
            await socketService.emitToUser({
                type: 'order-received',
                data: {
                    message: msg,
                    order: order
                },
                userId: order.seller._id
            })
        } catch (err) {
            logger.error('Failed to emit socket event:', err)
        }

        return order
    } catch (err) {
        logger.error('cannot insert order', err)
        throw err
    }
}

async function update(order) {
    const orderToSave = { ...order }
    delete orderToSave._id

    try {
        const criteria = { _id: ObjectId.createFromHexString(order._id) }
        const collection = await dbService.getCollection('order')
        await collection.updateOne(criteria, { $set: orderToSave })
        return { ...order, ...orderToSave }
    } catch (err) {
        logger.error(`cannot update order ${order._id}`, err)
        throw err
    }
}