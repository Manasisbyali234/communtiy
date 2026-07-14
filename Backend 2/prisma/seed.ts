import { PrismaClient, Role, CommunityMemberRole, MediaType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Returns a Date that is `daysAgo` days and `hoursAgo` hours before now
const ago = (daysAgo: number, hoursAgo = 0) =>
  new Date(Date.now() - (daysAgo * 24 + hoursAgo) * 60 * 60 * 1000);

async function main() {
  console.log('🌱 Seeding database...');

  // ── Clear existing data ────────────────────────────────────────────────────
  await prisma.notification.deleteMany();
  await prisma.eventRsvp.deleteMany();
  await prisma.event.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.storyView.deleteMany();
  await prisma.story.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.communityMember.deleteMany();
  await prisma.community.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.otp.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Admin@1234', 12);

  // ── Users (registered on different days) ──────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      email: 'admin@community.app',
      username: 'admin',
      passwordHash,
      displayName: 'Admin User',
      role: Role.ADMIN,
      isVerified: true,
      bio: 'Platform administrator',
      createdAt: ago(30),
    },
  });

  const user1 = await prisma.user.create({
    data: {
      email: 'suresh@community.app',
      username: 'sureshg',
      passwordHash,
      displayName: 'Suresh Gowda',
      isVerified: true,
      bio: 'Agriculturist from Mandya',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      createdAt: ago(14),
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'ramya@community.app',
      username: 'ramyag',
      passwordHash,
      displayName: 'Ramya Gowda',
      isVerified: true,
      bio: 'Teacher from Mysuru',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      createdAt: ago(10),
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'manjunath@community.app',
      username: 'manjug',
      passwordHash,
      displayName: 'Manjunath Gowda',
      isVerified: true,
      bio: 'Farmer from Hassan',
      createdAt: ago(3),
    },
  });

  // ── Follows ────────────────────────────────────────────────────────────────
  await prisma.follow.createMany({
    data: [
      { followerId: user1.id, followingId: user2.id },
      { followerId: user2.id, followingId: user1.id },
      { followerId: user1.id, followingId: user3.id },
      { followerId: admin.id, followingId: user1.id },
    ],
  });

  // ── Communities ────────────────────────────────────────────────────────────
  const comm1 = await prisma.community.create({
    data: {
      name: 'Gowda Sabha',
      slug: 'gowda-sabha',
      description: 'Official Gowda community platform for cultural events and news.',
      category: 'Culture',
      memberCount: 3,
      createdAt: ago(20),
      members: {
        create: [
          { userId: admin.id, role: CommunityMemberRole.ADMIN },
          { userId: user1.id, role: CommunityMemberRole.MEMBER },
          { userId: user2.id, role: CommunityMemberRole.MODERATOR },
        ],
      },
    },
  });

  const comm2 = await prisma.community.create({
    data: {
      name: 'Mandya Farmers',
      slug: 'mandya-farmers',
      description: 'A group for farmers across Mandya district to share knowledge.',
      category: 'Agriculture',
      memberCount: 2,
      createdAt: ago(7),
      members: {
        create: [
          { userId: user1.id, role: CommunityMemberRole.ADMIN },
          { userId: user3.id, role: CommunityMemberRole.MEMBER },
        ],
      },
    },
  });

  // ── Posts ──────────────────────────────────────────────────────────────────
  const post1 = await prisma.post.create({
    data: {
      authorId: user1.id,
      communityId: comm1.id,
      content: 'Excited to announce the Gowda Sangha Sammelana 2025! Mark your calendars for July 15th.',
      likesCount: 24,
      commentsCount: 3,
      createdAt: ago(5),
    },
  });

  const post2 = await prisma.post.create({
    data: {
      authorId: user2.id,
      content: 'The community health camp was a great success! Over 200 people attended.',
      mediaUrls: ['https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600'],
      mediaType: MediaType.IMAGE,
      likesCount: 15,
      commentsCount: 1,
      createdAt: ago(2),
    },
  });

  await prisma.post.create({
    data: {
      authorId: user3.id,
      communityId: comm2.id,
      content: 'New seeds available for the rabi season. Farmers, please register at the office.',
      likesCount: 8,
      commentsCount: 0,
      createdAt: ago(0, 6),
    },
  });

  // ── Comments ───────────────────────────────────────────────────────────────
  await prisma.comment.create({
    data: {
      postId: post1.id,
      authorId: user2.id,
      content: 'Looking forward to it! Will be attending with family.',
      createdAt: ago(4),
    },
  });

  await prisma.comment.create({
    data: {
      postId: post2.id,
      authorId: user1.id,
      content: 'Great initiative by the doctors association!',
      createdAt: ago(1),
    },
  });

  // ── Stories ────────────────────────────────────────────────────────────────
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.story.create({
    data: {
      authorId: user1.id,
      mediaUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400',
      mediaType: MediaType.IMAGE,
      expiresAt: tomorrow,
      createdAt: ago(0, 3),
    },
  });

  // ── Events ─────────────────────────────────────────────────────────────────
  await prisma.event.create({
    data: {
      communityId: comm1.id,
      creatorId: admin.id,
      title: 'Gowda Sangha Sammelana 2025',
      description: 'Annual gathering of the Gowda community. Cultural programs, discussions, and festivities.',
      location: 'Mandya Convention Hall',
      startsAt: new Date('2025-07-15T10:00:00Z'),
      endsAt: new Date('2025-07-15T18:00:00Z'),
      rsvpCount: 2,
      createdAt: ago(8),
      rsvps: {
        create: [
          { userId: user1.id, status: 'GOING' },
          { userId: user2.id, status: 'MAYBE' },
        ],
      },
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log(`
  📧 Test credentials (all passwords: Admin@1234):
  - admin@community.app (ADMIN)
  - suresh@community.app
  - ramya@community.app
  - manjunath@community.app
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
