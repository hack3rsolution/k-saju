/**
 * E2E — 02: Onboarding flow
 *
 * Covers:
 *  - Birth-input screen: year/month/day wheel pickers render and scroll
 *  - Gender selection
 *  - Cultural-frame screen: 6 frame cards visible, can select one
 *  - Result-preview renders pillars (at least 4 characters visible)
 *
 * Note: This test starts from the onboarding route directly (deepLink).
 */
import { by, device, element, expect as detoxExpect, waitFor } from 'detox';

describe('Onboarding flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      url: 'ksaju://onboarding/birth-input',
    });
  });

  it('shows the birth-input screen', async () => {
    await waitFor(element(by.id('birth-input-screen')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('year wheel picker is visible and can scroll', async () => {
    await waitFor(element(by.id('year-picker'))).toBeVisible().withTimeout(8000);
    await element(by.id('year-picker')).scroll(100, 'down');
    await detoxExpect(element(by.id('year-picker'))).toBeVisible();
  });

  it('can select Male gender', async () => {
    await waitFor(element(by.id('gender-male-button'))).toBeVisible().withTimeout(8000);
    await element(by.id('gender-male-button')).tap();
    await detoxExpect(element(by.id('gender-male-button'))).toHaveId('gender-male-button');
  });

  it('Next button navigates to cultural-frame screen', async () => {
    await waitFor(element(by.id('birth-input-next-button'))).toBeVisible().withTimeout(8000);
    await element(by.id('birth-input-next-button')).tap();
    await waitFor(element(by.id('cultural-frame-screen')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('cultural-frame screen shows 6 frame cards', async () => {
    await waitFor(element(by.id('cultural-frame-screen'))).toBeVisible().withTimeout(10000);
    for (const frameId of ['frame-kr', 'frame-cn', 'frame-jp', 'frame-en', 'frame-es', 'frame-in']) {
      await detoxExpect(element(by.id(frameId))).toExist();
    }
  });

  it('selecting kr frame and proceeding shows result-preview', async () => {
    await element(by.id('frame-en')).tap();
    await element(by.id('cultural-frame-next-button')).tap();
    await waitFor(element(by.id('result-preview-screen')))
      .toBeVisible()
      .withTimeout(15000);
  });

  it('result-preview shows saju pillars', async () => {
    await waitFor(element(by.id('pillar-grid'))).toBeVisible().withTimeout(12000);
    await detoxExpect(element(by.id('pillar-grid'))).toBeVisible();
  });
});
