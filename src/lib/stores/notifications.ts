import { writable } from 'svelte/store';

export type NotificationType = 'info' | 'success' | 'error' | 'loading';

export interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    dismissible?: boolean;
    autoClose?: number; // Time in ms after which to auto-close the notification
}

const notificationsStore = writable<Notification[]>([]);

export const notifications = {
    subscribe: notificationsStore.subscribe,
    add: (notification: Omit<Notification, 'id'>) => {
        const id = crypto.randomUUID();
        notificationsStore.update((notifications) => [...notifications, { ...notification, id }]);
        if (notification.autoClose) {
            setTimeout(() => {
                notifications.remove(id);
            }, notification.autoClose);
        }
        return id;
    },
    remove: (id: string) => {
        notificationsStore.update((notifications) => notifications.filter((n) => n.id !== id));
    },
    clear: () => {
        notificationsStore.set([]);
    },
    update: (id: string, updates: Partial<Omit<Notification, 'id'>>) => {
        notificationsStore.update((notifications) =>
            notifications.map((n) => (n.id === id ? { ...n, ...updates } : n))
        );
    }
};

// Helper functions for common notification types
export function showSuccess(message: string, options: Partial<Omit<Notification, 'id' | 'type' | 'message'>> = {}) {
    return notifications.add({
        type: 'success',
        message,
        autoClose: 5000,
        ...options
    });
}

export function showError(message: string, options: Partial<Omit<Notification, 'id' | 'type' | 'message'>> = {}) {
    return notifications.add({
        type: 'error',
        message,
        dismissible: true,
        ...options
    });
}

export function showInfo(message: string, options: Partial<Omit<Notification, 'id' | 'type' | 'message'>> = {}) {
    return notifications.add({
        type: 'info',
        message,
        autoClose: 5000,
        ...options
    });
}

export function showLoading(message: string, options: Partial<Omit<Notification, 'id' | 'type' | 'message'>> = {}) {
    return notifications.add({
        type: 'loading',
        message,
        dismissible: false,
        ...options
    });
} 