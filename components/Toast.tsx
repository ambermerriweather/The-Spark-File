
import React, { useEffect, useState } from 'react';
import { useToast } from '../hooks/useToast';
import type { ToastMessage } from '../types';

const Toast: React.FC<{ toast: ToastMessage; onDismiss: (id: number) => void }> = ({ toast, onDismiss }) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Fade in
        const showTimeout = setTimeout(() => setShow(true), 100);

        // Start fade out process
        const hideTimeout = setTimeout(() => {
            setShow(false);
            // Remove from DOM after transition
            const removeTimeout = setTimeout(() => onDismiss(toast.id), 500);
            return () => clearTimeout(removeTimeout);
        }, 3000);

        return () => {
            clearTimeout(showTimeout);
            clearTimeout(hideTimeout);
        };
    }, [toast.id, onDismiss]);

    const bgColor = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
        warning: 'bg-yellow-500',
    }[toast.type];

    return (
        <div className={`toast ${bgColor} ${show ? 'show' : ''}`}>
            {toast.message}
        </div>
    );
};


export const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useToast();

    return (
        <div id="toast-container" className="fixed bottom-4 right-4 z-[100] space-y-2">
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
            ))}
        </div>
    );
};
