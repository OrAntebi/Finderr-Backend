import { ObjectId } from 'mongodb'

import { asyncLocalStorage } from '../../services/als.service.js'
import { logger } from '../../services/logger.service.js'
import { dbService } from '../../services/db.service.js'

export const reviewService = { query, remove, add }

async function query(filterBy = {}) {
    try {
        const criteria = _buildCriteria(filterBy)
        const collection = await dbService.getCollection('review')

        let reviews = await collection.find(criteria).toArray()

        switch (filterBy.sortBy) {
            case 'most-recent':
                reviews.sort((a, b) => b.createdAt - a.createdAt)
                break
            case 'most-relevant':
            default:
                reviews.sort((a, b) => b.rate - a.rate)
        }

        return reviews
    } catch (err) {
        logger.error('Cannot query reviews', err)
        throw err
    }
}

async function remove(reviewId) {
    try {
        const { loggedinUser } = asyncLocalStorage.getStore()
        if (!loggedinUser) throw new Error('Not authenticated')

        const collection = await dbService.getCollection('review')

        const criteria = {
            _id: ObjectId.createFromHexString(reviewId),
            'by._id': loggedinUser._id
        }

        const { deletedCount } = await collection.deleteOne(criteria)
        return deletedCount
    } catch (err) {
        logger.error(`Cannot remove review ${reviewId}`, err)
        throw err
    }
}

async function add(review) {
    try {
        const collection = await dbService.getCollection('review')
        await collection.insertOne(review)
        return review
    } catch (err) {
        logger.error('cannot add review', err)
        throw err
    }
}

function _buildCriteria(filterBy) {
    const criteria = {}

    if (filterBy.gigId) {
        criteria.gigId = filterBy.gigId
    } else if (filterBy.userId) {
        criteria['aboutUser._id'] = filterBy.userId
    }

    return criteria
}