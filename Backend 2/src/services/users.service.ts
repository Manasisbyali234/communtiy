import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { buildCursorArgs, buildCursorPage } from '../utils/pagination';
import { notificationsService } from './notifications.service';
export const usersService = {
  async getMe(userId: string) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true, email: true, username: true, displayName: true, bio: true,
        avatarUrl: true, bannerUrl: true, village: true, occupation: true, languages: true, interests: true, role: true, isVerified: true, createdAt: true,
        _count: { select: { followers: true, following: true, posts: true } },
      },
    });
    return {
      ...user,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      postsCount: user._count.posts,
    };
  },

  async updateMe(userId: string, data: { displayName?: string; bio?: string; avatarUrl?: string; bannerUrl?: string; village?: string; occupation?: string; languages?: string; interests?: string }) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, username: true, displayName: true, bio: true, avatarUrl: true, bannerUrl: true, village: true, occupation: true, languages: true, interests: true },
    });
  },

  async deactivateMe(userId: string) {
    await prisma.user.update({ where: { id: userId }, data: { isActive: false } });
    await prisma.refreshToken.deleteMany({ where: { userId } });
  },

  async getPublicProfile(userId: string, viewerId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId, isActive: true },
      select: {
        id: true, username: true, displayName: true, bio: true,
        avatarUrl: true, bannerUrl: true, isVerified: true, role: true, createdAt: true,
        _count: { select: { followers: true, following: true, posts: true } },
      },
    });
    if (!user) throw ApiError.notFound('User not found');

    const isFollowing = viewerId !== userId
      ? !!(await prisma.follow.findUnique({ where: { followerId_followingId: { followerId: viewerId, followingId: userId } } }))
      : false;

    return {
      ...user,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      postsCount: user._count.posts,
      isFollowing,
    };
  },

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) throw ApiError.badRequest('You cannot follow yourself');
    const target = await prisma.user.findUnique({ where: { id: followingId } });
    if (!target) throw ApiError.notFound('User not found');
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      create: { followerId, followingId },
      update: {},
    });

    await notificationsService.create({
      recipientId: followingId,
      type: 'NEW_FOLLOWER',
      actorId: followerId,
      entityId: followerId,
      entityType: 'User',
    });
  },

  async unfollowUser(followerId: string, followingId: string) {
    await prisma.follow.deleteMany({ where: { followerId, followingId } });
  },

  async getFollowers(userId: string, cursor?: string, limit = 20) {
    const args = buildCursorArgs({ cursor, limit });
    const follows = await prisma.follow.findMany({
      ...args,
      where: { followingId: userId },
      include: { follower: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const items = follows.map((f) => f.follower);
    return buildCursorPage(items, limit);
  },

  async getFollowing(userId: string, cursor?: string, limit = 20) {
    const args = buildCursorArgs({ cursor, limit });
    const follows = await prisma.follow.findMany({
      ...args,
      where: { followerId: userId },
      include: { following: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const items = follows.map((f) => f.following);
    return buildCursorPage(items, limit);
  },

  async getUserPosts(userId: string, cursor?: string, limit = 20) {
    const args = buildCursorArgs({ cursor, limit });
    const posts = await prisma.post.findMany({
      ...args,
      where: { authorId: userId },
      include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return buildCursorPage(posts, limit);
  },

  async updatePushToken(userId: string, expoPushToken: string) {
    await prisma.user.update({ where: { id: userId }, data: { expoPushToken } });
  },
};
