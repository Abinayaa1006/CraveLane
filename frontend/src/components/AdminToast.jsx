
import React, { useEffect, useState } from "react";

let notificationId = 0;

export function notifyAdmin(message, type = "success") {
    window.dispatchEvent(
        new CustomEvent("admin-notification", {
            detail: {
                id: ++notificationId,
                message,
                type
            }
        })
    );
}

export default function AdminToast() {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const handleNotification = (event) => {
            const notification = event.detail;

            setNotifications(previous => [
                ...previous,
                notification
            ]);

            window.setTimeout(() => {
                setNotifications(previous =>
                    previous.filter(item => item.id !== notification.id)
                );
            }, 3500);
        };

        window.addEventListener(
            "admin-notification",
            handleNotification
        );

        return () => {
            window.removeEventListener(
                "admin-notification",
                handleNotification
            );
        };
    }, []);

    const dismiss = (id) => {
        setNotifications(previous =>
            previous.filter(item => item.id !== id)
        );
    };

    return (
        <div className="admin-toast-container" aria-live="polite">
            {notifications.map(notification => {
                const isSuccess = notification.type === "success";

                return (
                    <div
                        key={notification.id}
                        className={`admin-toast ${
                            isSuccess
                                ? "admin-toast-success"
                                : "admin-toast-error"
                        }`}
                        role={isSuccess ? "status" : "alert"}
                    >
                        <span className="admin-toast-icon">
                            {isSuccess ? "✓" : "!"}
                        </span>

                        <span className="admin-toast-message">
                            {notification.message}
                        </span>

                        <button
                            type="button"
                            className="admin-toast-close"
                            onClick={() => dismiss(notification.id)}
                            aria-label="Dismiss notification"
                        >
                            ×
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
