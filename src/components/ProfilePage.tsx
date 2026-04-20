import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ContactDetail, TutorProfileData } from '../types';
import {
    Book, Pencil, Check, X, AlertCircle, Eye, EyeOff, Mail, RefreshCcw, Lock, KeyRound,
    User, MapPin, Briefcase, Heart, Globe, Clock, Activity, Settings, Shield, UserSquare2, Upload, Trash2, Phone, Locate, Loader2, Camera, CheckCircle2, XCircle, Move, UserCircle, BookOpen
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { generateVerificationCode, simulateSendEmail, simulateSendSMS } from '../utils/mockEmailService';
import { countryCodes, findCountryByCode, getDefaultCountryCode } from '../utils/countryCodes';

interface ProfilePageProps {
    user: UserProfile;
    onManageDeck: () => void;
    onBack: () => void;
    onUpdateProfile: (oldUsername: string, newUserData: Partial<UserProfile>) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
    initialEditMode?: boolean;
    onLogout?: () => void;
    onDeleteAccount?: () => void;
    onOpenSettings?: () => void;
    initialScrollTarget?: string | null;
}

// --- Helper Types ---
interface TabButtonProps {
    id: 'basic' | 'learning' | 'account' | 'tutor';
    activeTab: 'basic' | 'learning' | 'account' | 'tutor';
    setActiveTab: (tab: 'basic' | 'learning' | 'account' | 'tutor') => void;
    label: string;
    icon: any;
}

interface SectionProps {
    title: string;
    icon: any;
    children: React.ReactNode;
    colorTheme?: 'default' | 'primary' | 'secondary' | 'accent' | 'muted';
    isEditing?: boolean;
    onSave?: () => void;
    id?: string; // Add id for sortable
    dragHandleProps?: any; // Allow injecting drag listeners
    isCustomizeMode?: boolean;
}

interface FieldProps {
    label: string;
    value: string;
    fieldKey: string;
    icon?: any;
    placeholder?: string;
    helperText?: string;
    isEditing: boolean;
    setEditForm: React.Dispatch<React.SetStateAction<any>>;
    stepNumber?: number;
}

interface TextAreaProps {
    label: string;
    value: string;
    fieldKey: string;
    placeholder?: string;
    isEditing: boolean;
    setEditForm: React.Dispatch<React.SetStateAction<any>>;
    stepNumber?: number;
}

interface SelectFieldProps {
    label: string;
    value: string;
    fieldKey: string;
    options: { label: string; value: string }[];
    icon?: any;
    placeholder?: string;
    isEditing: boolean;
    setEditForm: React.Dispatch<React.SetStateAction<any>>;
    stepNumber?: number;
}

// --- Constants ---
const TIMEZONE_OPTIONS = [
    { label: "Pacific Time (US & Canada)", value: "America/Los_Angeles" },
    { label: "Mountain Time (US & Canada)", value: "America/Denver" },
    { label: "Central Time (US & Canada)", value: "America/Chicago" },
    { label: "Eastern Time (US & Canada)", value: "America/New_York" },
    { label: "London", value: "Europe/London" },
    { label: "Paris", value: "Europe/Paris" },
    { label: "Berlin", value: "Europe/Berlin" },
    { label: "Tokyo", value: "Asia/Tokyo" },
    { label: "Seoul", value: "Asia/Seoul" },
    { label: "Sydney", value: "Australia/Sydney" },
    { label: "Dubai", value: "Asia/Dubai" },
    { label: "Sao Paulo", value: "America/Sao_Paulo" },
];
const TabButton = ({ id, activeTab, setActiveTab, label, icon: Icon }: TabButtonProps) => (
    <button
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === id
            ? 'border-primary text-primary font-bold'
            : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
    >
        <Icon className="w-4 h-4" />
        <span className="hidden sm:inline">{label}</span>
    </button>
);

const Section = ({ title, icon: Icon, children, colorTheme = 'default', isEditing, onSave, dragHandleProps, isCustomizeMode }: SectionProps) => {
    let bgClass = "bg-color1 text-color1-foreground";
    let borderClass = "border-color2 shadow-sm";
    let iconClass = "text-color1-foreground opacity-70";
    let btnClass = "bg-color5 text-color5-foreground border hover:bg-color5/90";

    if (colorTheme === 'primary') {
        bgClass = "bg-color2 text-color2-foreground";
        borderClass = "border-color3 shadow-md";
        iconClass = "text-color2-foreground opacity-70";
        btnClass = "bg-color5 text-color5-foreground border hover:bg-color5/90";
    } else if (colorTheme === 'secondary') {
        bgClass = "bg-color3 text-color3-foreground";
        borderClass = "border-color4 shadow-md";
        iconClass = "text-color3-foreground opacity-70";
        btnClass = "bg-color5 text-color5-foreground border hover:bg-color5/90";
    } else if (colorTheme === 'accent') {
        bgClass = "bg-color4 text-color4-foreground";
        borderClass = "border-color5 shadow-md";
        iconClass = "text-color4-foreground opacity-70";
        btnClass = "bg-color1 text-color1-foreground border hover:bg-color1/90";
    } else if (colorTheme === 'muted') {
        bgClass = "bg-color5 text-color5-foreground";
        borderClass = "border-color1 shadow-sm";
        iconClass = "text-color5-foreground opacity-70";
        btnClass = "bg-color1 text-color1-foreground border hover:bg-color1/90";
    }

    return (
        <div className={`${bgClass} p-6 rounded-xl border-2 ${borderClass} mb-6 transition-colors h-full flex flex-col relative`}>
             {/* Drag Handle Layer - Absolute position top right if in customize mode */}
             {isCustomizeMode && dragHandleProps && (
                <div 
                    {...dragHandleProps}
                    className="absolute top-4 right-4 p-2 cursor-grab active:cursor-grabbing hover:bg-black/10 rounded-md transition-colors z-20 text-inherit opacity-50 hover:opacity-100"
                    title="Drag to reorder"
                >
                    <Move className="w-5 h-5" />
                </div>
            )}

            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isCustomizeMode ? 'pr-10' : ''}`}>
                <Icon className={`w-5 h-5 ${iconClass}`} /> {title}
            </h3>
            <div className={`space-y-4 flex-1`}>
                {children}
            </div>
            {isEditing && onSave && (
                <div className="mt-6 flex justify-end">
                    <button onClick={onSave} className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-offset-background ${btnClass}`}>
                        <Check className="w-4 h-4" /> Save
                    </button>
                </div>
            )}
        </div>
    );
};

// Sortable Wrapper wrapper for Section components
function SortableSection({ id, children, isCustomizeMode }: { id: string, children: React.ReactElement, isCustomizeMode: boolean }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        position: 'relative' as const,
    };

    // Inject the dragHandleProps into the child Section
    const enhancedChild = React.cloneElement(children, {
        dragHandleProps: { ...attributes, ...listeners },
        isCustomizeMode
    });

    return (
        <div ref={setNodeRef} style={style} className={`h-full ${isDragging ? 'opacity-50 ring-2 ring-primary rounded-xl scale-[1.02] shadow-2xl transition-all' : ''}`}>
            {enhancedChild}
        </div>
    );
}

