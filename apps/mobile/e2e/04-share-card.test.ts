/**
 * E2E — 04: Share Card
 *
 * Covers:
 *  - Home tab shows the Share button after fortune loads
 *  - Tapping Share opens the share card modal
 *  - Share card renders (ShareCard component visible)
 *  - Share native sheet is triggered (or modal dismissed correctly)
 */
import { by, device, element, expect as detoxExpect, waitFor } from 'detox';

describe('Share Card', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      url: 'ksaju://home',
    });
  });

  it('home screen is visible', async () => {
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(12000);
  });

  it('share button is visible on the home screen', async () => {
    await waitFor(element(by.id('share-button')))
      .toBeVisible()
      .withTimeout(15000);
    await detoxExpect(element(by.id('share-button'))).toBeVisible();
  });

  it('tapping share button opens the share card modal', async () => {
    await element(by.id('share-button')).tap();
    await waitFor(element(by.id('share-card-modal')))
      .toBeVisible()
      .withTimeout(8000);
    await detoxExpect(element(by.id('share-card-modal'))).toBeVisible();
  });

  it('share card content is rendered', async () => {
    await waitFor(element(by.id('share-card-view')))
      .toBeVisible()
      .withTimeout(6000);
    await detoxExpect(element(by.id('share-card-view'))).toBeVisible();
  });

  it('tapping the share action button triggers sharing', async () => {
    const shareActionButton = element(by.id('share-action-button'));
    await waitFor(shareActionButton).toBeVisible().withTimeout(6000);
    await shareActionButton.tap();
    // Native share sheet opens — just verify modal is still present or sheet appeared
    await waitFor(element(by.id('share-card-modal')))
      .toExist()
      .withTimeout(5000);
  });

  it('close button dismisses the share card modal', async () => {
    const closeButton = element(by.id('share-card-close-button'));
    await waitFor(closeButton).toBeVisible().withTimeout(6000);
    await closeButton.tap();
    await waitFor(element(by.id('share-card-modal')))
      .not.toBeVisible()
      .withTimeout(6000);
  });
});
