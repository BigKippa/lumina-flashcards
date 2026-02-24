import { useState } from 'react';
import { UserProfile, ContactDetail } from '../types';
import {
    Book, Pencil, Check, X, AlertCircle, Eye, EyeOff, Mail, RefreshCcw, Lock, KeyRound,
    User, MapPin, Briefcase, Heart, Globe, Clock, Activity, Settings, Shield, UserSquare2, Upload, Trash2, Phone
} from 'lucide-react';
import { generateVerificationCode, simulateSendEmail, simulateSendSMS } from '../utils/mockEmailService';

interface ProfilePageProps {
    user: UserProfile;
    onManageDeck: () => void;
    onBack: () => void;
    onUpdateProfile: (oldUsername: string, newUserData: Partial<UserProfile>) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
    initialEditMode?: boolean;
    onLogout?: () => void;
    onOpenSettings?: () => void;
}

// --- Helper Types ---
interface TabButtonProps {
    id: 'basic' | 'learning' | 'account';
    activeTab: 'basic' | 'learning' | 'account';
    setActiveTab: (tab: 'basic' | 'learning' | 'account') => void;
    label: string;
    icon: any;
}

interface SectionProps {
    title: string;
    icon: any;
    children: React.ReactNode;
    colorTheme?: 'default' | 'primary' | 'secondary' | 'accent' | 'muted';
}

interface FieldProps {
    label: string;
    value: string;
    fieldKey: string;
    icon?: any;
    placeholder?: string;
    isEditing: boolean;
    setEditForm: React.Dispatch<React.SetStateAction<any>>;
}

