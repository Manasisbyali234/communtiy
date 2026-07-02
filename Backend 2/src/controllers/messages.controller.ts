import { Request, Response } from 'express';
import { messagesService } from '../services/messages.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { MediaType } from '@prisma/client';

export const messagesController = {
  getConversations: asyncHandler(async (req: Request, res: Response) => {
    const result = await messagesService.getConversations(req.user.id);
    res.json(new ApiResponse(200, result));
  }),

  getOrCreate: asyncHandler(async (req: Request, res: Response) => {
    const { participantId } = req.body as { participantId: string };
    const conversation = await messagesService.getOrCreateConversation(req.user.id, participantId);
    res.json(new ApiResponse(200, conversation));
  }),

  getMessages: asyncHandler(async (req: Request, res: Response) => {
    const { cursor, limit } = req.query as { cursor?: string; limit?: string };
    const result = await messagesService.getMessages(req.params['id'], req.user.id, cursor, limit ? parseInt(limit) : 30);
    res.json(new ApiResponse(200, result));
  }),

  sendMessage: asyncHandler(async (req: Request, res: Response) => {
    const { content, mediaUrl, mediaType } = req.body as { content?: string; mediaUrl?: string; mediaType?: MediaType };
    const message = await messagesService.sendMessage(req.params['id'], req.user.id, { content, mediaUrl, mediaType });
    res.status(201).json(new ApiResponse(201, message, 'Message sent'));
  }),

  markRead: asyncHandler(async (req: Request, res: Response) => {
    await messagesService.markRead(req.params['id'], req.user.id);
    res.json(new ApiResponse(200, null, 'Marked as read'));
  }),

  addReaction: asyncHandler(async (req: Request, res: Response) => {
    const { emoji } = req.body as { emoji: string };
    const reactions = await messagesService.addReaction(req.params['msgId'], req.user.id, emoji);
    res.json(new ApiResponse(200, reactions, 'Reaction added'));
  }),

  removeReaction: asyncHandler(async (req: Request, res: Response) => {
    const reactions = await messagesService.removeReaction(req.params['msgId'], req.user.id, req.params['emoji']);
    res.json(new ApiResponse(200, reactions, 'Reaction removed'));
  }),

  deleteForEveryone: asyncHandler(async (req: Request, res: Response) => {
    await messagesService.deleteForEveryone(req.params['msgId'], req.user.id);
    res.json(new ApiResponse(200, null, 'Message deleted for everyone'));
  }),

  deleteForMe: asyncHandler(async (req: Request, res: Response) => {
    await messagesService.deleteForMe(req.params['msgId'], req.user.id);
    res.json(new ApiResponse(200, null, 'Message deleted for you'));
  }),
};
