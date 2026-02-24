import React, { useState, useRef } from 'react';
import { X, Upload, Send, AlertTriangle, Check } from 'lucide-react';
import { Ticket } from '../types';

interface TicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    context: string;
    userId: string;
    username: string;
}

export function TicketModal({ isOpen, onClose, context, userId, username }: TicketModalProps) {
    const [category, setCategory] = useState<'technical' | 'edit' | 'visual' | 'other'>('other');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim()) return;

        setIsSubmitting(true);

        // Simulate network delay
        setTimeout(() => {
            const newTicket: Ticket = {
                id: crypto.randomUUID(),
                userId,
                username,
                timestamp: Date.now(),
                description,
                context,
                category,
                attachmentUrl: image || undefined,
                status: 'open'
            };

            const storedTickets = localStorage.getItem('support_tickets');
            const tickets: Ticket[] = storedTickets ? JSON.parse(storedTickets) : [];
            tickets.push(newTicket);
            localStorage.setItem('support_tickets', JSON.stringify(tickets));

            setIsSubmitting(false);
            setSuccess(true);

            // Auto close after success
            setTimeout(() => {
                setSuccess(false);
                setDescription('');
                setImage(null);
                setCategory('other');
                onClose();
            }, 2000);
        }, 1000);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-background border border-border rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-orange-500" />
                        Report an Issue
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {success ? (
                    <div className="text-center py-12 animate-in fade-in zoom-in">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">Ticket Submitted!</h3>
                        <p className="text-muted-foreground">Thank you for your feedback. We'll look into it.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">


                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'technical', label: 'Technical Error' },
                                    { id: 'edit', label: 'Suggested Edit' },
                                    { id: 'visual', label: 'Visual Problem' },
                                    { id: 'other', label: 'Other' }
                                ].map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setCategory(cat.id as any)}
                                        className={`p-2 rounded-lg border text-sm transition-all ${category === cat.id
                                            ? 'bg-primary/10 border-primary text-primary font-bold'
                                            : 'bg-background border-input hover:bg-secondary'
                                            }`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                            <textarea
                                required
                                className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none h-32"
                                placeholder="Describe the issue you're facing..."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Screenshot (Optional)</label>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-3 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary/50 hover:bg-secondary/50 transition-all flex flex-col items-center justify-center gap-2"
                            >
                                {image ? (
                                    <>
                                        <img src={image} alt="Preview" className="h-16 object-contain rounded" />
                                        <span className="text-xs text-primary">Click to change</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-6 h-6 opacity-50" />
                                        <span className="text-sm">Click to upload image</span>
                                    </>
                                )}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || !description.trim()}
                            className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <span className="animate-pulse">Sending...</span>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Submit Ticket
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
