
/**
 * Checks if the browser supports the Notification API.
 * @returns {boolean} True if supported, false otherwise.
 */
export const isSupported = (): boolean => {
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
    new Notification(title, options);
};