interface TextAreaProps {
    label: string;
    value: string;
    fieldKey: string;
    placeholder?: string;
    isEditing: boolean;
    setEditForm: React.Dispatch<React.SetStateAction<any>>;
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

const Section = ({ title, icon: Icon, children, colorTheme = 'default' }: SectionProps) => {
    let bgClass = "bg-card";
    let borderClass = "border-border";
    let iconClass = "text-primary";

    if (colorTheme === 'primary') {
        bgClass = "bg-primary/5";
        borderClass = "border-primary/20";
        iconClass = "text-primary";
    } else if (colorTheme === 'secondary') {
        bgClass = "bg-secondary/30";
        borderClass = "border-secondary/50";
        iconClass = "text-secondary-foreground";
    } else if (colorTheme === 'accent') {
        bgClass = "bg-accent/10";
        borderClass = "border-accent/20";
        iconClass = "text-accent-foreground";
    } else if (colorTheme === 'muted') {
        bgClass = "bg-muted/30";
        borderClass = "border-muted/50";
        iconClass = "text-muted-foreground";
    }

    return (
        <div className={`${bgClass} p-6 rounded-xl border ${borderClass} shadow-sm mb-6 transition-colors`}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                <Icon className={`w-5 h-5 ${iconClass}`} /> {title}
            </h3>
            <div className="space-y-4">
                {children}
            </div>
        </div>
    );
};

const SelectField = ({ label, value, fieldKey, options, icon: Icon, placeholder, isEditing, setEditForm }: SelectFieldProps) => (
    <div className="w-full">
        <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">{label}</label>
        {isEditing ? (
            <div className="relative">
                {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />}
                <select
                    value={value}
                    onChange={e => setEditForm((prev: any) => ({ ...prev, [fieldKey]: e.target.value }))}
                    className={`w-full p-2 rounded-md border border-input bg-background ${Icon ? 'pl-9' : ''} text-sm`}
                >
                    <option value="" disabled>{placeholder || `Select ${label.toLowerCase()}`}</option>
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>
        ) : (
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md min-h-[38px] text-sm">
                {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
                <span className={!value ? 'text-muted-foreground italic' : ''}>{
                    options.find(o => o.value === value)?.label || value || 'Not set'
                }</span>
            </div>
        )}
    </div>
);

const Field = ({ label, value, fieldKey, icon: Icon, placeholder, isEditing, setEditForm }: FieldProps) => (
    <div className="w-full">
        <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">{label}</label>
        {isEditing ? (
            <div className="relative">
                {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />}
                <input
                    type="text"
                    value={value}
                    onChange={e => setEditForm((prev: any) => ({ ...prev, [fieldKey]: e.target.value }))}
                    placeholder={placeholder || `Enter ${label.toLowerCase()}`}
                    className={`w-full p-2 rounded-md border border-input bg-background ${Icon ? 'pl-9' : ''} text-sm`}
                />
            </div>
        ) : (
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md min-h-[38px] text-sm">
                {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
                <span className={!value ? 'text-muted-foreground italic' : ''}>{value || 'Not set'}</span>
            </div>
        )}
    </div>
);

const TextArea = ({ label, value, fieldKey, placeholder, isEditing, setEditForm }: TextAreaProps) => (
    <div className="w-full">
        <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">{label}</label>
        {isEditing ? (
            <textarea
                value={value}
                onChange={e => setEditForm((prev: any) => ({ ...prev, [fieldKey]: e.target.value }))}
                placeholder={placeholder || `Enter ${label.toLowerCase()}`}
                className="w-full p-2 rounded-md border border-input bg-background min-h-[100px] resize-y text-sm"
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
        setContacts([...contacts, { id: Date.now().toString(), value: '', label: labelOptions[0], isCustomLabel: false, isRecovery: contacts.length === 0 }]);
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
            {contacts.map((c) => (
                <div key={c.id} className="p-3 bg-secondary/20 border border-border rounded-lg space-y-3 relative group">
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type={type === 'email' ? 'email' : 'text'}
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
                </div>
            ))}

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

export function ProfilePage({ user, onManageDeck, onBack, onUpdateProfile, showToast, initialEditMode = false, onLogout, onOpenSettings }: ProfilePageProps) {
    const [isEditing, setIsEditing] = useState(initialEditMode);
    const [activeTab, setActiveTab] = useState<'basic' | 'learning' | 'account'>('basic');

    // Expanded Edit Form State

    // Helper to migrate legacy single strings to arrays silently during initial edit form load
    const initializeEmails = (): ContactDetail[] => {
        if (user.emails && user.emails.length > 0) return user.emails;
        if (user.email) return [{ id: 'legacy-email', value: user.email, label: 'Personal', isCustomLabel: false, isRecovery: true }];
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

        // Basic Info
        timeZone: user.timeZone || '',
        originCity: user.originCity || '',
        originCountry: user.originCountry || '',
        currentCity: user.currentCity || '',
        currentCountry: user.currentCountry || '',
        profession: user.profession || '',
        interests: user.interests || '',

        // Learning Profile
        nativeLanguage: user.nativeLanguage || '',
        targetLanguage: user.targetLanguage || 'English',
        englishLevel: user.englishLevel || '',
        goals: user.goals || '',
        englishEnvironment: user.englishEnvironment || '',
        schedule: user.schedule || '',
        preferences: user.preferences || '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Email Verification State
    const [emailStep, setEmailStep] = useState<'idle' | 'verify-current' | 'enter-new' | 'verify-new'>('idle');
    const [verificationCode, setVerificationCode] = useState('');
    const [userEnteredCode, setUserEnteredCode] = useState('');
    const [isSendingCode, setIsSendingCode] = useState(false);
    const [tempNewEmail, setTempNewEmail] = useState('');

    // Password Change State
    const [passwordStep, setPasswordStep] = useState<'idle' | 'method-selection' | 'verify-old' | 'verify-email' | 'verify-phone' | 'set-new'>('idle');
    const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmNewPassword: '' });

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
            // Basic
            emails: editForm.emails,
            phones: editForm.phones,
            email: recoveryEmail, // Sync the fundamental ID fields
            phone: recoveryPhone, // Sync the fundamental ID fields
            timeZone: editForm.timeZone,
            originCity: editForm.originCity,
            originCountry: editForm.originCountry,
            currentCity: editForm.currentCity,
            currentCountry: editForm.currentCountry,
            profession: editForm.profession,
            interests: editForm.interests,
            // Learning
            nativeLanguage: editForm.nativeLanguage,
            targetLanguage: editForm.targetLanguage,
            englishLevel: editForm.englishLevel,
            goals: editForm.goals,
            englishEnvironment: editForm.englishEnvironment,
            schedule: editForm.schedule,
            preferences: editForm.preferences,
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
            timeZone: user.timeZone || '',
            originCity: user.originCity || '',
            originCountry: user.originCountry || '',
            currentCity: user.currentCity || '',
            currentCountry: user.currentCountry || '',
            profession: user.profession || '',
            interests: user.interests || '',
            nativeLanguage: user.nativeLanguage || '',
            targetLanguage: user.targetLanguage || 'English',
            englishLevel: user.englishLevel || '',
            goals: user.goals || '',
            englishEnvironment: user.englishEnvironment || '',
            schedule: user.schedule || '',
            preferences: user.preferences || '',
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

    const maskEmail = (email: string) => {
        const [local, domain] = email.split('@');
        if (!domain) return email;
        if (local.length <= 2) return `${local}***@${domain}`;
        const start = local.slice(0, 2);
        const end = local.slice(-1);
        return `${start}****${end}@${domain}`;
    };


    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header/Back */}
            <div className="w-full flex justify-start -mb-2">
                <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-1">
                    &larr; Back to Home
                </button>
            </div>

            {/* Main Profile Header Card */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <div className="relative group shrink-0">
                        {editForm.avatarUrl || user.avatarUrl ? (
                            <div className="w-24 h-24 rounded-full overflow-hidden bg-secondary flex items-center justify-center border-4 border-background shadow-md">
                                <img src={isEditing ? editForm.avatarUrl : (user.avatarUrl || '')} alt={`${user.username} profile`} className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary border-4 border-background shadow-md">
                                {user.role === 'admin' ? <Shield className="w-10 h-10" /> : user.role === 'tutor' ? <UserSquare2 className="w-10 h-10" /> : <User className="w-10 h-10" />}
                            </div>
                        )}

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
                                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                    <label htmlFor="profile-picture-upload" className="cursor-pointer text-white hover:text-primary transition-colors p-1" title="Upload Picture">
                                        <Upload className="w-5 h-5" />
                                    </label>
                                    {(editForm.avatarUrl || user.avatarUrl) && (
                                        <button
                                            type="button"
                                            onClick={() => setEditForm(prev => ({ ...prev, avatarUrl: '' }))}
                                            className="text-white hover:text-destructive transition-colors p-1"
                                            title="Remove Picture"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                    <div className="flex-1 text-center sm:text-left space-y-2 w-full">
                        {isEditing ? (
                            <div className="space-y-4 max-w-sm mx-auto sm:mx-0">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Username</label>
                                    <input
                                        value={editForm.username}
                                        onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                                        className="w-full p-2 mb-2 rounded bg-secondary/50 border border-border focus:border-primary outline-none text-sm"
                                    />
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Role</label>
                                    <select
                                        value={editForm.role}
                                        onChange={e => setEditForm({ ...editForm, role: e.target.value as 'user' | 'tutor' | 'admin' })}
                                        className="w-full p-2 rounded bg-secondary/50 border border-border focus:border-primary outline-none text-sm"
                                    >
                                        <option value="user">Learner</option>
                                        <option value="tutor">Tutor</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="flex gap-2 justify-center sm:justify-start">
                                    <button onClick={handleSaveProfile} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90">
                                        <Check className="w-4 h-4" /> Save
                                    </button>
                                    <button onClick={handleCancel} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-bold hover:bg-secondary/80">
                                        <X className="w-4 h-4" /> Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                    <h3 className="text-2xl font-bold text-foreground">{user.username}</h3>
                                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-primary/20">
                                        {user.role === 'user' ? 'learner' : user.role || 'learner'}
                                    </span>
                                </div>
                                <p className="text-muted-foreground">{user.email ? maskEmail(user.email) : 'No email linked'}</p>
                                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                                    {user.nativeLanguage && (
                                        <span className="bg-secondary px-3 py-1 rounded-full text-xs font-medium text-muted-foreground border border-border flex items-center gap-1">
                                            <Globe className="w-3 h-3" /> {user.nativeLanguage}
                                        </span>
                                    )}
                                    {user.currentCountry && (
                                        <span className="bg-secondary px-3 py-1 rounded-full text-xs font-medium text-muted-foreground border border-border flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> {user.currentCountry}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="mt-4 text-primary hover:underline flex items-center justify-center sm:justify-start gap-1 mx-auto sm:mx-0"
                                >
                                    <Pencil className="w-4 h-4" /> Edit Profile
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex items-center gap-2 text-destructive">
                    <AlertCircle className="w-5 h-5" />
                    <p className="font-semibold">{error}</p>
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-border mb-6 overflow-x-auto">
                <TabButton id="basic" activeTab={activeTab} setActiveTab={setActiveTab} label="Basic Info" icon={User} />
                <TabButton id="learning" activeTab={activeTab} setActiveTab={setActiveTab} label="Learning Profile" icon={Book} />
                <TabButton id="account" activeTab={activeTab} setActiveTab={setActiveTab} label="Account & Settings" icon={Settings} />
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in duration-300">
                {activeTab === 'basic' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Section title="Contact Info" icon={Mail} colorTheme="primary">
                            <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Emails</label>
                            <ContactListEditor type="email" contacts={editForm.emails} setContacts={(c) => setEditForm(prev => ({ ...prev, emails: c }))} isEditing={isEditing} icon={Mail} />

                            <label className="text-xs font-bold text-muted-foreground uppercase mt-4 mb-2 block">Phone Numbers</label>
                            <ContactListEditor type="phone" contacts={editForm.phones} setContacts={(c) => setEditForm(prev => ({ ...prev, phones: c }))} isEditing={isEditing} icon={Phone} />

                            <SelectField label="Time Zone" value={editForm.timeZone} fieldKey="timeZone" icon={Clock} options={TIMEZONE_OPTIONS} isEditing={isEditing} setEditForm={setEditForm} />
                        </Section>

                        <Section title="Location" icon={MapPin} colorTheme="secondary">
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Origin City" value={editForm.originCity} fieldKey="originCity" isEditing={isEditing} setEditForm={setEditForm} />
                                <Field label="Origin Country" value={editForm.originCountry} fieldKey="originCountry" isEditing={isEditing} setEditForm={setEditForm} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Current City" value={editForm.currentCity} fieldKey="currentCity" isEditing={isEditing} setEditForm={setEditForm} />
                                <Field label="Current Country" value={editForm.currentCountry} fieldKey="currentCountry" isEditing={isEditing} setEditForm={setEditForm} />
                            </div>
                        </Section>

                        <Section title="Personal" icon={User} colorTheme="accent">
                            <Field label="Profession" value={editForm.profession} fieldKey="profession" icon={Briefcase} isEditing={isEditing} setEditForm={setEditForm} />
                            <Field label="Interests & Hobbies" value={editForm.interests} fieldKey="interests" icon={Heart} placeholder="Travel, Tech, Cooking..." isEditing={isEditing} setEditForm={setEditForm} />
                        </Section>
                    </div>
                )}

                {activeTab === 'learning' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Section title="Languages" icon={Globe} colorTheme="primary">
                            <Field label="Native Language" value={editForm.nativeLanguage} fieldKey="nativeLanguage" isEditing={isEditing} setEditForm={setEditForm} />
                            <Field label="Target Language" value={editForm.targetLanguage} fieldKey="targetLanguage" isEditing={isEditing} setEditForm={setEditForm} />
                        </Section>

                        <Section title="Level & Goals" icon={Activity} colorTheme="secondary">
                            <Field label="English Level" value={editForm.englishLevel} fieldKey="englishLevel" placeholder="e.g. Intermediate (B1)" isEditing={isEditing} setEditForm={setEditForm} />
                            <TextArea label="Goals" value={editForm.goals} fieldKey="goals" placeholder="Why are you learning?" isEditing={isEditing} setEditForm={setEditForm} />
                        </Section>

                        <Section title="Experience" icon={Book} colorTheme="accent">
                            <TextArea label="Environment" value={editForm.englishEnvironment} fieldKey="englishEnvironment" placeholder="Where do you use English?" isEditing={isEditing} setEditForm={setEditForm} />
                            <TextArea label="Schedule & Availability" value={editForm.schedule} fieldKey="schedule" placeholder="Mon/Wed evenings..." isEditing={isEditing} setEditForm={setEditForm} />
                        </Section>

                        <Section title="Preferences" icon={Settings} colorTheme="muted">
                            <TextArea label="Learning Preferences" value={editForm.preferences} fieldKey="preferences" placeholder="Visual learner, prefers conversation..." isEditing={isEditing} setEditForm={setEditForm} />
                        </Section>
                    </div>
                )}

                {activeTab === 'account' && (
                    <div className="space-y-6">
                        <Section title="Security" icon={Lock} colorTheme="default">
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

                        <Section title="Flashcard Management" icon={Book} colorTheme="default">
                            <button
                                onClick={onManageDeck}
                                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-secondary/50 transition-colors w-full sm:w-auto justify-center"
                            >
                                <Book className="w-4 h-4" /> Manage Flashcards
                            </button>
                        </Section>

                        {onOpenSettings && (
                            <Section title="Application Settings" icon={Settings} colorTheme="secondary">
                                <button
                                    onClick={onOpenSettings}
                                    className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-secondary/50 transition-colors w-full sm:w-auto justify-center"
                                >
                                    <Settings className="w-4 h-4" /> Open App Settings
                                </button>
                            </Section>
                        )}
                    </div>
                )}
            </div>

            {/* --- Modals (Email/Password) --- */}
            {/* (Reusing existing modal logic/UI from previous file, condensed for brevity in prompt but implementation will be full) */}

            {/* Email Verification Modal */}
            {emailStep !== 'idle' && (
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
            )}

            {/* Password Change Modal */}
            {passwordStep !== 'idle' && (
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
            )}
        </div>
    );
}
