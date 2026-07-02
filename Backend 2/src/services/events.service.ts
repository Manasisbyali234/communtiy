import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { buildCursorArgs, buildCursorPage } from '../utils/pagination';
import { getQueue, QUEUE_NAMES } from '../config/bullmq';
import { RsvpStatus } from '@prisma/client';

export const eventsService = {
  async list(params: { cursor?: string; limit?: number; communityId?: string; upcoming?: boolean; search?: string }) {
    const { cursor, limit = 20, communityId, upcoming, search } = params;
    const args = buildCursorArgs({ cursor, limit });

    const events = await prisma.event.findMany({
      ...args,
      where: {
        ...(communityId ? { communityId } : {}),
        ...(upcoming ? { startsAt: { gt: new Date() } } : {}),
        ...(search ? { OR: [{ title: { contains: search, mode: 'insensitive' } }, { location: { contains: search, mode: 'insensitive' } }] } : {}),
      },
      include: { community: { select: { id: true, name: true, slug: true } } },
      orderBy: { startsAt: 'asc' },
    });

    return buildCursorPage(events, limit);
  },

  async create(creatorId: string, data: {
    title: string; description?: string; location?: string;
    startsAt: Date; endsAt?: Date; coverUrl?: string; communityId?: string;
  }) {
    const event = await prisma.event.create({
      data: { creatorId, ...data },
      include: { community: { select: { id: true, name: true } } },
    });

    // Schedule a reminder 24h before the event
    const reminderDelay = data.startsAt.getTime() - Date.now() - 24 * 60 * 60 * 1000;
    if (reminderDelay > 0) {
      const queue = getQueue(QUEUE_NAMES.EVENT_REMINDER);
      await queue.add('remind', { eventId: event.id }, { delay: reminderDelay });
    }

    return event;
  },

  async getById(eventId: string, userId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        community: { select: { id: true, name: true, slug: true } },
        rsvps: { where: { userId }, select: { status: true } },
      },
    });
    if (!event) throw ApiError.notFound('Event not found');

    return { ...event, myRsvp: event.rsvps[0]?.status ?? null };
  },

  async update(eventId: string, creatorId: string, data: Partial<{ title: string; description: string; location: string; startsAt: Date; endsAt: Date; coverUrl: string }>) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw ApiError.notFound('Event not found');
    if (event.creatorId !== creatorId) throw ApiError.forbidden('Only the event creator can update it');
    return prisma.event.update({ where: { id: eventId }, data });
  },

  async delete(eventId: string, creatorId: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw ApiError.notFound('Event not found');
    if (event.creatorId !== creatorId) throw ApiError.forbidden('Only the event creator can delete it');
    await prisma.event.delete({ where: { id: eventId } });
  },

  async rsvp(eventId: string, userId: string, status: RsvpStatus) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw ApiError.notFound('Event not found');

    const existing = await prisma.eventRsvp.findUnique({ where: { eventId_userId: { eventId, userId } } });
    const wasGoing = existing?.status === 'GOING';
    const isGoing = status === 'GOING';

    const rsvp = await prisma.eventRsvp.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId, status },
      update: { status },
    });

    // Adjust rsvpCount based on transition
    if (!wasGoing && isGoing) {
      await prisma.event.update({ where: { id: eventId }, data: { rsvpCount: { increment: 1 } } });
    } else if (wasGoing && !isGoing) {
      await prisma.event.update({ where: { id: eventId }, data: { rsvpCount: { decrement: 1 } } });
    }

    return rsvp;
  },

  async cancelRsvp(eventId: string, userId: string) {
    const rsvp = await prisma.eventRsvp.findUnique({ where: { eventId_userId: { eventId, userId } } });
    if (!rsvp) return;

    await prisma.$transaction([
      prisma.eventRsvp.delete({ where: { eventId_userId: { eventId, userId } } }),
      ...(rsvp.status === 'GOING' ? [prisma.event.update({ where: { id: eventId }, data: { rsvpCount: { decrement: 1 } } })] : []),
    ]);
  },

  async getAttendees(eventId: string, cursor?: string, limit = 20) {
    const args = buildCursorArgs({ cursor, limit });
    const rsvps = await prisma.eventRsvp.findMany({
      ...args,
      where: { eventId },
      include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'asc' },
    });
    const items = rsvps.map((r) => ({ ...r.user, status: r.status }));
    return buildCursorPage(items, limit);
  },
};
