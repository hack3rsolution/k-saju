import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export { PrismaClient };
export type {
  User,
  SajuChart,
  Reading,
  Subscription,
  AddonPurchase,
  CompatibilityReport,
  PushToken,
} from '@prisma/client';

export {
  CulturalFrame,
  Gender,
  SubscriptionPlan,
  ReadingType,
  AddonType,
  Platform,
} from '@prisma/client';
