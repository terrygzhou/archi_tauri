import React from 'react';
import { useUIStore, NotificationItem } from '../../stores/uiStore';

// ============================================================================
// Notification banner component
// ============================================================================

export interface NotificationBannerProps {
  className?: string;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  className = '',
}) => {
  const { notifications, dismissNotification, clearNotifications } = useUIStore();

  if (notifications.length === 0) return null;

  return (
    <div className={`notification-banner ${className}`}>
      <div className="notification-header">
        <span className="notification-count">{notifications.length} notification{notifications.length > 1 ? 's' : ''}</span>
        <button className="btn-clear" onClick={clearNotifications}>
          Clear all
        </button>
      </div>
      <div className="notification-list">
        {notifications.map(notification => (
          <NotificationItemView
            key={notification.id}
            notification={notification}
            onDismiss={dismissNotification}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Notification item component
// ============================================================================
interface NotificationItemViewProps {
  notification: NotificationItem;
  onDismiss: (id: string) => void;
}

const NotificationItemView: React.FC<NotificationItemViewProps> = ({
  notification,
  onDismiss,
}) => {
  const icon = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  }[notification.type];

  return (
    <div className={`notification-item notification-${notification.type}`}>
      <span className="notification-icon">{icon}</span>
      <div className="notification-content">
        <span className="notification-title">{notification.title}</span>
        <span className="notification-message">{notification.message}</span>
      </div>
      <button
        className="notification-dismiss"
        onClick={() => onDismiss(notification.id)}
      >
        ✕
      </button>
    </div>
  );
};
