import { Router } from 'express';
import authRoutes from './v1/auth.routes';
import usersRoutes from './v1/users.routes';
import postsRoutes from './v1/posts.routes';
import communitiesRoutes from './v1/communities.routes';
import storiesRoutes from './v1/stories.routes';
import messagesRoutes from './v1/messages.routes';
import eventsRoutes from './v1/events.routes';
import notificationsRoutes from './v1/notifications.routes';
import mediaRoutes from './v1/media.routes';
import searchRoutes from './v1/search.routes';
import moderationRoutes from './v1/moderation.routes';
import adminRoutes from './v1/admin.routes';
import healthRoutes from './v1/health.routes';
import metricsRoutes from './v1/metrics.routes';
import exploreRoutes from './v1/explore.routes';

const router = Router();

// Health — public (no auth required)
router.use('/health', healthRoutes);

// Metrics — admin-protected Prometheus endpoint
router.use('/metrics', metricsRoutes);

// Auth
router.use('/auth', authRoutes);

// Social
router.use('/users', usersRoutes);
router.use('/posts', postsRoutes);
router.use('/communities', communitiesRoutes);
router.use('/stories', storiesRoutes);
router.use('/messages', messagesRoutes);
router.use('/events', eventsRoutes);
router.use('/notifications', notificationsRoutes);

// Discovery
router.use('/explore', exploreRoutes);
router.use('/search', searchRoutes);

// Media
router.use('/media', mediaRoutes);

// Admin & Moderation
router.use('/moderation', moderationRoutes);
router.use('/admin', adminRoutes);

export default router;
