/**
 * E2E — 01: Authentication flow
 *
 * Covers:
 *  - Login screen renders magic-link / Google / Apple buttons
 *  - Entering an email and tapping "Send Magic Link" shows confirmation
 *  - Unauthenticated navigation redirects to login
 */
import { by, device, element, expect as detoxExpect, waitFor } from 'detox';

describe('Auth flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('shows the login screen on cold start (unauthenticated)', async () => {
    await waitFor(element(by.id('login-screen')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('renders the magic-link email input and send button', async () => {
    await waitFor(element(by.id('login-screen'))).toBeVisible().withTimeout(10000);
    await detoxExpect(element(by.id('email-input'))).toBeVisible();
    await detoxExpect(element(by.id('magic-link-button'))).toBeVisible();
  });

  it('tapping Send Magic Link with a valid email shows confirmation message', async () => {
    await waitFor(element(by.id('login-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('email-input')).tap();
    await element(by.id('email-input')).typeText('test@k-saju.app');
    await element(by.id('magic-link-button')).tap();
    await waitFor(element(by.id('magic-link-sent-message')))
      .toBeVisible()
      .withTimeout(8000);
  });

  it('shows Google sign-in button', async () => {
    await waitFor(element(by.id('login-screen'))).toBeVisible().withTimeout(10000);
    await detoxExpect(element(by.id('google-signin-button'))).toBeVisible();
  });

  it('shows Apple sign-in button on iOS', async () => {
    if (device.getPlatform() !== 'ios') return;
    await waitFor(element(by.id('login-screen'))).toBeVisible().withTimeout(10000);
    await detoxExpect(element(by.id('apple-signin-button'))).toBeVisible();
  });
});
