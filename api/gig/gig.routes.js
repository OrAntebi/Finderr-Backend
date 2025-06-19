import express from 'express'

import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import { log } from '../../middlewares/logger.middleware.js'

import { getGigs, getGigById, addGig, updateGig, removeGig, addGigMsg, removeGigMsg } from './gig.controller.js'

const router = express.Router()

// We can add a middleware for the entire router:
// router.use(requireAuth)

// router.get('/', log, getGigs)
// router.get('/:id', log, getGigById)
// router.post('/', log, requireAuth, addGig)
// router.put('/:id', requireAuth, updateGig)
// router.delete('/:id', requireAuth, removeGig)

router.get('/', getGigs)
router.get('/:id', getGigById)
router.post('/', addGig)
router.put('/:id', updateGig)
router.delete('/:id', removeGig)

// router.delete('/:id', requireAuth, requireAdmin, removeGig)

router.post('/:id/msg', requireAuth, addGigMsg)
router.delete('/:id/msg/:msgId', requireAuth, removeGigMsg)

export const gigRoutes = router