const SelectField = ({ label, value, fieldKey, options, icon: Icon, placeholder, isEditing, setEditForm, required = false, stepNumber, helperText }: SelectFieldProps & { required?: boolean; stepNumber?: number; helperText?: string }) => (
    <div className="w-full">
        <label className="text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1">
            {stepNumber && <span className="text-primary mr-1">Step {stepNumber}:</span>}
            {label.replace(/^\*\s*/, '')}
            {isEditing && required && (
                !value ? (
                    <XCircle className="w-3.5 h-3.5 text-destructive" />
                ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                )
            )}
        </label>
        {isEditing ? (
            <div className="relative">
                {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />}
                <select
                    value={value}
                    onChange={e => setEditForm((prev: any) => ({ ...prev, [fieldKey]: e.target.value }))}
                    className={`w-full p-2 rounded-md border ${required && !value ? 'border-destructive ring-1 ring-destructive/50' : 'border-input'} bg-background ${Icon ? 'pl-9' : ''} text-sm transition-all`}
                >
                    <option value="" disabled>{placeholder || `Select ${label.toLowerCase()}`}</option>
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                {helperText && <p className="text-[10px] text-muted-foreground mt-1.5 leading-tight">{helperText}</p>}
            </div>
        ) : (
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md min-h-[38px] text-sm">
                    {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
                    <span className={!value ? 'text-muted-foreground italic' : ''}>{
                        options.find(o => o.value === value)?.label || value || 'Not set'
                    }</span>
                </div>
                {helperText && <p className="text-[10px] text-muted-foreground/70 leading-tight">{helperText}</p>}
            </div>
        )}
    </div>
);

const Field = ({ label, value, fieldKey, icon: Icon, placeholder, helperText, isEditing, setEditForm, required = false, stepNumber }: FieldProps & { required?: boolean; stepNumber?: number }) => (
    <div className="w-full">
        <label className="text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1">
            {stepNumber && <span className="text-primary mr-1">Step {stepNumber}:</span>}
            {label.replace(/^\*\s*/, '')}
            {isEditing && required && (
                !value ? (
                    <XCircle className="w-3.5 h-3.5 text-destructive" />
                ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                )
            )}
        </label>
        {isEditing ? (
            <div className="relative">
                {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />}
                <input
                    type="text"
                    value={value}
                    onChange={e => setEditForm((prev: any) => ({ ...prev, [fieldKey]: e.target.value }))}
                    placeholder={placeholder || `Enter ${label.toLowerCase()}`}
                    className={`w-full p-2 rounded-md border ${required && !value ? 'border-destructive ring-1 ring-destructive/50' : 'border-input'} bg-background ${Icon ? 'pl-9' : ''} text-sm transition-all`}
                />
                {helperText && <p className="text-[10px] text-muted-foreground mt-1.5 leading-tight">{helperText}</p>}
            </div>
        ) : (
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md min-h-[38px] text-sm">
                    {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
                    <span className={!value ? 'text-muted-foreground italic' : ''}>{value || 'Not set'}</span>
                </div>
                {helperText && <p className="text-[10px] text-muted-foreground/70 leading-tight">{helperText}</p>}
            </div>
        )}
    </div>
);

const TextArea = ({ label, value, fieldKey, placeholder, isEditing, setEditForm, required = false, stepNumber }: TextAreaProps & { required?: boolean; stepNumber?: number }) => (
    <div className="w-full">
        <label className="text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1">
            {stepNumber && <span className="text-primary mr-1">Step {stepNumber}:</span>}
            {label.replace(/^\*\s*/, '')}
            {isEditing && required && (
                !value ? (
                    <XCircle className="w-3.5 h-3.5 text-destructive" />
                ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                )
            )}
        </label>
        {isEditing ? (
            <textarea
                value={value}
                onChange={e => setEditForm((prev: any) => ({ ...prev, [fieldKey]: e.target.value }))}
                placeholder={placeholder || `Enter ${label.toLowerCase()}`}
                className={`w-full p-2 rounded-md border ${required && !value ? 'border-destructive ring-1 ring-destructive/50' : 'border-input'} bg-background text-sm min-h-[100px] resize-y transition-all`}
            />
        ) : (
            <div className="p-3 bg-muted/50 rounded-md min-h-[60px] whitespace-pre-wrap text-sm">
                <span className={!value ? 'text-muted-foreground italic' : ''}>{value || 'No notes.'}</span>
            </div>
        )}
    </div>
);

interface ContactListEditorProps {
    type: 'email' | 'phone';
    contacts: ContactDetail[];
    setContacts: (contacts: ContactDetail[]) => void;
    isEditing: boolean;
    icon: any;
}

const ContactListEditor = ({ type, contacts, setContacts, isEditing, icon: Icon }: ContactListEditorProps) => {
    const labelOptions = type === 'email'
        ? ['Personal', 'Work', 'Other', 'Custom']
        : ['Personal', 'Work', 'SMS', 'Other', 'Custom'];

    const handleAdd = () => {
        setContacts([...contacts, { 
            id: Date.now().toString(), 
            value: '', 
            label: labelOptions[0], 
            isCustomLabel: false, 
            isRecovery: contacts.length === 0,
            ...(type === 'email' ? { allCommunications: true, essentialOnly: false } : {})
        }]);
    };

    const handleUpdate = (id: string, updates: Partial<ContactDetail>) => {
        setContacts(contacts.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    const handleRemove = (id: string) => {
        const newContacts = contacts.filter(c => c.id !== id);
        // Ensure at least one recovery remains if any contacts exist
        if (newContacts.length > 0 && !newContacts.some(c => c.isRecovery)) {
            newContacts[0].isRecovery = true;
        }
        setContacts(newContacts);
    };

    const handleSetRecovery = (id: string) => {
        setContacts(contacts.map(c => ({ ...c, isRecovery: c.id === id })));
    };

    if (!isEditing) {
        if (contacts.length === 0) return (
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md min-h-[38px] text-sm">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground italic">No {type}s linked</span>
            </div>
        );

        return (
            <div className="space-y-2">
                {contacts.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm border border-transparent">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="truncate" title={c.value}>{c.value}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs bg-secondary/80 px-2 py-0.5 rounded text-secondary-foreground">{c.label}</span>
                            {c.isRecovery && (
                                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20 font-medium uppercase tracking-wider" title={`Recovery ${type}`}>Recovery</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {contacts.map((c) => {
                const isPhone = type === 'phone';
                const currentCountry = isPhone ? (findCountryByCode(c.value) || getDefaultCountryCode()) : null;

                return (
                    <div key={c.id} className="p-3 bg-secondary/20 border border-border rounded-lg space-y-3 relative group">
                        <div className="flex gap-2">
                            {isPhone && (
                                <div className="relative flex items-center">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                                        {currentCountry?.flag || '🌐'}
                                    </span>
                                    <select
                                        value={currentCountry?.code || ''}
                                        onChange={(e) => {
                                            const newCode = e.target.value;
                                            const oldCodeMatch = findCountryByCode(c.value);
                                            let newVal = c.value;
                                            if (oldCodeMatch && c.value.startsWith(oldCodeMatch.code)) {
                                                newVal = c.value.replace(oldCodeMatch.code, newCode);
                                            } else if (!c.value.startsWith('+')) {
                                                newVal = newCode + ' ' + c.value;
                                            } else {
                                                newVal = newCode + ' ' + newVal.replace(/^\+\d+\s*/, '');
                                            }
                                            handleUpdate(c.id, { value: newVal });
                                        }}
                                        className="w-[100px] py-2 pl-9 pr-2 rounded-md border border-input bg-background/50 focus:bg-background text-sm text-foreground focus:border-primary transition-colors cursor-pointer"
                                        title="Change country code"
                                    >
                                        {countryCodes.map(country => (
                                            <option key={country.iso} value={country.code}>
                                                {country.flag} {country.code}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="flex-1 relative">
                                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type={type === 'email' ? 'email' : 'tel'}
                                    value={c.value}
                                    onChange={e => {
                                        let val = e.target.value;
                                        if (type === 'phone') {
                                            val = val.replace(/[^0-9\s()+-]/g, '');
                                        }
                                        handleUpdate(c.id, { value: val });
                                    }}
                                    placeholder={`Enter ${type}`}
                                    className="w-full py-2 pl-9 pr-2 rounded-md border border-input bg-background text-sm focus:border-primary placeholder:text-muted-foreground/50"
                                />
                            </div>
                            <button
                                onClick={() => handleRemove(c.id)}
                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors shrink-0"
                                title="Remove"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex gap-2">
                            <select
                                value={c.isCustomLabel ? 'Custom' : c.label}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === 'Custom') {
                                        handleUpdate(c.id, { isCustomLabel: true, label: '' });
                                    } else {
                                        handleUpdate(c.id, { isCustomLabel: false, label: val });
                                    }
                                }}
                                className="w-1/3 p-2 rounded-md border border-input bg-background text-sm text-foreground overflow-hidden text-ellipsis"
                            >
                                {labelOptions.map((opt: string, _index) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>

                            {c.isCustomLabel && (
                                <input
                                    type="text"
                                    value={c.label}
                                    onChange={e => handleUpdate(c.id, { label: e.target.value })}
                                    placeholder="Custom label"
                                    className="flex-1 p-2 rounded-md border border-input bg-background text-sm focus:border-primary"
                                    autoFocus
                                />
                            )}
                        </div>

                        <div className="flex flex-col gap-2 w-full mt-3">

                            {contacts.length > 1 && (
                                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer group/label w-fit">
                                    <input
                                        type="radio"
                                        name={`recovery-${type}`}
                                        checked={c.isRecovery}
                                        onChange={() => handleSetRecovery(c.id)}
                                        className="accent-primary"
                                    />
                                    <span className="group-hover/label:text-foreground transition-colors">Set as Recovery {type === 'email' ? 'Email' : 'Phone'}</span>
                                </label>
                            )}

                            {type === 'phone' && (
                                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer group/label w-fit mt-1">
                                    <input
                                        type="checkbox"
                                        checked={!!c.canReceiveSms}
                                        onChange={(e) => handleUpdate(c.id, { canReceiveSms: e.target.checked })}
                                        className="accent-primary rounded"
                                    />
                                    <span className="group-hover/label:text-foreground transition-colors">Can receive SMS messages</span>
                                </label>
                            )}
                            
                            {type === 'email' && (
                                <>
                                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer group/label w-fit mt-1">
                                        <input
                                            type="checkbox"
                                            checked={!!c.allCommunications}
                                            onChange={(e) => handleUpdate(c.id, { allCommunications: e.target.checked, essentialOnly: e.target.checked ? false : c.essentialOnly })}
                                            className="accent-primary rounded"
                                        />
                                        <span className="group-hover/label:text-foreground transition-colors max-w-[280px] sm:max-w-none leading-tight">All Communications (account recovery, marketing, user communications, etc.)</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer group/label w-fit mt-1">
                                        <input
                                            type="checkbox"
                                            checked={!!c.essentialOnly}
                                            onChange={(e) => handleUpdate(c.id, { essentialOnly: e.target.checked, allCommunications: e.target.checked ? false : c.allCommunications })}
                                            className="accent-primary rounded"
                                        />
                                        <span className="group-hover/label:text-foreground transition-colors leading-tight">Essential Only (Account recovery)</span>
                                    </label>
                                </>
                            )}
                        </div>
                    </div>
                );
            })}

            {type === 'phone' && (
                <div className="text-[10px] text-muted-foreground/70 leading-tight italic px-1">
                    *Some service providers may charge for SMS messages. Lumina is not responsible for any charges incurred for SMS messages by the user.
                </div>
            )}

            <button
                onClick={handleAdd}
                className="w-full py-2 border border-dashed border-input rounded-lg text-sm text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors flex items-center justify-center gap-2"
            >
                <div className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold leading-none">+</div>
                Add {type === 'email' ? 'Email' : 'Phone Number'}
            </button>
        </div>
    );
};

function TagsInput({
    label,
    tags,
    setTags,
    isEditing,
    placeholder = "Add tag...",
    required = false
}: {
    label: string;
    tags: string[];
    setTags: (tags: string[]) => void;
    isEditing: boolean;
    placeholder?: string;
    required?: boolean;
}) {
    const [inputValue, setInputValue] = useState("");

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            e.preventDefault();
            if (!tags.includes(inputValue.trim())) {
                setTags([...tags, inputValue.trim()]);
            }
            setInputValue("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <div className="space-y-2 w-full">
            <label className="text-xs font-bold text-muted-foreground uppercase">
                {label.replace(/^\*\s*/, '')} {isEditing && <span className="lowercase font-normal">({required ? 'required' : 'optional'})</span>}
            </label>
            <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full border border-primary/20">
                        {tag}
                        {isEditing && (
                            <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors rounded-full p-0.5" title="Remove">
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </span>
                ))}
                {!isEditing && tags.length === 0 && (
                    <span className="text-sm text-muted-foreground italic">None specified</span>
                )}
            </div>
            {isEditing && (
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-full mt-2 p-2 rounded bg-secondary/50 border border-border focus:border-primary outline-none text-sm"
                />
            )}
        </div>
    );
}

function EducationEditor({ education, setEducation, isEditing, required = false }: {
    education: { degree: string, institution: string }[];
    setEducation: (edu: { degree: string, institution: string }[]) => void;
    isEditing: boolean;
    required?: boolean;
}) {
    const [degree, setDegree] = useState("");
    const [institution, setInstitution] = useState("");

    const handleAdd = () => {
        if (degree.trim() && institution.trim()) {
            setEducation([...education, { degree: degree.trim(), institution: institution.trim() }]);
            setDegree("");
            setInstitution("");
        }
    };

    const removeEdu = (index: number) => {
        setEducation(education.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4 w-full">
            <label className="text-xs font-bold text-muted-foreground uppercase">
                Education {isEditing && <span className="lowercase font-normal">({required ? 'required' : 'optional'})</span>}
            </label>
            {education.length === 0 && !isEditing && (
                <div className="text-sm text-muted-foreground italic">No education provided.</div>
            )}
            {education.map((edu, index) => (
                <div key={index} className="flex justify-between items-center bg-secondary/30 p-3 rounded-lg border border-border">
                    <div>
                        <div className="font-semibold text-foreground text-sm">{edu.degree}</div>
                        <div className="text-xs text-muted-foreground">{edu.institution}</div>
                    </div>
                    {isEditing && (
                        <button type="button" onClick={() => removeEdu(index)} className="text-muted-foreground hover:text-destructive p-2" title="Remove">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            ))}
            {isEditing && (
                <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-2">
                        <input
                            type="text"
                            value={degree}
                            onChange={(e) => setDegree(e.target.value)}
                            placeholder="Degree/Certificate"
                            className="w-full p-2 rounded bg-secondary/50 border border-border focus:border-primary outline-none text-sm"
                        />
                        <input
                            type="text"
                            value={institution}
                            onChange={(e) => setInstitution(e.target.value)}
                            placeholder="Institution"
                            className="w-full p-2 rounded bg-secondary/50 border border-border focus:border-primary outline-none text-sm"
                        />
                    </div>
                    <button type="button" onClick={handleAdd} className="p-2 mb-1 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm font-bold h-10 w-16">
                        Add
                    </button>
                </div>
            )}
        </div>
    );
}

function LanguageLevelEditor({ languages, setLanguages, isEditing, label = "Other Languages Spoken", required = false }: {
    languages: { language: string, level: string }[];
    setLanguages: (langs: { language: string, level: string }[]) => void;
    isEditing: boolean;
    label?: string;
    required?: boolean;
}) {
    const [language, setLanguage] = useState("");
    const [level, setLevel] = useState("");

    const handleAdd = () => {
        if (language.trim() && level) {
            setLanguages([...languages, { language: language.trim(), level }]);
            setLanguage("");
            setLevel("");
        }
    };

    const removeLang = (index: number) => {
        setLanguages(languages.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4 w-full">
            <label className="text-xs font-bold text-muted-foreground uppercase">
                {label.replace(/^\*\s*/, '')} {isEditing && <span className="lowercase font-normal">({required ? 'required' : 'optional'})</span>}
            </label>
            {languages.length === 0 && !isEditing && (
                <div className="text-sm text-muted-foreground italic">None specified.</div>
            )}
            {languages.map((lang, index) => (
                <div key={index} className="flex justify-between items-center bg-secondary/30 p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                        <div className="font-semibold text-foreground text-sm">{lang.language}</div>
                        <div className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold">{lang.level}</div>
                    </div>
                    {isEditing && (
                        <button type="button" onClick={() => removeLang(index)} className="text-muted-foreground hover:text-destructive p-2" title="Remove">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            ))}
            {isEditing && (
                <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-2">
                        <input
                            type="text"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            placeholder="Language"
                            className="w-full p-2 rounded bg-secondary/50 border border-border focus:border-primary outline-none text-sm"
                        />
                        <select
                            value={level}
                            onChange={(e) => setLevel(e.target.value)}
                            className="w-full p-2 rounded bg-secondary/50 border border-border focus:border-primary outline-none text-sm"
                        >
                            <option value="" disabled>Select Level</option>
                            <option value="A1">A1 - Beginner</option>
                            <option value="A2">A2 - Elementary</option>
                            <option value="B1">B1 - Intermediate</option>
                            <option value="B2">B2 - Upper Intermediate</option>
                            <option value="C1">C1 - Advanced</option>
                            <option value="C2">C2 - Mastery / Native</option>
                        </select>
                    </div>
                    <button type="button" onClick={handleAdd} className="p-2 mb-1 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm font-bold h-10 w-16">
                        Add
                    </button>
                </div>
            )}
        </div>
    );
}

export function ProfilePage({ user, onManageDeck, onBack, onUpdateProfile, showToast, initialEditMode = false, onLogout, onDeleteAccount, onOpenSettings, initialScrollTarget }: ProfilePageProps) {
    const [isEditing, setIsEditing] = useState(initialEditMode);
    const [activeTab, setActiveTab] = useState<'basic' | 'learning' | 'account' | 'tutor'>('basic');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (initialScrollTarget) {
            setActiveTab('basic');
            setIsEditing(true); // Open edit mode to make them editable immediately
            // Allow time for render
            setTimeout(() => {
                const el = document.getElementById(initialScrollTarget);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    }, [initialScrollTarget]);

    useEffect(() => {
        // Auto-populate timezone if it's empty and we're editing (or creating)
        if (isEditing && !editForm.timeZone) {
            try {
                const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                if (tz) {
                    setEditForm(prev => ({ ...prev, timeZone: tz }));
                }
            } catch (e) {
                console.warn("Could not auto-detect timezone", e);
            }
        }
    }, [isEditing]);

    // Expanded Edit Form State

    const calculateAge = (dobString: string | undefined): string => {
        if (!dobString) return '';
        const dob = new Date(dobString);
        if (isNaN(dob.getTime())) return '';
        const diffMs = Date.now() - dob.getTime();
        const ageDt = new Date(diffMs);
        return Math.abs(ageDt.getUTCFullYear() - 1970).toString();
    };

    const calculateMemberSince = (createdString: string | undefined): string => {
        if (!createdString) return 'Unknown';
        const date = new Date(createdString);
        if (isNaN(date.getTime())) return 'Unknown';
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    };

    // Helper to migrate legacy single strings to arrays silently during initial edit form load
    const initializeEmails = (): ContactDetail[] => {
        if (user.emails && user.emails.length > 0) {
            return user.emails.map(e => ({
                ...e, 
                allCommunications: e.allCommunications !== undefined ? e.allCommunications : true, 
                essentialOnly: e.essentialOnly !== undefined ? e.essentialOnly : false
            }));
        }
        if (user.email) return [{ id: 'legacy-email', value: user.email, label: 'Personal', isCustomLabel: false, isRecovery: true, allCommunications: true, essentialOnly: false }];
        return [];
    };

    const initializePhones = (): ContactDetail[] => {
        if (user.phones && user.phones.length > 0) return user.phones;
        if (user.phone) return [{ id: 'legacy-phone', value: user.phone, label: 'Personal', isCustomLabel: false, isRecovery: true }];
        return [];
    };

    const [editForm, setEditForm] = useState({
        username: user.username,
        role: user.role || 'user',
        avatarUrl: user.avatarUrl || '',
        emails: initializeEmails(),
        phones: initializePhones(),

        // Unified Basic Info
        title: user.title || '',
        previousLocations: user.previousLocations || [],
        firstName: user.firstName || '',
        preferredName: user.preferredName || '',
        middleName: user.middleName || '',
        lastName: user.lastName || '',
        gender: user.gender || '',
        dateOfBirth: user.dateOfBirth || '',
        nativeLanguage: user.nativeLanguage || '',

        // Contact & Location Info
        timeZone: user.timeZone || '',
        originCity: user.originCity || '',
        originCountry: user.originCountry || '',
        currentCity: user.currentCity || '',
        currentCountry: user.currentCountry || '',
        profession: user.profession || '',
        interests: user.interests || '',

        // Learning Profile
        targetLanguage: user.targetLanguage || 'English',
        englishLevel: user.englishLevel || '',
        goals: user.goals || '',
        englishEnvironment: user.englishEnvironment || '',
        schedule: user.schedule || '',
        preferences: user.preferences || '',

        // Tutor Data
        tutorData: user.tutorData || {
            displayName: '',
            languagesTaught: [],
            proficiencyLevel: '',
            originType: '',
            otherLanguagesSpoken: [],
            placesLived: [],
            bio: '',
            education: [],
            teachingCertificates: [],
            teachingSkills: [],
            yearsExperience: 0,
            availabilityGrid: {},
            hourlyRate: 0,
            currency: 'USD',
            trialLessonAvailable: false
        } as TutorProfileData
    });

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- State: Drag and Drop Personalization ---
    const [isCustomizeMode, setIsCustomizeMode] = useState(false);
    
    // Default order configurations for each tab
    const DEFAULT_ORDER_BASIC = ['section-identity', 'section-contact', 'section-location', 'section-personal'];
    const DEFAULT_ORDER_LEARNING = ['section-languages', 'section-level', 'section-experience', 'section-preferences'];
    const DEFAULT_ORDER_ACCOUNT = ['section-security', 'section-flashcards', 'section-appsettings', 'section-danger'];

    // Map order configuration from user profile or fall back to default    // Helper to merge saved order with potentially new default tiles
    const mergeOrders = (savedOrder: string[] | undefined, defaultOrder: string[]) => {
        if (!savedOrder) return defaultOrder;
        const missing = defaultOrder.filter(id => !savedOrder.includes(id));
        return [...savedOrder, ...missing];
    };

    const [tileOrder, setTileOrder] = useState<Record<string, string[]>>({
        'basic': mergeOrders(user.profileTileOrder?.['basic'], DEFAULT_ORDER_BASIC),
        'learning': mergeOrders(user.profileTileOrder?.['learning'], DEFAULT_ORDER_LEARNING),
        'account': mergeOrders(user.profileTileOrder?.['account'], DEFAULT_ORDER_ACCOUNT)
    });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        
        if (over && active.id !== over.id) {
            setTileOrder((prev) => {
                const currentTabOrder = [...(prev[activeTab as keyof typeof prev] || [])];
                const oldIndex = currentTabOrder.indexOf(active.id as string);
                const newIndex = currentTabOrder.indexOf(over.id as string);
                
                const newOrder = arrayMove(currentTabOrder, oldIndex, newIndex);
                const updatedOrders = { ...prev, [activeTab]: newOrder };
                
                // Instantly save to profile
                 onUpdateProfile(user.username, { profileTileOrder: updatedOrders });
                 
                return updatedOrders;
            });
        }
    };

    // Email Verification State
    const [emailStep, setEmailStep] = useState<'idle' | 'verify-current' | 'enter-new' | 'verify-new'>('idle');
    const [verificationCode, setVerificationCode] = useState('');
    const [userEnteredCode, setUserEnteredCode] = useState('');
    const [isSendingCode, setIsSendingCode] = useState(false);
    const [tempNewEmail, setTempNewEmail] = useState('');

    // Password Change State
    const [passwordStep, setPasswordStep] = useState<'idle' | 'method-selection' | 'verify-old' | 'verify-email' | 'verify-phone' | 'set-new'>('idle');
    const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmNewPassword: '' });

    // Geolocation State
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);

    // Camera State
    const [isCameraActive, setIsCameraActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // --- Actions ---

    const handleSaveProfile = () => {
        setError(null);
        // Validation: If there are multiple contacts of a type, exactly one MUST be marked as recovery
        if (editForm.emails.length > 1 && editForm.emails.filter(e => e.isRecovery).length !== 1) {
            setError("You must select exactly one recovery email.");
            return;
        }
        if (editForm.phones.length > 1 && editForm.phones.filter(p => p.isRecovery).length !== 1) {
            setError("You must select exactly one recovery phone number.");
            return;
        }

        // Determine the canonical recovery contacts to sync back to the base model `email` and `phone`
        const recoveryEmail = editForm.emails.find(e => e.isRecovery)?.value || editForm.emails[0]?.value || '';
        const recoveryPhone = editForm.phones.find(p => p.isRecovery)?.value || editForm.phones[0]?.value || '';

        onUpdateProfile(user.username, {
            username: editForm.username,
            role: editForm.role as 'admin' | 'tutor' | 'user',
            avatarUrl: editForm.avatarUrl,
            // Basic Info
            title: editForm.title,
            firstName: editForm.firstName,
            preferredName: editForm.preferredName,
            middleName: editForm.middleName,
            lastName: editForm.lastName,
            gender: editForm.gender,
            dateOfBirth: editForm.dateOfBirth,
            nativeLanguage: editForm.nativeLanguage,

            emails: editForm.emails,
            phones: editForm.phones,
            email: recoveryEmail, // Sync the fundamental ID fields
            phone: recoveryPhone, // Sync the fundamental ID fields
            timeZone: editForm.timeZone,
            originCity: editForm.originCity,
            originCountry: editForm.originCountry,
            currentCity: editForm.currentCity,
            currentCountry: editForm.currentCountry,
            previousLocations: editForm.previousLocations,
            profession: editForm.profession,
            interests: editForm.interests,
            // Learning
            targetLanguage: editForm.targetLanguage,
            englishLevel: editForm.englishLevel,
            goals: editForm.goals,
            englishEnvironment: editForm.englishEnvironment,
            schedule: editForm.schedule,
            preferences: editForm.preferences,
            // Tutor
            tutorData: editForm.role === 'tutor' ? editForm.tutorData : undefined,
        });
        setIsEditing(false);
        showToast("Profile updated successfully!", 'success');
    };

    const handleCancel = () => {
        setEditForm({
            username: user.username,
            role: user.role || 'user',
            avatarUrl: user.avatarUrl || '',
            emails: initializeEmails(),
            phones: initializePhones(),

            // Unified Basic Info
            title: user.title || '',
            firstName: user.firstName || '',
            preferredName: user.preferredName || '',
            middleName: user.middleName || '',
            lastName: user.lastName || '',
            gender: user.gender || '',
            dateOfBirth: user.dateOfBirth || '',
            nativeLanguage: user.nativeLanguage || '',

            timeZone: user.timeZone || '',
            originCity: user.originCity || '',
            originCountry: user.originCountry || '',
            currentCity: user.currentCity || '',
            currentCountry: user.currentCountry || '',
            previousLocations: user.previousLocations || [],
            profession: user.profession || '',
            interests: user.interests || '',
            targetLanguage: user.targetLanguage || 'English',
            englishLevel: user.englishLevel || '',
            goals: user.goals || '',
            englishEnvironment: user.englishEnvironment || '',
            schedule: user.schedule || '',
            preferences: user.preferences || '',

            // Tutor Data
            tutorData: user.tutorData || {
                displayName: '',
                languagesTaught: [],
                proficiencyLevel: '',
                originType: '',
                otherLanguagesSpoken: [],
                placesLived: [],
                bio: '',
                education: [],
                teachingCertificates: [],
                teachingSkills: [],
                yearsExperience: 0,
                availabilityGrid: {},
                hourlyRate: 0,
                currency: 'USD',
                trialLessonAvailable: false
            } as any
        });
        setIsEditing(false);
        setError(null);
        setEmailStep('idle');
    };

    // --- Email & Password Logic (Preserved) ---
    // (Copied almost exactly from previous version, just ensuring variables match)

    const verifyCurrentEmail = () => {
        // This step is largely deprecated if we're managing multiple emails and not a single 'user.email' field directly.
        // If we need to verify the *current recovery email* before allowing changes, this logic would be adapted.
        // For now, we'll assume the flow directly verifies the 'new' email.
        // This function might not be called in the new multi-email setup.
        if (userEnteredCode !== verificationCode) {
            setError("Invalid code");
            return;
        }
        setTempNewEmail(''); // Clear tempNewEmail as current is verified
        setEmailStep('idle'); // Or transition to 'enter-new' if that's the next step
        setUserEnteredCode('');
        setError(null);
        showToast("Current email verified!", 'success');
    };

    /* const startVerifyNewEmail = async (email: string) => {
        setIsSendingCode(true);
        const code = generateVerificationCode();
        setVerificationCode(code);
        await simulateSendEmail(email, code);
        setIsSendingCode(false);
        showToast(`Code sent to NEW email (${email}): ${code}`, 'success');
    }; */

    const verifyNewEmail = () => {
        if (userEnteredCode !== verificationCode) {
            setError("Invalid code");
            return;
        }
        // This part needs careful integration with ContactListEditor.
        // If `tempNewEmail` was a new email being added/updated, we'd update the `editForm.emails` here.
        // For now, we'll just show success and let the user save the profile.
        // The actual update to `user.email` (the canonical recovery email) happens in `handleSaveProfile`.
        setEmailStep('idle');
        setUserEnteredCode('');
        setTempNewEmail('');
        showToast("Email verified successfully! Click 'Save' to apply changes.", 'success');
    };

    const handleResendCode = async () => {
        setIsSendingCode(true);
        const code = generateVerificationCode();
        setVerificationCode(code);
        const targetEmail = tempNewEmail; // Always resend to the email currently being verified
        if (targetEmail) {
            await simulateSendEmail(targetEmail, code);
            showToast(`New code sent to ${targetEmail}: ${code}`, 'success');
        }
        setIsSendingCode(false);
    };

    // Password Logic
    const startPasswordChange = () => {
        setError(null);
        setPasswordStep('method-selection');
        setPasswordForm({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
    };

    const handleVerifyOldPassword = () => {
        if (passwordForm.oldPassword !== user.password) {
            setError("Incorrect password");
            return;
        }
        setError(null);
        setPasswordStep('set-new');
    };

    const startPasswordResetViaEmail = async () => {
        const recoveryEmail = editForm.emails.find(e => e.isRecovery)?.value;
        if (!recoveryEmail) {
            setError("No recovery email associated with account. Cannot verify.");
            return;
        }
        setIsSendingCode(true);
        const code = generateVerificationCode();
        setVerificationCode(code);
        await simulateSendEmail(recoveryEmail, code);
        setIsSendingCode(false);
        setPasswordStep('verify-email');
        setError(null);
    };

    const startPasswordResetViaPhone = async () => {
        const recoveryPhone = editForm.phones.find(p => p.isRecovery)?.value;
        if (!recoveryPhone) {
            setError("No recovery phone associated with account. Cannot verify.");
            return;
        }
        setIsSendingCode(true);
        const code = generateVerificationCode();
        setVerificationCode(code);
        await simulateSendSMS(recoveryPhone, code); // Assuming simulateSendSMS exists
        setIsSendingCode(false);
        setPasswordStep('verify-phone'); // New step for phone verification
        setError(null);
    };

    const verifyPasswordResetCode = () => {
        if (userEnteredCode !== verificationCode) {
            setError("Invalid code");
            return;
        }
        setError(null);
        setUserEnteredCode('');
        setPasswordStep('set-new');
    };

    const handleSaveNewPassword = () => {
        if (passwordForm.newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
            setError("Passwords do not match");
            return;
        }

        onUpdateProfile(user.username, { password: passwordForm.newPassword });
        setPasswordStep('idle');
        showToast("Password changed successfully! Logging out...", 'success');

        if (onLogout) {
            setTimeout(() => {
                onLogout();
            }, 1500);
        }
    };
    const handleDetectLocation = async () => {
        if (!navigator.geolocation) {
            showToast("Geolocation is not supported by your browser.", "error");
            return;
        }

        setIsDetectingLocation(true);
        try {
            // 1. Get Time Zone instantly
            const detectedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

            // 2. Get Geolocation
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 10000,
                    maximumAge: 0,
                    enableHighAccuracy: true
                });
            });

            const { latitude, longitude } = position.coords;

            // 3. Reverse Geocode (using free BigDataCloud API)
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);

            if (!response.ok) throw new Error("Failed to fetch location data");

            const data = await response.json();

            // 4. Update Form State
            setEditForm(prev => ({
                ...prev,
                timeZone: detectedTimeZone || prev.timeZone,
                currentCity: data.city || data.locality || prev.currentCity,
                currentCountry: data.countryName || prev.currentCountry,
            }));

            showToast("Location and Time Zone detected successfully!", "success");

        } catch (err: any) {
            console.error("Location detection error:", err);
            showToast(err.message === "User denied Geolocation" ? "Location permission denied." : "Failed to detect location.", "error");
        } finally {
            setIsDetectingLocation(false);
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            setIsCameraActive(true);
        } catch (err) {
            console.error("Error accessing camera:", err);
            showToast("Could not access camera. Please check permissions.", "error");
        }
    };

    useEffect(() => {
        if (isCameraActive && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [isCameraActive]);

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraActive(false);
    };

    const capturePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setEditForm(prev => ({ ...prev, avatarUrl: dataUrl }));
            }
        }
        stopCamera();
    };

    const maskEmail = (email: string) => {
        const [local, domain] = email.split('@');
        if (!domain) return email;
        if (local.length <= 2) return `${local}***@${domain}`;
        const start = local.slice(0, 2);
        const end = local.slice(-1);
        return `${start}****${end}@${domain}`;
    };

    if (!user) return <div className="p-8 text-center text-muted-foreground">Loading profile...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header/Back */}
            <div className="w-full flex justify-start -mb-2">
                <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-1">
                    &larr; Back to Home
                </button>
            </div>

            {/* Main Profile Header Card (Hero Tile Standardized) */}
            <div data-dev-id="profile-hero-tile" className="bg-color5 border border-color5/50 rounded-3xl p-8 flex flex-col md:flex-row gap-8 items-center shadow-md relative overflow-hidden text-color1">
                <div className="absolute right-0 top-0 w-64 h-64 bg-color1/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                {/* Profile Info (Left) */}
                <div className="flex items-center gap-6 relative z-10 w-full md:w-auto md:min-w-[320px] shrink-0">
                    <div className="relative group shrink-0">
                        <div className="w-24 h-24 rounded-2xl bg-color1/20 flex items-center justify-center text-color1 shadow-inner border border-color1/20 flex-shrink-0 overflow-hidden">
                            {editForm.avatarUrl || user.avatarUrl ? (
                                <img src={isEditing ? editForm.avatarUrl : (user.avatarUrl || '')} alt={`${user.username} profile`} className="w-full h-full object-cover" />
                            ) : (
                                user.role === 'admin' ? <Shield className="w-12 h-12" /> : user.role === 'tutor' ? <UserSquare2 className="w-12 h-12" /> : <UserCircle className="w-12 h-12" />
                            )}
                        </div>

                        {isEditing && (
                            <>
                                <input
                                    type="file"
                                    accept="image/*"
                                    id="profile-picture-upload"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            if (file.size > 2 * 1024 * 1024) {
                                                showToast("Image must be smaller than 2MB", 'error');
                                                return;
                                            }
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setEditForm(prev => ({ ...prev, avatarUrl: reader.result as string }));
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                                <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                                    <div className="flex gap-2">
                                        <label htmlFor="profile-picture-upload" className="cursor-pointer text-white hover:text-color5 transition-colors p-1" title="Upload Picture">
                                            <Upload className="w-5 h-5" />
                                        </label>
                                        <button
                                            type="button"
                                            onClick={startCamera}
                                            className="text-white hover:text-color5 transition-colors p-1"
                                            title="Take Photo"
                                        >
                                            <Camera className="w-5 h-5" />
                                        </button>
                                    </div>
                                    {(editForm.avatarUrl || user.avatarUrl) && (
                                        <button
                                            type="button"
                                            onClick={() => setEditForm(prev => ({ ...prev, avatarUrl: '' }))}
                                            className="text-white hover:text-red-400 transition-colors p-1 mt-1"
                                            title="Remove Picture"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                    {isEditing && (
                        <div className="text-sm text-color1/70 mt-3 font-bold text-center w-full animate-pulse transition-all absolute -bottom-6">Upload Photo</div>
                    )}
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2 w-full mt-2 relative z-10">
                    {isEditing ? (
                        <div className="space-y-4 max-w-sm mx-auto sm:mx-0">
                            <div>
                                <label className="text-xs font-semibold text-color1/70 uppercase">Username</label>
                                <input
                                    value={editForm.username}
                                    onChange={e => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                                    className="w-full p-2 mb-2 rounded bg-color1/20 border border-color1/30 text-color1 focus:border-color1 outline-none text-sm placeholder:text-color1/50"
                                />
                                <label className="text-xs font-semibold text-color1/70 uppercase">Role</label>
                                <select
                                    value={editForm.role}
                                    onChange={e => setEditForm(prev => ({ ...prev, role: e.target.value as 'user' | 'tutor' | 'admin' }))}
                                    className="w-full p-2 rounded bg-color1/20 border border-color1/30 text-color1 focus:border-color1 outline-none text-sm"
                                >
                                    <option value="user" className="text-foreground bg-background">Student</option>
                                    <option value="tutor" className="text-foreground bg-background">Tutor</option>
                                    <option value="admin" className="text-foreground bg-background">Admin</option>
                                </select>
                            </div>
                            <div className="flex gap-2 justify-center sm:justify-start mt-2">
                                <button onClick={handleSaveProfile} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-color1 text-color5 text-sm font-bold shadow-sm hover:bg-color1/90 transition-all">
                                    <Check className="w-4 h-4" /> Save
                                </button>
                                <button onClick={handleCancel} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-color5/50 border border-color1/20 text-color1 text-sm font-bold hover:bg-color5/70 transition-all">
                                    <X className="w-4 h-4" /> Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                                <h3 className="text-3xl font-bold text-color1">{user.username}</h3>
                                <div className="flex flex-col gap-y-1.5 mt-2 sm:mt-0 text-sm text-color1/70 font-medium">
                                    <span className="flex items-center gap-2">
                                        {user.role === 'admin' ? <Shield className="w-4 h-4 text-color1" /> : user.role === 'tutor' ? <BookOpen className="w-4 h-4 text-color1" /> : <User className="w-4 h-4 text-color1" />}
                                        <span className="text-color1 capitalize">{user.role === 'user' ? 'Learner' : user.role || 'Learner'}</span>
                                    </span>
                                    {user.email && (
                                        <span className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-color1" />
                                            {maskEmail(user.email)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
                                {user.nativeLanguage && (
                                    <span className="bg-color1/20 px-3 py-1 rounded-full text-xs font-medium text-color1 border border-color1/20 flex items-center gap-1">
                                        <Globe className="w-3 h-3" /> {user.nativeLanguage}
                                    </span>
                                )}
                                {user.currentCountry && (
                                    <span className="bg-color1/20 px-3 py-1 rounded-full text-xs font-medium text-color1 border border-color1/20 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> {user.currentCountry}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="mt-4 text-color1 hover:text-white transition-colors flex items-center justify-center sm:justify-start gap-1 mx-auto sm:mx-0 opacity-80 hover:opacity-100"
                            >
                                <Pencil className="w-4 h-4" /> Edit Profile
                            </button>
                        </>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex items-center gap-2 text-destructive">
                    <AlertCircle className="w-5 h-5" />
                    <p className="font-semibold">{error}</p>
                </div>
            )}

            {/* Unified Basic Info Tile - Removed to prevent huge size, moved fields to draggable grid */}
            {/* Static fields removed from here and moved down to section-identity grid tile */}

            {/* Tabs */}
            <div className="flex border-b border-border mb-6 overflow-x-auto">
                <TabButton id="basic" activeTab={activeTab} setActiveTab={setActiveTab} label="Basic Info" icon={User} />
                <TabButton id="learning" activeTab={activeTab} setActiveTab={setActiveTab} label="Learning Profile" icon={Book} />
                <TabButton id="account" activeTab={activeTab} setActiveTab={setActiveTab} label="Account & Settings" icon={Settings} />
                {editForm.role === 'tutor' && (
                    <TabButton id="tutor" activeTab={activeTab} setActiveTab={setActiveTab} label="Tutor Dashboard" icon={Briefcase} />
                )}
            </div>

            {/* Layout Customization Toggle */}
            <div className="flex justify-between items-center mb-6 px-2">
                <h3 className="font-semibold text-lg">{activeTab === 'basic' ? 'Basic Info' : activeTab === 'learning' ? 'Learning Profile' : activeTab === 'account' ? 'Account & Settings' : 'Tutor Dashboard'}</h3>
                
                {activeTab !== 'tutor' && (
                    <button
                        onClick={() => setIsCustomizeMode(!isCustomizeMode)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm ${
                            isCustomizeMode 
                            ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background' 
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                    >
                        {isCustomizeMode ? <Check className="w-4 h-4" /> : <Move className="w-4 h-4" />}
                        {isCustomizeMode ? 'Finish Customizing' : 'Customize Layout'}
                    </button>
                )}
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in duration-300">
                <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    {activeTab === 'basic' && (
                        <SortableContext 
                            items={tileOrder['basic'] || DEFAULT_ORDER_BASIC}
                            strategy={rectSortingStrategy}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                                {/* Map sections based on sorted state */}
                                {(tileOrder['basic'] || DEFAULT_ORDER_BASIC).map(sectionId => {
                                    if (sectionId === 'section-identity') return (
                                        <SortableSection key="section-identity" id="section-identity" isCustomizeMode={isCustomizeMode}>
                                            <Section id="section-identity" isEditing={isEditing} onSave={handleSaveProfile} title="Identity Details" icon={User} colorTheme="primary">
                                                <div className="flex flex-col gap-4">
                                                    {isEditing ? (
                                                        <>
                                                            <SelectField label="Title (Optional)" value={editForm.title} fieldKey="title" options={[{ label: 'Mr.', value: 'Mr.' }, { label: 'Ms.', value: 'Ms.' }, { label: 'Mrs.', value: 'Mrs.' }, { label: 'Dr.', value: 'Dr.' }]} isEditing={isEditing} setEditForm={setEditForm} />
                                                            <Field label="First Name" stepNumber={1} helperText="Must match your government-issued ID (verification required later)." value={editForm.firstName} fieldKey="firstName" isEditing={isEditing} setEditForm={setEditForm} placeholder="Mandatory" required={true} />
                                                            <Field label="Preferred Name (Recommended)" helperText="What you prefer to be called" value={editForm.preferredName} fieldKey="preferredName" isEditing={isEditing} setEditForm={setEditForm} />
                                                            <Field label="Middle Name (Optional)" value={editForm.middleName} fieldKey="middleName" isEditing={isEditing} setEditForm={setEditForm} />
                                                            <Field label="Last Name" stepNumber={2} helperText="Must match your government-issued ID (verification required later)." value={editForm.lastName} fieldKey="lastName" isEditing={isEditing} setEditForm={setEditForm} placeholder="Mandatory" required={true} />
                                                            <SelectField label="Gender" stepNumber={3} helperText="Mandatory. Must match your government-issued ID (verification required later)." value={editForm.gender} fieldKey="gender" options={[{ label: 'Male', value: 'Male' }, { label: 'Female', value: 'Female' }, { label: 'Prefer not to answer', value: 'Prefer not to answer' }, { label: 'Other', value: 'Other' }]} isEditing={isEditing} setEditForm={setEditForm} required={true} />

                                                            <div className="w-full">
                                                                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
                                                                    <span className="text-primary mr-1">Step 4:</span>
                                                                    Date of Birth {isEditing && <span className="text-destructive lowercase font-normal">(required)</span>}
                                                                </label>
                                                                <input type="date" value={editForm.dateOfBirth} onChange={e => setEditForm(prev => ({ ...prev, dateOfBirth: e.target.value }))} className={`w-full pl-3 pr-4 py-3 rounded-xl bg-input border ${!editForm.dateOfBirth ? 'border-primary ring-1 ring-primary' : 'border-border'} text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all`} />
                                                                <p className="text-[10px] text-muted-foreground mt-1.5 leading-tight">Must match your government-issued ID (verification required later).</p>
                                                            </div>

                                                            <div className="w-full">
                                                                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                                                                    <span className="text-primary mr-1">Step 5:</span>
                                                                    Native Spoken Language
                                                                    {!editForm.nativeLanguage ? <XCircle className="w-3.5 h-3.5 text-destructive" /> : <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
                                                                </label>
                                                                <div className="flex flex-col gap-2">
                                                                    <select
                                                                        value={
                                                                            ["English", "Spanish", "French", "German", "Mandarin", "Japanese", "Korean", "Portuguese", "Italian", "Russian", "Arabic", "Hindi", "Bengali", "Urdu", "Indonesian", "Turkish"].includes(editForm.nativeLanguage)
                                                                                ? editForm.nativeLanguage
                                                                                : (editForm.nativeLanguage ? 'Other' : '')
                                                                        }
                                                                        onChange={e => {
                                                                            if (e.target.value === 'Other') {
                                                                                setEditForm(prev => ({ ...prev, nativeLanguage: ' ' })); // space to trigger custom input
                                                                            } else {
                                                                                setEditForm(prev => ({ ...prev, nativeLanguage: e.target.value }));
                                                                            }
                                                                        }}
                                                                        className={`w-full p-2 rounded-md border ${!editForm.nativeLanguage ? 'border-destructive ring-1 ring-destructive/50' : 'border-input'} bg-background text-sm transition-all`}
                                                                    >
                                                                        <option value="" disabled>Select Language (Mandatory)</option>
                                                                        {["English", "Spanish", "French", "German", "Mandarin", "Japanese", "Korean", "Portuguese", "Italian", "Russian", "Arabic", "Hindi", "Bengali", "Urdu", "Indonesian", "Turkish"].map(lang => (
                                                                            <option key={lang} value={lang}>{lang}</option>
                                                                        ))}
                                                                        <option value="Other">Other (Type custom)</option>
                                                                    </select>
                                                                    {editForm.nativeLanguage && !["English", "Spanish", "French", "German", "Mandarin", "Japanese", "Korean", "Portuguese", "Italian", "Russian", "Arabic", "Hindi", "Bengali", "Urdu", "Indonesian", "Turkish"].includes(editForm.nativeLanguage) && (
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Type your language"
                                                                            value={editForm.nativeLanguage.trim()}
                                                                            onChange={e => setEditForm(prev => ({ ...prev, nativeLanguage: e.target.value }))}
                                                                            className="w-full p-2 rounded-md border border-input bg-background text-sm focus:border-primary transition-all animate-in slide-in-from-top-1"
                                                                            autoFocus
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="flex flex-col gap-1">
                                                                <label className="text-xs font-bold text-muted-foreground uppercase">Full Name</label>
                                                                <div className="font-medium text-foreground">
                                                                    {user.title ? user.title + ' ' : ''}
                                                                    {user.firstName || 'Not set'}
                                                                    {user.preferredName ? ` (${user.preferredName})` : ''}
                                                                    {' '}{user.middleName ? user.middleName + ' ' : ''}{user.lastName || ''}
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <label className="text-xs font-bold text-muted-foreground uppercase">Gender</label>
                                                                <div className="font-medium text-foreground">{user.gender || 'Not set'}</div>
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <label className="text-xs font-bold text-muted-foreground uppercase">Age / DOB</label>
                                                                <div className="font-medium text-foreground">{calculateAge(user.dateOfBirth) ? `${calculateAge(user.dateOfBirth)} years` : 'Not set'}</div>
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <label className="text-xs font-bold text-muted-foreground uppercase">Native Spoken Language</label>
                                                                <div className="font-medium text-foreground">{user.nativeLanguage || 'Not set'}</div>
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <label className="text-xs font-bold text-muted-foreground uppercase">Member Since</label>
                                                                <div className="font-medium text-foreground">{calculateMemberSince(user.createdAt)}</div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </Section>
                                        </SortableSection>
                                    );

                                    if (sectionId === 'section-contact') return (
                                        <SortableSection key="section-contact" id="section-contact" isCustomizeMode={isCustomizeMode}>
                                            <Section id="section-contact" isEditing={isEditing} onSave={handleSaveProfile} title="Contact Info" icon={Mail} colorTheme="primary">
                                                <div>
                                                    <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
                                                        Emails {isEditing && <span className="text-destructive lowercase font-normal">(required)</span>}
                                                    </label>
                                                    <p className="text-[10px] text-muted-foreground mb-3 leading-tight">Your primary email will be used for communications and account recovery.</p>
                                                    <ContactListEditor type="email" contacts={editForm.emails} setContacts={(c) => setEditForm(prev => ({ ...prev, emails: c }))} isEditing={isEditing} icon={Mail} />
                                                </div>

                                                <div className="mt-6">
                                                    <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
                                                        Phone Numbers (Recommended)
                                                    </label>
                                                    <p className="text-[10px] text-muted-foreground mb-3 leading-tight">Phone numbers can be used as a primary or backup method for account recovery.</p>
                                                    <ContactListEditor type="phone" contacts={editForm.phones} setContacts={(c) => setEditForm(prev => ({ ...prev, phones: c }))} isEditing={isEditing} icon={Phone} />
                                                </div>
                                            </Section>
                                        </SortableSection>
                                    );

                                    if (sectionId === 'section-location') return (
                                        <SortableSection key="section-location" id="section-location" isCustomizeMode={isCustomizeMode}>
                                            <div id="section-location" className="scroll-mt-6 h-full">
                                                <Section id="section-location" isEditing={isEditing} onSave={handleSaveProfile} title="Location" icon={MapPin} colorTheme="secondary">
                                                    {isEditing && (
                                                        <div className="mb-4">
                                                            <button
                                                                onClick={handleDetectLocation}
                                                                disabled={isDetectingLocation}
                                                                className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-semibold hover:bg-secondary/80 disabled:opacity-50 transition-colors w-full sm:w-auto justify-center"
                                                            >
                                                                {isDetectingLocation ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <Locate className="w-4 h-4" />
                                                                )}
                                                                {isDetectingLocation ? 'Detecting...' : 'Detect Current Location & Time Zone'}
                                                            </button>
                                                        </div>
                                                    )}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <Field label="Origin City" value={editForm.originCity} fieldKey="originCity" isEditing={isEditing} setEditForm={setEditForm} />
                                                        <Field label="Origin Country" value={editForm.originCountry} fieldKey="originCountry" isEditing={isEditing} setEditForm={setEditForm} />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <Field label="Current City" value={editForm.currentCity} fieldKey="currentCity" isEditing={isEditing} setEditForm={setEditForm} />
                                                        <Field label="Current Country" value={editForm.currentCountry} fieldKey="currentCountry" isEditing={isEditing} setEditForm={setEditForm} />
                                                    </div>
                                                    <div id="section-timezone" className="scroll-mt-24 mt-6">
                                                        <SelectField
                                                            label="Time Zone"
                                                            value={editForm.timeZone}
                                                            fieldKey="timeZone"
                                                            icon={Clock}
                                                            options={
                                                                editForm.timeZone && !TIMEZONE_OPTIONS.some(o => o.value === editForm.timeZone)
                                                                    ? [...TIMEZONE_OPTIONS, { label: editForm.timeZone, value: editForm.timeZone }]
                                                                    : TIMEZONE_OPTIONS
                                                            }
                                                            isEditing={isEditing}
                                                            setEditForm={setEditForm}
                                                        />
                                                    </div>
                                                    <div className="mt-6">
                                                        <TagsInput
                                                            label="Previous Locations (Optional)"
                                                            tags={editForm.previousLocations || []}
                                                            setTags={(tags) => setEditForm(prev => ({ ...prev, previousLocations: tags }))}
                                                            isEditing={isEditing}
                                                            placeholder="Add a previous location..."
                                                        />
                                                    </div>
                                                </Section>
                                            </div>
                                        </SortableSection>
                                    );

                                    if (sectionId === 'section-personal') return (
                                        <SortableSection key="section-personal" id="section-personal" isCustomizeMode={isCustomizeMode}>
                                            <Section id="section-personal" isEditing={isEditing} onSave={handleSaveProfile} title="Personal" icon={User} colorTheme="accent">
                                                <Field label="Profession (Recommended)" value={editForm.profession} helperText="This information is used to recommend learning material." fieldKey="profession" icon={Briefcase} isEditing={isEditing} setEditForm={setEditForm} />
                                                <Field label="Interests & Hobbies (Recommended)" value={editForm.interests} helperText="This information is used to recommend learning material." fieldKey="interests" icon={Heart} placeholder="Travel, Tech, Cooking..." isEditing={isEditing} setEditForm={setEditForm} />
                                            </Section>
                                        </SortableSection>
                                    );
                                    
                                    return null;
                                })}
                            </div>
                        </SortableContext>
                    )}

                    {activeTab === 'learning' && (
                        <SortableContext 
                            items={tileOrder['learning'] || DEFAULT_ORDER_LEARNING}
                            strategy={rectSortingStrategy}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                                {(tileOrder['learning'] || DEFAULT_ORDER_LEARNING).map(sectionId => {
                                    if (sectionId === 'section-languages') return (
                                        <SortableSection key="section-languages" id="section-languages" isCustomizeMode={isCustomizeMode}>
                                            <Section id="section-languages" isEditing={isEditing} onSave={handleSaveProfile} title="Languages" icon={Globe} colorTheme="primary">
                                                <Field label="Target Language" stepNumber={6} value={editForm.targetLanguage} fieldKey="targetLanguage" isEditing={isEditing} setEditForm={setEditForm} required={true} />
                                            </Section>
                                        </SortableSection>
                                    );

                                    if (sectionId === 'section-level') return (
                                        <SortableSection key="section-level" id="section-level" isCustomizeMode={isCustomizeMode}>
                                            <Section id="section-level" isEditing={isEditing} onSave={handleSaveProfile} title="Level & Goals" icon={Activity} colorTheme="secondary">
                                                <Field label="English Level" value={editForm.englishLevel} fieldKey="englishLevel" placeholder="e.g. Intermediate (B1)" isEditing={isEditing} setEditForm={setEditForm} />
                                                <TextArea label="Goals" value={editForm.goals} fieldKey="goals" placeholder="Why are you learning?" isEditing={isEditing} setEditForm={setEditForm} />
                                            </Section>
                                        </SortableSection>
                                    );

                                    if (sectionId === 'section-experience') return (
                                        <SortableSection key="section-experience" id="section-experience" isCustomizeMode={isCustomizeMode}>
                                            <Section id="section-experience" isEditing={isEditing} onSave={handleSaveProfile} title="Experience" icon={Book} colorTheme="accent">
                                                <TextArea label="Environment" value={editForm.englishEnvironment} fieldKey="englishEnvironment" placeholder="Where do you use English?" isEditing={isEditing} setEditForm={setEditForm} />
                                                <TextArea label="Schedule & Availability" value={editForm.schedule} fieldKey="schedule" placeholder="Mon/Wed evenings..." isEditing={isEditing} setEditForm={setEditForm} />
                                            </Section>
                                        </SortableSection>
                                    );

                                    if (sectionId === 'section-preferences') return (
                                        <SortableSection key="section-preferences" id="section-preferences" isCustomizeMode={isCustomizeMode}>
                                            <Section id="section-preferences" isEditing={isEditing} onSave={handleSaveProfile} title="Preferences" icon={Settings} colorTheme="muted">
                                                <TextArea label="Learning Preferences" value={editForm.preferences} fieldKey="preferences" placeholder="Visual learner, prefers conversation..." isEditing={isEditing} setEditForm={setEditForm} />
                                            </Section>
                                        </SortableSection>
                                    );
                                    
                                    return null;
                                })}
                            </div>
                        </SortableContext>
                    )}

                    {activeTab === 'account' && (
                        <SortableContext 
                            items={tileOrder['account'] || DEFAULT_ORDER_ACCOUNT}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-6">
                                {(tileOrder['account'] || DEFAULT_ORDER_ACCOUNT).map(sectionId => {
                                    if (sectionId === 'section-security') return (
                                        <SortableSection key="section-security" id="section-security" isCustomizeMode={isCustomizeMode}>
                                            <Section id="section-security" isEditing={isEditing} onSave={handleSaveProfile} title="Security" icon={Lock} colorTheme="default">
                                                {!isEditing && (
                                                    <button
                                                        onClick={startPasswordChange}
                                                        className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-secondary/50 transition-colors w-full sm:w-auto justify-center"
                                                    >
                                                        <KeyRound className="w-4 h-4" /> Change Password
                                                    </button>
                                                )}
                                                {isEditing && <p className="text-muted-foreground text-sm italic">Finish editing profile to change password.</p>}
                                            </Section>
                                        </SortableSection>
                                    );

                                    if (sectionId === 'section-flashcards') return (
                                        <SortableSection key="section-flashcards" id="section-flashcards" isCustomizeMode={isCustomizeMode}>
                                            <Section id="section-flashcards" isEditing={isEditing} onSave={handleSaveProfile} title="Flashcard Management" icon={Book} colorTheme="default">
                                                <button
                                                    onClick={onManageDeck}
                                                    className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-secondary/50 transition-colors w-full sm:w-auto justify-center"
                                                >
                                                    <Book className="w-4 h-4" /> Manage Flashcards
                                                </button>
                                            </Section>
                                        </SortableSection>
                                    );

                                    if (sectionId === 'section-appsettings' && onOpenSettings) return (
                                        <SortableSection key="section-appsettings" id="section-appsettings" isCustomizeMode={isCustomizeMode}>
                                            <Section id="section-appsettings" isEditing={isEditing} onSave={undefined} title="Application Settings" icon={Settings} colorTheme="secondary">
                                                <button
                                                    onClick={onOpenSettings}
                                                    className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-secondary/50 transition-colors w-full sm:w-auto justify-center"
                                                >
                                                    <Settings className="w-4 h-4" /> Open App Settings
                                                </button>
                                            </Section>
                                        </SortableSection>
                                    );

                                    if (sectionId === 'section-danger') return (
                                        <SortableSection key="section-danger" id="section-danger" isCustomizeMode={isCustomizeMode}>
                                            <Section id="section-danger" isEditing={isEditing} onSave={undefined} title="Danger Zone" icon={AlertCircle} colorTheme="accent">
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
                                                    <div>
                                                        <h4 className="font-bold text-destructive">Delete Account</h4>
                                                        <p className="text-sm text-foreground mt-1">
                                                            Permanently remove your account and all associated data. This action cannot be undone. All saved flashcards, study stats, and history will be lost.
                                                        </p>
                                                    </div>
                                                    <button
                                                        className="px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg font-bold shrink-0 transition-colors"
                                                        onClick={() => setShowDeleteConfirm(true)}
                                                    >
                                                        Delete Account
                                                    </button>
                                                </div>
                                            </Section>
                                        </SortableSection>
                                    );
                                    
                                    return null;
                                })}
                            </div>
                        </SortableContext>
                    )}
                </DndContext>

                {activeTab === 'tutor' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Section isEditing={isEditing} onSave={handleSaveProfile} title="Identity & Context" icon={Briefcase} colorTheme="primary">
                            <div className="w-full mb-4">
                                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Display Name</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editForm.tutorData.displayName || ''}
                                        onChange={e => setEditForm(prev => ({ ...prev, tutorData: { ...prev.tutorData, displayName: e.target.value } as any }))}
                                        placeholder="Preferred Name (what you prefer to go by)"
                                        className="w-full p-2 rounded-md border border-input bg-background text-sm"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md min-h-[38px] text-sm">
                                        <span className={!editForm.tutorData.displayName ? 'text-muted-foreground italic' : ''}>{editForm.tutorData.displayName || 'Not set'}</span>
                                    </div>
                                )}
                            </div>
                            <TagsInput label="Places Lived" tags={editForm.tutorData.placesLived || []} setTags={(tags) => setEditForm(prev => ({ ...prev, tutorData: { ...prev.tutorData, placesLived: tags } as any }))} isEditing={isEditing} placeholder="e.g. Japan, Spain, New York" />
                        </Section>

                        <Section isEditing={isEditing} onSave={handleSaveProfile} title="Linguistic Profile" icon={Globe} colorTheme="secondary">
                            <TagsInput label="Languages Taught" tags={editForm.tutorData.languagesTaught || []} setTags={(tags) => setEditForm(prev => ({ ...prev, tutorData: { ...prev.tutorData, languagesTaught: tags } as any }))} isEditing={isEditing} placeholder="e.g. English, Spanish" />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 mb-4">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Proficiency Level</label>
                                    {isEditing ? (
                                        <select
                                            value={editForm.tutorData.proficiencyLevel || ''}
                                            onChange={e => setEditForm(prev => ({ ...prev, tutorData: { ...prev.tutorData, proficiencyLevel: e.target.value } as any }))}
                                            className="w-full mt-1 p-2 rounded-md border border-input bg-background text-sm"
                                        >
                                            <option value="">Select Level</option>
                                            <option value="A1">A1 - Beginner</option>
                                            <option value="A2">A2 - Elementary</option>
                                            <option value="B1">B1 - Intermediate</option>
                                            <option value="B2">B2 - Upper Intermediate</option>
                                            <option value="C1">C1 - Advanced</option>
                                            <option value="C2/Native">C2 / Native</option>
                                        </select>
                                    ) : (
                                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md min-h-[38px] text-sm mt-1">
                                            <span className={!editForm.tutorData.proficiencyLevel ? 'text-muted-foreground italic' : ''}>{editForm.tutorData.proficiencyLevel || 'Not set'}</span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Origin Type</label>
                                    {isEditing ? (
                                        <select
                                            value={editForm.tutorData.originType || ''}
                                            onChange={e => setEditForm(prev => ({ ...prev, tutorData: { ...prev.tutorData, originType: e.target.value as any } as any }))}
                                            className="w-full mt-1 p-2 rounded-md border border-input bg-background text-sm"
                                        >
                                            <option value="">Select</option>
                                            <option value="Mother Tongue">Mother Tongue</option>
                                            <option value="Second Language">Second Language</option>
                                        </select>
                                    ) : (
                                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md min-h-[38px] text-sm mt-1">
                                            <span className={!editForm.tutorData.originType ? 'text-muted-foreground italic' : ''}>{editForm.tutorData.originType || 'Not set'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <LanguageLevelEditor languages={editForm.tutorData.otherLanguagesSpoken || []} setLanguages={(langs) => setEditForm(prev => ({ ...prev, tutorData: { ...prev.tutorData, otherLanguagesSpoken: langs } as any }))} isEditing={isEditing} label="Other Languages Spoken" />
                        </Section>

                        <Section isEditing={isEditing} onSave={handleSaveProfile} title="Professional Pedigree" icon={Book} colorTheme="accent">
                            <div className="w-full mb-4">
                                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Bio & Philosophy</label>
                                {isEditing ? (
                                    <textarea
                                        value={editForm.tutorData.bio || ''}
                                        onChange={e => setEditForm(prev => ({ ...prev, tutorData: { ...prev.tutorData, bio: e.target.value } as any }))}
                                        placeholder="Introduce yourself..."
                                        className="w-full p-2 rounded-md border border-input bg-background min-h-[100px] resize-y text-sm"
                                    />
                                ) : (
                                    <div className="p-3 bg-muted/50 rounded-md min-h-[60px] whitespace-pre-wrap text-sm">
                                        <span className={!editForm.tutorData.bio ? 'text-muted-foreground italic' : ''}>{editForm.tutorData.bio || 'No bio.'}</span>
                                    </div>
                                )}
                            </div>

                            <div className="mb-4">
                                <TagsInput label="Teaching Skills / Specialties" tags={editForm.tutorData.teachingSkills || []} setTags={(tags) => setEditForm(prev => ({ ...prev, tutorData: { ...prev.tutorData, teachingSkills: tags } as any }))} isEditing={isEditing} placeholder="e.g. Exam Prep, Business" />
                            </div>

                            <div className="mb-4">
                                <TagsInput label="Teaching Certificates" tags={editForm.tutorData.teachingCertificates || []} setTags={(tags) => setEditForm(prev => ({ ...prev, tutorData: { ...prev.tutorData, teachingCertificates: tags } as any }))} isEditing={isEditing} placeholder="e.g. TEFL, CELTA" />
                            </div>

                            <div className="mb-4">
                                <EducationEditor education={editForm.tutorData.education || []} setEducation={(edu) => setEditForm(prev => ({ ...prev, tutorData: { ...prev.tutorData, education: edu } as any }))} isEditing={isEditing} />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-muted-foreground uppercase">Years of Experience</label>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        min="0"
                                        max="50"
                                        value={editForm.tutorData.yearsExperience || 0}
                                        onChange={e => setEditForm(prev => ({ ...prev, tutorData: { ...prev.tutorData, yearsExperience: parseInt(e.target.value) || 0 } as any }))}
                                        className="w-full mt-1 p-2 rounded-md border border-input bg-background text-sm"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md min-h-[38px] text-sm mt-1">
                                        <span className={!editForm.tutorData.yearsExperience ? 'text-muted-foreground italic' : ''}>{editForm.tutorData.yearsExperience || '0'} years</span>
                                    </div>
                                )}
                            </div>
                        </Section>

                        <Section isEditing={isEditing} onSave={handleSaveProfile} title="Logistics & Pricing" icon={Settings} colorTheme="muted">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Hourly Rate</label>
                                    <div className="flex gap-2 mt-1">
                                        {isEditing ? (
                                            <>
                                                <select
                                                    value={editForm.tutorData.currency || 'USD'}
                                                    onChange={e => setEditForm(prev => ({ ...prev, tutorData: { ...prev.tutorData, currency: e.target.value } as any }))}
                                                    className="w-24 p-2 rounded-md border border-input bg-background text-sm"
                                                >
                                                    <option value="USD">USD</option>
                                                    <option value="EUR">EUR</option>
                                                    <option value="GBP">GBP</option>
                                                    <option value="JPY">JPY</option>
                                                </select>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.5"
                                                    value={editForm.tutorData.hourlyRate || 0}
                                                    onChange={e => setEditForm(prev => ({ ...prev, tutorData: { ...prev.tutorData, hourlyRate: parseFloat(e.target.value) || 0 } as any }))}
                                                    className="flex-1 p-2 rounded-md border border-input bg-background text-sm"
                                                />
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md min-h-[38px] w-full text-sm">
                                                <span className={!editForm.tutorData.hourlyRate ? 'text-muted-foreground italic' : ''}>{editForm.tutorData.hourlyRate ? `${editForm.tutorData.hourlyRate} ${editForm.tutorData.currency || 'USD'}/hr` : 'Not set'}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <label className="flex items-center gap-2 cursor-pointer group mt-5">
                                        <input
                                            type="checkbox"
                                            checked={editForm.tutorData.trialLessonAvailable || false}
                                            onChange={e => setEditForm(prev => ({ ...prev, tutorData: { ...prev.tutorData, trialLessonAvailable: e.target.checked } as any }))}
                                            disabled={!isEditing}
                                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary disabled:opacity-50"
                                        />
                                        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Offers Trial Lesson</span>
                                    </label>
                                </div>
                            </div>
                        </Section>
                    </div>
                )}
            </div>

            {isEditing && (
                <div className="flex gap-2 justify-center mt-8 mb-6 bg-card p-4 rounded-xl border border-border shadow-sm">
                    <button onClick={handleSaveProfile} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-base font-bold hover:bg-primary/90 shadow-md transition-all focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">
                        <Check className="w-5 h-5" /> Save Profile
                    </button>
                    <button onClick={handleCancel} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-secondary-foreground text-base font-bold hover:bg-secondary/80 focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-background">
                        <X className="w-5 h-5" /> Cancel
                    </button>
                </div>
            )}

            {/* --- Modals (Email/Password) --- */}
            {/* (Reusing existing modal logic/UI from previous file, condensed for brevity in prompt but implementation will be full) */}

            {/* Email Verification Modal */}
            {
                emailStep !== 'idle' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                        <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-6">
                            <div className="flex flex-col items-center mb-6">
                                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-3 text-primary">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground">
                                    {emailStep === 'verify-current' ? 'Verify Identity' : 'Verify New Email'}
                                </h3>
                                <p className="text-sm text-muted-foreground text-center mt-1">
                                    Enter the code sent to <span className="font-semibold text-foreground">{emailStep === 'verify-current' ? user.email : tempNewEmail}</span>
                                </p>
                            </div>
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    value={userEnteredCode}
                                    onChange={(e) => setUserEnteredCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="w-full px-4 py-3 rounded-lg bg-background border border-input focus:border-primary outline-none text-center text-xl tracking-[0.5em] font-mono"
                                    placeholder="000000"
                                    maxLength={6}
                                    autoFocus
                                />
                                {error && <p className="text-destructive text-sm text-center bg-destructive/10 p-2 rounded">{error}</p>}
                                <button
                                    onClick={emailStep === 'verify-current' ? verifyCurrentEmail : verifyNewEmail}
                                    disabled={userEnteredCode.length !== 6}
                                    className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
                                >
                                    Verify & Continue
                                </button>
                                <div className="flex justify-between items-center text-sm pt-2">
                                    <button onClick={() => setEmailStep('idle')} className="text-muted-foreground hover:text-foreground">Cancel</button>
                                    <button onClick={handleResendCode} disabled={isSendingCode} className="text-primary hover:underline flex items-center gap-1 disabled:opacity-50">
                                        <RefreshCcw className={`w-3 h-3 ${isSendingCode ? 'animate-spin' : ''}`} /> Resend Code
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Password Change Modal */}
            {
                passwordStep !== 'idle' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                        <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-6">
                            <div className="flex flex-col items-center mb-6">
                                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-3 text-primary">
                                    <Lock className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground">Change Password</h3>
                                <p className="text-sm text-muted-foreground text-center mt-1">
                                    {passwordStep === 'method-selection' && "Choose how to verify your identity."}
                                    {passwordStep === 'verify-old' && "Enter your current password."}
                                    {passwordStep === 'verify-email' && `Enter code sent to ${maskEmail(editForm.emails.find(e => e.isRecovery)?.value || 'your email')}.`}
                                    {passwordStep === 'verify-phone' && `Enter code sent to ${editForm.phones.find(p => p.isRecovery)?.value?.slice(-4).padStart(editForm.phones.find(p => p.isRecovery)?.value?.length || 0, '*') || 'your phone'}.`}
                                    {passwordStep === 'set-new' && "Create a new strong password."}
                                </p>
                            </div>

                            <div className="space-y-4">
                                {passwordStep === 'method-selection' && (
                                    <div className="grid gap-3">
                                        <button onClick={() => setPasswordStep('verify-old')} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors text-left">
                                            <div className="p-2 rounded bg-secondary text-foreground"><KeyRound className="w-5 h-5" /></div>
                                            <div>
                                                <div className="font-semibold text-sm">Use Current Password</div>
                                                <div className="text-xs text-muted-foreground">Quickest if you know it.</div>
                                            </div>
                                        </button>
                                        <button onClick={startPasswordResetViaEmail} disabled={!editForm.emails.some(e => e.isRecovery)} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors text-left disabled:opacity-50">
                                            <div className="p-2 rounded bg-secondary text-foreground"><Mail className="w-5 h-5" /></div>
                                            <div>
                                                <div className="font-semibold text-sm">Send Email Code</div>
                                                <div className="text-xs text-muted-foreground">{editForm.emails.some(e => e.isRecovery) ? `Sent to ${maskEmail(editForm.emails.find(e => e.isRecovery)?.value || '')}` : "No recovery email linked."}</div>
                                            </div>
                                        </button>
                                        <button onClick={startPasswordResetViaPhone} disabled={!editForm.phones.some(p => p.isRecovery)} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors text-left disabled:opacity-50">
                                            <div className="bg-primary/10 p-2 rounded-md text-primary">
                                                <Phone className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-sm">Send SMS Code</div>
                                                <div className="text-xs text-muted-foreground">{editForm.phones.some(p => p.isRecovery) ? `Sent to ${editForm.phones.find(p => p.isRecovery)?.value?.slice(-4).padStart(editForm.phones.find(p => p.isRecovery)?.value?.length || 0, '*')}` : "No recovery phone linked."}</div>
                                            </div>
                                        </button>
                                    </div>
                                )}

                                {/* Verify Old Password */}
                                {passwordStep === 'verify-old' && (
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={passwordForm.oldPassword}
                                                onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                                                className="w-full p-2 pr-8 rounded bg-background border border-input focus:border-primary outline-none"
                                                placeholder="Current Password"
                                                autoFocus
                                            />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <button onClick={handleVerifyOldPassword} className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90">Verify</button>
                                    </div>
                                )}

                                {/* Verify Email Code */}
                                {passwordStep === 'verify-email' && (
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={userEnteredCode}
                                            onChange={(e) => setUserEnteredCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className="w-full px-4 py-3 rounded-lg bg-background border border-input focus:border-primary outline-none text-center text-xl tracking-[0.5em] font-mono"
                                            placeholder="000000"
                                            maxLength={6}
                                            autoFocus
                                        />
                                        <button onClick={verifyPasswordResetCode} className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90">Verify Code</button>
                                    </div>
                                )}

                                {/* Set New Password */}
                                {passwordStep === 'set-new' && (
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={passwordForm.newPassword}
                                                onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                className="w-full p-2 pr-8 rounded bg-background border border-input focus:border-primary outline-none"
                                                placeholder="New Password"
                                                autoFocus
                                            />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={passwordForm.confirmNewPassword}
                                            onChange={e => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
                                            className="w-full p-2 rounded bg-background border border-input focus:border-primary outline-none"
                                            placeholder="Confirm New Password"
                                        />
                                        <button onClick={handleSaveNewPassword} className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90">Set New Password</button>
                                    </div>
                                )}

                                {error && <p className="text-destructive text-sm text-center bg-destructive/10 p-2 rounded">{error}</p>}

                                <div className="text-center pt-2">
                                    <button onClick={() => { setPasswordStep('idle'); setError(null); }} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Delete Account Confirmation Modal */}
            {
                showDeleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 fade-in duration-200">
                        <div className="w-full max-w-md bg-card border border-destructive/50 rounded-xl shadow-2xl p-6">
                            <div className="flex flex-col items-center mb-6">
                                <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mb-4 text-destructive">
                                    <AlertCircle className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black text-destructive text-center leading-tight">
                                    Delete Account
                                </h3>
                                <p className="text-lg text-foreground text-center mt-2 font-medium">
                                    Are you absolutely sure?
                                </p>
                                <p className="text-sm text-muted-foreground text-center mt-2">
                                    This action cannot be undone. All your flashcards, study statistics, and history will be permanently deleted.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 py-3 bg-secondary text-secondary-foreground font-bold rounded-lg hover:bg-secondary/80 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        if (onDeleteAccount) onDeleteAccount();
                                    }}
                                    className="flex-1 py-3 bg-destructive text-destructive-foreground font-bold rounded-lg hover:bg-destructive/90 transition-colors"
                                >
                                    Yes, Delete Account
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                isCameraActive && (
                    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
                        <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border overflow-hidden">
                            <div className="p-4 border-b border-border flex justify-between items-center">
                                <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                                    <Camera className="w-5 h-5 text-primary" /> Take a Photo
                                </h2>
                                <button onClick={stopCamera} className="p-2 hover:bg-muted rounded-full transition-colors">
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>
                            <div className="p-4 flex flex-col items-center space-y-4">
                                <div className="relative w-full aspect-square max-w-xs mx-auto overflow-hidden rounded-full bg-black">
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        className="w-full h-full object-cover transform -scale-x-100"
                                    />
                                </div>
                                <div className="flex gap-4 w-full">
                                    <button
                                        onClick={stopCamera}
                                        className="flex-1 py-3 bg-secondary text-secondary-foreground font-bold rounded-lg hover:bg-secondary/80 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={capturePhoto}
                                        className="flex-1 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors"
                                    >
                                        Capture
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
