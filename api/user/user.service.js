import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import { reviewService } from '../review/review.service.js'
import { ObjectId } from 'mongodb'

export const userService = {
    add,
    getById,
    update,
    remove,
    query,
    getByUsername,
    getPublicInfoById,
}

async function query(filterBy = {}) {
    const criteria = _buildCriteria(filterBy)
    try {
        const collection = await dbService.getCollection('user')
        var users = await collection.find(criteria).toArray()
        users = users.map(user => {
            delete user.password
            user.createdAt = user._id.getTimestamp()
            // Returning fake fresh data
            // user.createdAt = Date.now() - (1000 * 60 * 60 * 24 * 3) // 3 days ago
            return user
        })
        return users
    } catch (err) {
        logger.error('cannot find users', err)
        throw err
    }
}

async function getById(userId) {
    try {
        var criteria = { _id: ObjectId.createFromHexString(userId) }

        const collection = await dbService.getCollection('user')
        const user = await collection.findOne(criteria)
        delete user.password

        criteria = { byUserId: userId }

        user.givenReviews = await reviewService.query(criteria)
        user.givenReviews = user.givenReviews.map(review => {
            delete review.byUser
            return review
        })

        return user
    } catch (err) {
        logger.error(`while finding user by id: ${userId}`, err)
        throw err
    }
}

async function getByUsername(identifier) {
    try {
        const collection = await dbService.getCollection('user')
        
        const searchPatterns = [
            { username: { $regex: new RegExp(`^${identifier}$`, 'i') } },
        ]
        
        if (!identifier.includes('@')) {
            searchPatterns.push(
                { username: { $regex: new RegExp(`^${identifier}@`, 'i') } }
            )
        }
        
        if (identifier.includes('@')) {
            const usernameBeforeAt = identifier.split('@')[0]
            searchPatterns.push(
                { username: { $regex: new RegExp(`^${usernameBeforeAt}$`, 'i') } }
            )
        }
        
        const user = await collection.findOne({ 
            $or: searchPatterns
        })
        
        return user
    } catch (err) {
        logger.error(`while finding user by username: ${identifier}`, err)
        throw err
    }
}

async function remove(userId) {
    try {
        const criteria = { _id: ObjectId.createFromHexString(userId) }

        const collection = await dbService.getCollection('user')
        await collection.deleteOne(criteria)
    } catch (err) {
        logger.error(`cannot remove user ${userId}`, err)
        throw err
    }
}

async function update(user) {
    try {
        const userToSave = {
            _id: ObjectId.createFromHexString(user._id),
            fullname: user.fullname,
        }
        const collection = await dbService.getCollection('user')
        await collection.updateOne({ _id: userToSave._id }, { $set: userToSave })
        return userToSave
    } catch (err) {
        logger.error(`cannot update user ${user._id}`, err)
        throw err
    }
}

async function add(user) {
    try {
        const userToAdd = {
            username: user.username,
            password: user.password,
            fullname: user.fullname,
            imgUrl: user.imgUrl
        }
        const collection = await dbService.getCollection('user')
        await collection.insertOne(userToAdd)
        return userToAdd
    } catch (err) {
        logger.error('cannot add user', err)
        throw err
    }
}

async function getPublicInfoById(userId) {
    try {
        const collection = await dbService.getCollection('user')
        const user = await collection.findOne({ _id: ObjectId.createFromHexString(userId) })
        if (!user) throw new Error('User not found')

        return {
            _id: user._id,
            fullname: user.fullname,
            imgUrl: user.imgUrl,
        }
    } catch (err) {
        logger.error(`cannot get public info for user ${userId}`, err)
        throw err
    }
}

function _buildCriteria(filterBy) {
    const criteria = {}
    if (filterBy.txt) {
        const txtCriteria = { $regex: filterBy.txt, $options: 'i' }
        criteria.$or = [
            {
                username: txtCriteria,
            },
            {
                fullname: txtCriteria,
            },
        ]
    }
    if (filterBy.minBalance) {
        criteria.score = { $gte: filterBy.minBalance }
    }
    return criteria
}