import { ObjectId } from 'mongodb'

import { logger } from '../../services/logger.service.js'
import { makeId } from '../../services/util.service.js'
import { dbService } from '../../services/db.service.js'
import { asyncLocalStorage } from '../../services/als.service.js'

const PAGE_SIZE = 3

export const gigService = {
    remove,
    query,
    getById,
    add,
    update,
    addGigMsg,
    removeGigMsg,
}

async function query(filterBy = {}) {
    try {
        const criteria = _buildCriteria(filterBy)
        const sort = _buildSort(filterBy)

        const collection = await dbService.getCollection('gig')

        const pipeline = [
            { $match: criteria },
            {
                $lookup: {
                    from: 'review',
                    let: { gigIdStr: { $toString: '$_id' } },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$gigId', '$$gigIdStr'] }
                            }
                        }
                    ],
                    as: 'reviews'
                }
            },
            {
                $addFields: {
                    reviewCount: { $size: '$reviews' }
                }
            },
            {
                $project: {
                    reviews: 0
                }
            }
        ]

        if (filterBy.sortBy && filterBy.sortBy !== 'recommended' && Object.keys(sort).length) {
            pipeline.push({ $sort: sort })
        }

        let gigs = await collection.aggregate(pipeline).toArray()

        if (filterBy.sortBy === 'recommended') {
            gigs.sort((a, b) => {
                const aScore =
                    (a.owner?.rate || 0) * 200 +
                    (a.owner?.level || 0) * 100 +
                    (a.reviewCount || 0) * 0.1

                const bScore =
                    (b.owner?.rate || 0) * 200 +
                    (b.owner?.level || 0) * 100 +
                    (b.reviewCount || 0) * 0.1

                return bScore - aScore
            })
        }

        return gigs
    } catch (err) {
        logger.error('cannot aggregate gigs with reviews', err)
        throw err
    }
}

async function getById(gigId) {
    try {
        const criteria = { _id: ObjectId.createFromHexString(gigId) }

        const collection = await dbService.getCollection('gig')
        const gig = await collection.findOne(criteria)

        gig.createdAt = gig._id.getTimestamp()
        return gig
    } catch (err) {
        logger.error(`while finding gig ${gigId}`, err)
        throw err
    }
}

async function remove(gigId) {
    // const { loggedinUser } = asyncLocalStorage.getStore()
    // const { _id: ownerId, isAdmin } = loggedinUser

    try {
        const criteria = {
            _id: ObjectId.createFromHexString(gigId),
        }

        if (!isAdmin) criteria['owner._id'] = ownerId

        const collection = await dbService.getCollection('gig')
        const res = await collection.deleteOne(criteria)

        if (res.deletedCount === 0) throw ('Not your gig')
        return gigId
    } catch (err) {
        logger.error(`cannot remove gig ${gigId}`, err)
        throw err
    }
}

async function add(gig) {
    try {
        const collection = await dbService.getCollection('gig')
        await collection.insertOne(gig)

        return gig
    } catch (err) {
        logger.error('cannot insert gig', err)
        throw err
    }
}

async function update(gig) {
    const gigToSave = { ...gig }
    delete gigToSave._id

    try {
        const criteria = { _id: ObjectId.createFromHexString(gig._id) }
        const collection = await dbService.getCollection('gig')
        await collection.updateOne(criteria, { $set: gigToSave })
        return { ...gig, ...gigToSave }
    } catch (err) {
        logger.error(`cannot update gig ${gig._id}`, err)
        throw err
    }
}

async function addGigMsg(gigId, msg) {
    try {
        const criteria = { _id: ObjectId.createFromHexString(gigId) }
        msg.id = makeId()

        const collection = await dbService.getCollection('gig')
        await collection.updateOne(criteria, { $push: { msgs: msg } })

        return msg
    } catch (err) {
        logger.error(`cannot add gig msg ${gigId}`, err)
        throw err
    }
}

async function removeGigMsg(gigId, msgId) {
    try {
        const criteria = { _id: ObjectId.createFromHexString(gigId) }

        const collection = await dbService.getCollection('gig')
        await collection.updateOne(criteria, { $pull: { msgs: { id: msgId } } })

        return msgId
    } catch (err) {
        logger.error(`cannot remove gig msg ${gigId}`, err)
        throw err
    }
}

function _buildCriteria(filterBy = {}) {
    const {
        txt = '',
        category = '',
        tags = [],
        minPrice = '',
        maxPrice = '',
        daysToMake = '',
        userId = '',
        sortBy = ''
    } = filterBy

    const criteria = {}

    if (category) {
        criteria.$or = [
            { category: category },
            { tags: category }
        ]
    }
    const tagArr = Array.isArray(tags) ? tags : (tags ? [tags] : [])
    if (tagArr.length) {
        criteria.tags = { $in: tagArr }
    }

    if (minPrice || maxPrice) {
        criteria.price = {}
        if (minPrice) criteria.price.$gte = +minPrice
        if (maxPrice) criteria.price.$lte = +maxPrice
    }

    if (daysToMake) {
        criteria.daysToMake = { $lte: +daysToMake }
    }

    if (userId) {
        criteria['owner._id'] = userId
    }

    if (txt) {
        const regex = { $regex: txt, $options: 'i' }
        // criteria.$or = [
        const textOr = [
            { title: regex },
            { description: regex },
            { category: regex },
            { tags: regex }
        ]
        criteria.$or = criteria.$or ? criteria.$or.concat(textOr) : textOr
    }

    return criteria
}


// function _buildSort(filterBy) {
//     if (!filterBy.sortField) return {}
//     return { [filterBy.sortField]: filterBy.sortDir }
// }

// function _buildSort({ sortBy }) {
//     return sortBy ? { [sortBy]: 1 } : undefined;  // 1 == ascending
//   }

function _buildSort({ sortBy }) {
    switch (sortBy) {
        case 'best-selling':
            return { orders: -1 }

        case 'newest-arrivals':
            return { createdAt: -1 }

        case 'fastest-delivery':
            return { daysToMake: 1 }

        case 'price-low-to-high':
            return { price: 1 }

        case 'price-high-to-low':
            return { price: -1 }

        default:
            return {}
    }
}