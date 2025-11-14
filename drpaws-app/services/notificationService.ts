import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Checks if the browser supports the Notification API.
 * @returns {boolean} True if supported, false otherwise.
 */
export const isSupported = (): boolean => {
    if (Capacitor.isNativePlatform()) {
        return true;
    }
    return 'Notification' in window;
};

/**
 * Checks if notification permission has been granted.
 * @returns {boolean} True if permission is granted, false otherwise.
 */
export const isPermissionGranted = (): boolean => {
    if (!isSupported()) {
        return false;
    }
    if (Capacitor.isNativePlatform()) {
        return true;
    }
    return Notification.permission === 'granted';
};

/**
 * Requests notification permission from the user.
 * @returns {Promise<NotificationPermission>} A promise that resolves with the user's choice.
 */
export const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported()) {
        return 'denied';
    }
    
    if (Capacitor.isNativePlatform()) {
        try {
            const result = await LocalNotifications.requestPermissions();
            return result.display === 'granted' ? 'granted' : 'denied';
        } catch (error) {
            console.error('Failed to request notification permissions:', error);
            return 'denied';
        }
    }
    
    return await Notification.requestPermission();
};

/**
 * Displays a system notification.
 * @param {string} title The title of the notification.
 * @param {NotificationOptions} [options] Optional parameters for the notification.
 */
export const showNotification = (title: string, options?: NotificationOptions): void => {
    if (!isPermissionGranted()) {
        console.warn('Notification permission has not been granted.');
        return;
    }
    
    if (Capacitor.isNativePlatform()) {
        LocalNotifications.schedule({
            notifications: [
                {
                    title,
                    body: options?.body || '',
                    id: Date.now(),
                    schedule: { at: new Date(Date.now() + 1000) },
                    smallIcon: options?.icon,
                }
            ]
        }).catch(error => {
            console.error('Failed to show notification:', error);
        });
    } else {
        new Notification(title, options);
    }
};
