import React, { useEffect, useState } from 'react';
import { X, CheckCircle, Info } from 'lucide-react';

export interface ToastProps {
    message: string;
    actionLabel?: string;
    onAction?: () => void;
    onClose: () => void;
    duration?: number;
    type?: 'success' | 'info';
}

export const Toast: React.FC<ToastProps> = ({ message, actionLabel, onAction, onClose, duration = 3000, type = 'success' }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Wait for fade out
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const handleAction = () => {
        if (onAction) onAction();
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    return (
        <div className={`
            fixed bottom-6 left-1/2 -translate-x-1/2 z-[200]
            flex items-center gap-4 px-4 py-3 rounded-full shadow-2xl border
            transition-all duration-300 transform
            ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}
            ${type === 'success' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-blue-600 border-blue-500 text-white'}
        `}>
            <div className={`p-1 rounded-full ${type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-white/20 text-white'}`}>
                {type === 'success' ? <CheckCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
            </div>

            <span className="font-medium text-sm">{message}</span>

            {actionLabel && (
                <button
                    onClick={handleAction}
                    className="ml-2 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors"
                >
                    {actionLabel}
                </button>
            )}

            <button onClick={() => { setIsVisible(false); setTimeout(onClose, 300); }} className="ml-1 opacity-60 hover:opacity-100 transition-opacity">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};
