import rateLimit from 'express-rate-limit';
import { config } from '../config/index';
import { ApiError } from '../utils/ApiError';

export const globalRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new ApiError(429, 'Too many requests, please try again later.'));
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: 'Too many auth attempts, please try again in 15 minutes.',
  handler: (_req, _res, next) => {
    next(new ApiError(429, 'Too many auth attempts. Please wait 15 minutes.'));
  },
});
