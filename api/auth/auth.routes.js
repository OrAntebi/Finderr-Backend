import express from 'express'

import { login, signup, logout, loginWithGoogle, quickLogin } from './auth.controller.js'

const router = express.Router()

router.post('/login', login)
router.post('/signup', signup)
router.post('/logout', logout)
router.post('/quick-login', quickLogin)
router.post('/google-login', loginWithGoogle)

export const authRoutes = router