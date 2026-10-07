import { prisma } from '../lib/prisma.js';
import type { Prisma } from '@prisma/client';

export function findCacheEntry(repoFullName: string) {
  return prisma.repoCache.findUnique({ where: { repoFullName } });
}

export function upsertCacheEntry(
  repoFullName: string,
  data: Prisma.InputJsonValue,
  etag: string | null,
  fetchedAt: Date,
) {
  return prisma.repoCache.upsert({
    where: { repoFullName },
    create: { repoFullName, data, etag, fetchedAt },
    update: { data, etag, fetchedAt },
  });
}

export function touchCacheEntry(repoFullName: string, fetchedAt: Date) {
  return prisma.repoCache.update({ where: { repoFullName }, data: { fetchedAt } });
}
