import path from 'path';
import crypto from 'crypto';
import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { s3, storageBucket } from '../config/storage';
import { config } from '../config';

// Serve images through the backend proxy so S3 bucket doesn't need public access
const proxyUrl = (key: string) => `${config.APP_URL}/api/v1/media/proxy/${encodeURIComponent(key)}`;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm',
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3',
  'application/pdf', 'text/plain',
]);

const MAX_SIZE = 50 * 1024 * 1024;

interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export const mediaService = {
  async uploadFile(file: UploadedFile, uploadedBy: string): Promise<{ id: string; filename: string; url: string }> {
    if (file.size > MAX_SIZE) throw ApiError.badRequest('File too large. Maximum size is 50MB.');
    if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) throw ApiError.badRequest('File type not allowed.');

    const extension = path.extname(file.originalname);
    const filename = `${crypto.randomUUID()}${extension}`;
    const key = `uploads/${filename}`;

    return this._uploadToS3(file, key, uploadedBy);
  },

  async uploadEventImage(file: UploadedFile, uploadedBy: string): Promise<{ id: string; filename: string; url: string }> {
    if (file.size > MAX_SIZE) throw ApiError.badRequest('File too large. Maximum size is 50MB.');
    if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) throw ApiError.badRequest('File type not allowed.');

    const extension = path.extname(file.originalname);
    const filename = `${crypto.randomUUID()}${extension}`;
    const key = `events/${filename}`;

    return this._uploadToS3(file, key, uploadedBy);
  },

  async _uploadToS3(file: UploadedFile, key: string, uploadedBy: string): Promise<{ id: string; filename: string; url: string }> {

    await s3.send(new PutObjectCommand({
      Bucket: storageBucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));

    const url = proxyUrl(key);

    const mediaFile = await prisma.mediaFile.create({
      data: { filename: key, originalName: file.originalname, mimeType: file.mimetype, fileSize: file.size, url, uploadedBy },
    });

    return { id: mediaFile.id, filename: key, url };
  },

  async uploadFiles(files: UploadedFile[], uploadedBy: string) {
    return Promise.all(files.map(f => this.uploadFile(f, uploadedBy)));
  },

  async getFile(id: string) {
    const mediaFile = await prisma.mediaFile.findUnique({
      where: { id },
      select: { url: true, mimeType: true, filename: true, originalName: true },
    });
    return mediaFile ?? null;
  },

  async deleteFile(id: string, userId?: string): Promise<void> {
    const where: any = { id };
    if (userId) where.uploadedBy = userId;

    const file = await prisma.mediaFile.findFirst({ where, select: { id: true, filename: true } });
    if (!file) throw ApiError.notFound('File not found or you do not have permission to delete it.');

    await s3.send(new DeleteObjectCommand({ Bucket: storageBucket, Key: file.filename }));
    await prisma.mediaFile.delete({ where: { id } });
  },

  async getFileMetadata(id: string) {
    const mediaFile = await prisma.mediaFile.findUnique({
      where: { id },
      select: { id: true, filename: true, originalName: true, mimeType: true, fileSize: true, uploadedBy: true, createdAt: true, url: true },
    });
    return mediaFile ?? null;
  },

  async getUserFiles(userId: string, { skip, take, mimeType }: { skip: number; take: number; mimeType?: string }) {
    const where: any = { uploadedBy: userId };
    if (mimeType) where.mimeType = { startsWith: mimeType };

    const [files, total] = await Promise.all([
      prisma.mediaFile.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.mediaFile.count({ where }),
    ]);

    return { files, total };
  },

  async getStorageStats() {
    const stats = await prisma.mediaFile.aggregate({
      _count: { id: true },
      _sum: { fileSize: true },
    });
    return { totalFiles: stats._count.id, totalSize: stats._sum.fileSize ?? 0 };
  },
};
