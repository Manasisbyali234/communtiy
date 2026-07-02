import { Router } from 'express';
import { z } from 'zod';
import { postsController } from '../../controllers/posts.controller';
import { auth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';

const router = Router();

const CreatePostSchema = z.object({
  content: z.string().min(1).max(5000),
  mediaUrls: z.array(z.string().url()).max(10).optional(),
  communityId: z.string().cuid().optional(),
  isDraft: z.boolean().optional(),
  scheduledAt: z.coerce.date().optional().nullable(),
});

const UpdatePostSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  isDraft: z.boolean().optional(),
});

const AddCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  parentId: z.string().cuid().optional(),
});

const UpdateCommentSchema = z.object({ content: z.string().min(1).max(2000) });

const CursorQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  parentId: z.string().cuid().nullable().optional(),
});

router.use(auth);

// ── Feed & Explore ────────────────────────────────────────────────────────────
router.get('/feed', validate({ query: CursorQuerySchema }), postsController.getFeed);
router.get('/trending', validate({ query: CursorQuerySchema }), postsController.getTrending);
router.get('/drafts', validate({ query: CursorQuerySchema }), postsController.getDrafts);

// ── CRUD ──────────────────────────────────────────────────────────────────────
router.post('/', validate({ body: CreatePostSchema }), postsController.createPost);
router.get('/:id', postsController.getPost);
router.put('/:id', validate({ body: UpdatePostSchema }), postsController.updatePost);
router.delete('/:id', postsController.deletePost);
router.post('/:id/publish', postsController.publishDraft);

// ── Social ────────────────────────────────────────────────────────────────────
router.post('/:id/like', postsController.likePost);
router.delete('/:id/like', postsController.unlikePost);
router.post('/:id/bookmark', postsController.bookmarkPost);
router.delete('/:id/bookmark', postsController.unbookmarkPost);

// ── Comments ──────────────────────────────────────────────────────────────────
router.get('/:id/comments', validate({ query: CursorQuerySchema }), postsController.getComments);
router.post('/:id/comments', validate({ body: AddCommentSchema }), postsController.addComment);
router.put('/:id/comments/:cid', validate({ body: UpdateCommentSchema }), postsController.updateComment);
router.delete('/:id/comments/:cid', postsController.deleteComment);
router.post('/:id/comments/:cid/like', postsController.likeComment);

export default router;
