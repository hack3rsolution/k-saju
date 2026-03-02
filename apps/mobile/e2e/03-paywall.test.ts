/**
 * E2E — 03: Paywall modal
 *
 * Covers:
 *  - Paywall screen renders subscription plans
 *  - Monthly and Annual plan cards are visible
 *  - Add-on rows are listed
 *  - Restore Purchases button is present
 *  - Close (dismiss) button works
 */
import { by, device, element, expect as detoxExpect, waitFor } from 'detox';

describe('Paywall modal', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      url: 'ksaju://paywall',
    });
  });

  it('paywall screen is visible', async () => {
    await waitFor(element(by.id('paywall-screen')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('shows monthly plan card', async () => {
    await waitFor(element(by.id('paywall-screen'))).toBeVisible().withTimeout(10000);
    await detoxExpect(element(by.id('plan-monthly'))).toBeVisible();
  });

  it('shows annual plan card', async () => {
    await detoxExpect(element(by.id('plan-annual'))).toBeVisible();
  });

  it('shows add-on section', async () => {
    await waitFor(element(by.id('addons-section')))
      .toBeVisible()
      .withTimeout(8000);
    await detoxExpect(element(by.id('addons-section'))).toBeVisible();
  });

  it('shows Restore Purchases button', async () => {
    await detoxExpect(element(by.id('restore-purchases-button'))).toBeVisible();
  });

  it('close button dismisses the paywall', async () => {
    const closeButton = element(by.id('paywall-close-button'));
    await waitFor(closeButton).toBeVisible().withTimeout(6000);
    await closeButton.tap();
    await waitFor(element(by.id('paywall-screen')))
      .not.toBeVisible()
      .withTimeout(6000);
  });
});
