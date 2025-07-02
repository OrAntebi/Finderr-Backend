import { logger } from '../../services/logger.service.js'
import { socketService } from '../../services/socket.service.js'
import { userService } from '../user/user.service.js'
import { reviewService } from './review.service.js'

export async function getReviews(req, res) {
    try {
        const reviews = await reviewService.query(req.query)
        res.send(reviews)
    } catch (err) {
        logger.error('Cannot get reviews', err)
        res.status(400).send({ err: 'Failed to get reviews' })
    }
}

export async function deleteReview(req, res) {
    const { id: reviewId } = req.params

    try {
        const deletedCount = await reviewService.remove(reviewId)
        if (deletedCount === 1) {
            res.send({ msg: 'Deleted successfully' })
        } else {
            res.status(400).send({ err: 'Cannot remove review' })
        }
    } catch (err) {
        logger.error('Failed to delete review', err)
        res.status(400).send({ err: 'Failed to delete review' })
    }
}

export async function addReview(req, res) {
    try {
        const { loggedinUser } = req
        const { txt, rate, aboutUserId, gigId } = req.body

        if (!txt || !aboutUserId || !gigId) {
            return res.status(400).send({ err: 'Missing required fields' })
        }

        const reviewToSave = {
            txt,
            rate,
            createdAt: Date.now(),
            gigId,
            by: {
                _id: loggedinUser._id,
                fullname: loggedinUser.fullname,
                imgUrl: loggedinUser.imgUrl,
            },
            aboutUser: await userService.getPublicInfoById(aboutUserId)
        }

        const savedReview = await reviewService.add(reviewToSave)

        res.send(savedReview)

    } catch (err) {
        logger.error('Failed to add review', err)
        res.status(500).send({ err: 'Failed to add review' })
    }
}
