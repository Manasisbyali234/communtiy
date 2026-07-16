import rateLimit from 'express-rate-limit';
import { config } from '../config/index';
import { ApiError } from '../utils/ApiError';

// Max 5 email sends per 15 minutes per IP (skipped in development)
export const emailRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.NODE_ENV === 'development' ? 100 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new ApiError(429, 'Too many email requests. Please wait before trying again.'));
  },
});

export const globalRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new ApiError(429, 'Too many requests, please try again later.'));
  },
});

