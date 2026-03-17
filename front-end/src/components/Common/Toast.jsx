import React, { useState, useEffect, useCallback } from "react";
import "./Toast.css";

const Toast = () => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    useEffect(() => {
        const handleShowToast = (event) => {
            const { message, type = "info", duration = 3000 } = event.detail;
            const id = Date.now();

            setToasts((prev) => [...prev, { id, message, type }]);

            setTimeout(() => {
                removeToast(id);
            }, duration);
        };

        window.addEventListener("toast:show", handleShowToast);
        return () => window.removeEventListener("toast:show", handleShowToast);
    }, [removeToast]);

    return (
        <div className="toast-container">
            {toasts.map((toast) => (
                <div key={toast.id} className={`toast-item ${toast.type}`} onClick={() => removeToast(toast.id)}>
                    <div className="toast-icon">
                        {toast.type === "success" && "✓"}
                        {toast.type === "error" && "✕"}
                        {toast.type === "warning" && "⚠"}
                        {toast.type === "info" && "ℹ"}
                    </div>
                    <div className="toast-message">{toast.message}</div>
                </div>
            ))}
        </div>
    );
};

// Helper function to trigger toast from anywhere
export const showToast = (message, type = "info", duration = 3000) => {
    const event = new CustomEvent("toast:show", {
        detail: { message, type, duration },
    });
    window.dispatchEvent(event);
};

export default Toast;
