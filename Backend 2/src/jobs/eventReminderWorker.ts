import { Worker, QUEUE_NAMES, getQueue } from '../config/bullmq';
import { EventReminderJobData } from '../types/index';
import { logger } from '../config/logger';
import { prisma } from '../config/database';
import { notificationsService } from '../services/notifications.service';
import { getIO } from '../sockets/index';

export function startEventReminderWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.EVENT_REMINDER,
    async (job: { name: string; data: EventReminderJobData }) => {
      const { eventId } = job.data;
      logger.info({ jobName: job.name, eventId }, 'Processing event reminder job');

      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { title: true, startsAt: true },
      });

      if (!event) return;

      // Only remind if it's actually coming up (hasn't been cancelled/deleted/rescheduled past the window)
      if (event.startsAt.getTime() - Date.now() > 48 * 60 * 60 * 1000) return;

      // Get attendees
      const attendees = await prisma.eventRsvp.findMany({
        where: { eventId, status: 'GOING' },
        select: { userId: true },
      });

      const io = getIO();

      // Dispatch notifications & push jobs
      const pushQueue = getQueue(QUEUE_NAMES.PUSH);
      
      for (const rsvp of attendees) {
        // 1. In-app notification
        await notificationsService.create({
          recipientId: rsvp.userId,
          type: 'EVENT_REMINDER',
          entityId: eventId,
          entityType: 'Event',
          body: `Reminder: ${event.title} is starting soon!`,
        });

        // 2. Real-time socket event
        io.to(`user:${rsvp.userId}`).emit('notification:new', {
          type: 'EVENT_REMINDER',
          body: `Reminder: ${event.title} is starting soon!`,
        });

        // 3. Queue push notification
        const user = await prisma.user.findUnique({ 
          where: { id: rsvp.userId }, 
          select: { deviceTokens: { select: { token: true } } }
        });
        
        if (user?.deviceTokens?.length) {
          await pushQueue.add('send', {
            tokens: user.deviceTokens.map(dt => dt.token),
            title: 'Upcoming Event',
            body: `${event.title} is starting soon!`,
            data: { eventId },
          });
        }
      }

      logger.info({ eventId, remindedCount: attendees.length }, 'Event reminders sent');
    },
  );

  return worker;
}
