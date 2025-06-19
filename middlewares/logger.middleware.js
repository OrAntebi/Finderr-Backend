import { logger } from '../services/logger.service.js'

export async function log(req, res, next) {
    const { baseUrl, method, body, params } = req
	logger.info(baseUrl, method, body, params)
	next()
}
