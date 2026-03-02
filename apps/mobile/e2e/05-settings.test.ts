/**
 * E2E — 05: Settings screen
 *
 * Covers:
 *  - Settings tab is accessible from tab bar
 *  - User email is displayed
 *  - Language selector row is present and opens language picker
 *  - Daily notification toggle is present
 *  - Restore Purchases row is present (for non-premium users)
 *  - Sign-out button is present and triggers auth redirect
 */
import { by, device, element, expect as detoxExpect, waitFor } from 'detox';

describe('Settings screen', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      url: 'ksaju://settings',
    });
  });

  it('settings screen is visible', async () => {
    await waitFor(element(by.id('settings-screen')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('shows user account section', async () => {
    await waitFor(element(by.id('account-section'))).toBeVisible().withTimeout(8000);
    await detoxExpect(element(by.id('account-section'))).toBeVisible();
  });

  it('language row is present', async () => {
    await detoxExpect(element(by.id('language-row'))).toBeVisible();
  });

  it('tapping language row opens the language picker', async () => {
    await element(by.id('language-row')).tap();
    await waitFor(element(by.id('language-picker-modal')))
      .toBeVisible()
      .withTimeout(6000);
    await detoxExpect(element(by.id('language-picker-modal'))).toBeVisible();
    // Dismiss
    await device.pressBack?.();
  });

  it('daily notification toggle is visible', async () => {
    await waitFor(element(by.id('notification-toggle'))).toBeVisible().withTimeout(8000);
    await detoxExpect(element(by.id('notification-toggle'))).toBeVisible();
  });

  it('restore purchases row is visible', async () => {
    await detoxExpect(element(by.id('restore-purchases-row'))).toBeVisible();
  });

  it('sign-out button is visible', async () => {
    await detoxExpect(element(by.id('signout-button'))).toBeVisible();
  });

  it('tapping sign-out navigates to the login screen', async () => {
    await element(by.id('signout-button')).tap();
    await waitFor(element(by.id('login-screen')))
      .toBeVisible()
      .withTimeout(10000);
  });
});
