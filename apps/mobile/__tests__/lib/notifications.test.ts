/**
 * notifications.ts — unit tests.
 * All native modules are mocked in jest.setup.ts.
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

import {
  configureNotifications,
  requestNotificationPermission,
  getPermissionStatus,
  scheduleDailyNotification,
  cancelDailyNotification,
  isDailyNotificationScheduled,
} from '../../src/lib/notifications';

// Typed references to mocked functions for cleaner assertions
const mockSetHandler          = Notifications.setNotificationHandler as jest.Mock;
const mockGetPerms            = Notifications.getPermissionsAsync     as jest.Mock;
const mockReqPerms            = Notifications.requestPermissionsAsync  as jest.Mock;
const mockSchedule            = Notifications.scheduleNotificationAsync as jest.Mock;
const mockCancelById          = Notifications.cancelScheduledNotificationAsync as jest.Mock;
const mockGetAllScheduled     = Notifications.getAllScheduledNotificationsAsync as jest.Mock;

describe('notifications', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── configureNotifications ────────────────────────────────────────────────

  describe('configureNotifications', () => {
    it('calls setNotificationHandler with an object', () => {
      configureNotifications();
      expect(mockSetHandler).toHaveBeenCalledTimes(1);
      expect(mockSetHandler).toHaveBeenCalledWith(expect.objectContaining({
        handleNotification: expect.any(Function),
      }));
    });

    it('handleNotification returns shouldShowAlert=true', async () => {
      configureNotifications();
      const handler = mockSetHandler.mock.calls[0][0];
      const result  = await handler.handleNotification({} as never);
      expect(result.shouldShowAlert).toBe(true);
      expect(result.shouldPlaySound).toBe(true);
    });
  });

  // ── requestNotificationPermission ─────────────────────────────────────────

  describe('requestNotificationPermission', () => {
    it('returns true when permission is already granted', async () => {
      mockGetPerms.mockResolvedValue({ status: 'granted' });
      const result = await requestNotificationPermission();
      expect(result).toBe(true);
      expect(mockReqPerms).not.toHaveBeenCalled();
    });

    it('requests permission when not yet granted', async () => {
      mockGetPerms.mockResolvedValue({ status: 'undetermined' });
      mockReqPerms.mockResolvedValue({ status: 'granted' });
      const result = await requestNotificationPermission();
      expect(result).toBe(true);
      expect(mockReqPerms).toHaveBeenCalledTimes(1);
    });

    it('returns false when user denies permission', async () => {
      mockGetPerms.mockResolvedValue({ status: 'undetermined' });
      mockReqPerms.mockResolvedValue({ status: 'denied' });
      const result = await requestNotificationPermission();
      expect(result).toBe(false);
    });

    it('returns false on a simulator (Device.isDevice = false)', async () => {
      Object.defineProperty(Device, 'isDevice', { value: false, configurable: true });
      const result = await requestNotificationPermission();
      expect(result).toBe(false);
      // Restore
      Object.defineProperty(Device, 'isDevice', { value: true, configurable: true });
    });
  });

  // ── getPermissionStatus ───────────────────────────────────────────────────

  describe('getPermissionStatus', () => {
    it('returns the current permission status', async () => {
      mockGetPerms.mockResolvedValue({ status: 'granted' });
      const status = await getPermissionStatus();
      expect(status).toBe('granted');
    });
  });

  // ── scheduleDailyNotification ─────────────────────────────────────────────

  describe('scheduleDailyNotification', () => {
    it('calls scheduleNotificationAsync with 8:00 daily trigger', async () => {
      await scheduleDailyNotification();
      expect(mockSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: expect.any(String),
          content: expect.objectContaining({
            title: expect.stringContaining('Fortune'),
          }),
          trigger: expect.objectContaining({ hour: 8, minute: 0, repeats: true }),
        }),
      );
    });

    it('cancels existing notification before scheduling', async () => {
      await scheduleDailyNotification();
      expect(mockCancelById).toHaveBeenCalled();
    });
  });

  // ── cancelDailyNotification ───────────────────────────────────────────────

  describe('cancelDailyNotification', () => {
    it('calls cancelScheduledNotificationAsync with the daily notification id', async () => {
      await cancelDailyNotification();
      expect(mockCancelById).toHaveBeenCalledTimes(1);
    });

    it('does not throw if there is no scheduled notification', async () => {
      mockCancelById.mockRejectedValue(new Error('not found'));
      await expect(cancelDailyNotification()).resolves.toBeUndefined();
    });
  });

  // ── isDailyNotificationScheduled ─────────────────────────────────────────

  describe('isDailyNotificationScheduled', () => {
    it('returns true when the daily notification is present', async () => {
      mockGetAllScheduled.mockResolvedValue([
        { identifier: 'daily-fortune-notif', content: {}, trigger: {} },
      ]);
      const result = await isDailyNotificationScheduled();
      expect(result).toBe(true);
    });

    it('returns false when no notifications are scheduled', async () => {
      mockGetAllScheduled.mockResolvedValue([]);
      const result = await isDailyNotificationScheduled();
      expect(result).toBe(false);
    });

    it('returns false when only unrelated notifications exist', async () => {
      mockGetAllScheduled.mockResolvedValue([
        { identifier: 'some-other-notif', content: {}, trigger: {} },
      ]);
      const result = await isDailyNotificationScheduled();
      expect(result).toBe(false);
    });
  });
});
