import Cryptr from 'cryptr'
import bcrypt from 'bcrypt'
import { OAuth2Client } from 'google-auth-library'

import { userService } from '../user/user.service.js'
import { logger } from '../../services/logger.service.js'

const cryptr = new Cryptr(process.env.SECRET || 'Secret-Puk-1234')
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export const authService = {
	signup,
	login,
	quickLogin,
	loginWithGoogle,
	getLoginToken,
	validateToken,
}

async function login(username, password) {
	logger.debug(`auth.service - login with username: ${username}`)

	const user = await userService.getByUsername(username)
	if (!user) return Promise.reject('Invalid username or password')

	if (!user.password || typeof user.password !== 'string') {
		return Promise.reject('This account was created with Google or has no password set. Please use social login or reset your password.')
	}

	const isPasswordMatch = await bcrypt.compare(password, user.password)
	if (!isPasswordMatch) {
		return Promise.reject('Invalid username or password')
	}

	delete user.password
	user._id = user._id.toString()
	return user
}

async function quickLogin(username) {
	logger.debug(`auth.service - quick login with username: ${username}`)

	const user = await userService.getByUsername(username)
	if (!user) return Promise.reject('User not found')

	if (!user.quickLogin) {
		return Promise.reject('User is not authorized for quick login')
	}

	delete user.password
	user._id = user._id.toString()
	return user
}

async function signup({ username, password, fullname, imgUrl }) {
	const saltRounds = 10

	logger.debug(`auth.service - signup with username: ${username}, fullname: ${fullname}`)
	if (!username || !password || !fullname) return Promise.reject('Missing required signup information')

	const userExist = await userService.getByUsername(username)
	if (userExist) {
		const errorMsg = username.includes('@') 
			? 'A user with this email already exists' 
			: 'A user with this username already exists'
		return Promise.reject(errorMsg)
	}

	const hash = await bcrypt.hash(password, saltRounds)
	return userService.add({ username, password: hash, fullname, imgUrl })
}

async function loginWithGoogle(credential) {

	if (!process.env.GOOGLE_CLIENT_ID) {
		logger.error('GOOGLE_CLIENT_ID environment variable is not set')
		return Promise.reject('Google authentication is not configured properly')
	}

	try {
		const ticket = await client.verifyIdToken({
			idToken: credential,
			audience: process.env.GOOGLE_CLIENT_ID,
		})

		const payload = ticket.getPayload()
		const { email, name, picture } = payload

		if (!email) {
			return Promise.reject('No email found in Google account')
		}

		let user = await userService.getByUsername(email)

		if (!user) {
			user = await userService.add({
				username: email,
				fullname: name,
				imgUrl: picture
			})
		}

		delete user.password
		user._id = user._id.toString()
		return user
	} catch (error) {
		logger.error('Google login verification failed:', error)
		return Promise.reject('Can\'t continue with Google - Invalid token or configuration error')
	}
}

function getLoginToken(user) {
	const userInfo = {
		_id: user._id,
		fullname: user.fullname,
		imgUrl: user.imgUrl,
		username: user.username,
	}
	return cryptr.encrypt(JSON.stringify(userInfo))
}

function validateToken(loginToken) {
	try {
		const json = cryptr.decrypt(loginToken)
		const loggedinUser = JSON.parse(json)
		return loggedinUser
	} catch (err) {
		console.log('Invalid login token')
	}
	return null
}
