import express from 'express'

import { login, signup, logout, loginWithGoogle, loginWithFacebook } from './auth.controller.js'

const router = express.Router()

router.post('/login', login)
router.post('/signup', signup)
router.post('/logout', logout)
router.post('/google-login', loginWithGoogle)
router.post('/facebook-login', loginWithFacebook)

export const authRoutes = router