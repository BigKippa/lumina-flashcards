import React from 'react';
import { X, Info } from 'lucide-react';

export interface InfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    creatorUsername?: string;
    createdAt?: number;
    viewCount?: number;
    downloadCount?: number;
    languageCategory?: string;
}

export const InfoModal: React.FC<InfoModalProps> = ({
    isOpen,
    onClose,
    title,
    creatorUsername,
    createdAt,
    viewCount,
    downloadCount,
    languageCategory
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div 
                className="w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" 
                onClick={e => e.stopPropagation()}
            >
                <div className="bg-primary/10 p-4 flex items-center justify-between border-b border-border/50">
                    <div className="flex items-center gap-2 text-foreground font-bold">
                        <Info className="w-5 h-5 text-primary" />
                        <span>{title} Info</span>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-muted-foreground">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 space-y-4 text-sm text-foreground">
                    <div className="flex justify-between items-center border-b border-border/30 pb-2">
                        <span className="text-muted-foreground font-medium">Creator</span>
                        <span className="font-semibold">{creatorUsername || 'System'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-border/30 pb-2">
                        <span className="text-muted-foreground font-medium">Created</span>
                        <span className="font-semibold">{createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-border/30 pb-2">
                        <span className="text-muted-foreground font-medium">Views</span>
                        <span className="font-semibold">{viewCount || 0}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-border/30 pb-2">
                        <span className="text-muted-foreground font-medium">Downloads</span>
                        <span className="font-semibold">{downloadCount || 0}</span>
                    </div>
                    <div className="flex justify-between items-center pb-1">
                        <span className="text-muted-foreground font-medium">Language</span>
                        <span className="font-semibold">{languageCategory || 'General'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
