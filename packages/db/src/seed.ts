/**
 * Seed script — development only.
 * Usage: pnpm --filter @k-saju/db db:seed
 */

import { prisma } from './index';
import { CulturalFrame, Gender } from '@prisma/client';

async function main() {
  console.log('🌱 Seeding database...');

  // Sample user (matches a Supabase auth.users entry in dev)
  const user = await prisma.user.upsert({
    where: { email: 'dev@ksaju.app' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001', // fixed UUID for dev
      email: 'dev@ksaju.app',
      culturalFrame: CulturalFrame.kr,
      gender: Gender.M,
      birthDate: new Date('1990-03-15'),
      birthTime: '10:00',
      timezone: 'Asia/Seoul',
      locale: 'ko',
      onboardingDone: true,
    },
  });

  console.log(`✅ User: ${user.email}`);

  // Sample saju chart
  const chart = await prisma.sajuChart.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      yearPillar:     { stem: '庚', branch: '午' },
      monthPillar:    { stem: '丁', branch: '卯' },
      dayPillar:      { stem: '庚', branch: '申' },
      hourPillar:     { stem: '戊', branch: '午' },
      elementBalance: { Wood: 1, Fire: 3, Earth: 2, Metal: 3, Water: 0 },
      dayStem:        '庚',
      daewoonList:    [
        { index: 0, startAge: 7,  pillar: { stem: '戊', branch: '寅' }, element: 'Earth' },
        { index: 1, startAge: 17, pillar: { stem: '己', branch: '丑' }, element: 'Earth' },
        { index: 2, startAge: 27, pillar: { stem: '庚', branch: '子' }, element: 'Metal' },
        { index: 3, startAge: 37, pillar: { stem: '辛', branch: '亥' }, element: 'Metal' },
        { index: 4, startAge: 47, pillar: { stem: '壬', branch: '戌' }, element: 'Water' },
        { index: 5, startAge: 57, pillar: { stem: '癸', branch: '酉' }, element: 'Water' },
        { index: 6, startAge: 67, pillar: { stem: '甲', branch: '申' }, element: 'Wood'  },
        { index: 7, startAge: 77, pillar: { stem: '乙', branch: '未' }, element: 'Wood'  },
      ],
    },
  });

  console.log(`✅ SajuChart for userId: ${chart.userId}`);

  // Sample subscription (free tier)
  await prisma.subscription.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      plan: 'free',
    },
  });

  console.log('✅ Subscription: free');
  console.log('🎉 Seed complete');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
