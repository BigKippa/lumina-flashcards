import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserProfile } from '../types';
import { ArrowRight, Sparkles, Eye, EyeOff, GraduationCap, User, Mail, CheckCircle, RefreshCcw, Lock, Shield } from 'lucide-react';
import { generateVerificationCode, simulateSendEmail } from '../utils/mockEmailService';
import { LanguageSelector } from './LanguageSelector';

interface LoginScreenProps {
    onLogin: (profile: UserProfile, isNewUser?: boolean) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
}

export function LoginScreen({ onLogin, showToast }: LoginScreenProps) {
    const { t } = useTranslation();
    const [authMode, setAuthMode] = useState<'initial' | 'login' | 'register'>('initial');

    // ... (keep state declarations)
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [role, setRole] = useState<'user' | 'tutor'>('user'); // Default to Learner
    const [error, setError] = useState<string | null>(null);

    // Verification State
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [userEnteredCode, setUserEnteredCode] = useState('');
    const [isSendingCode, setIsSendingCode] = useState(false);

    // Password Reset / Setup State
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [tempUser, setTempUser] = useState<UserProfile | null>(null);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        // ... (keep existing logic)
        e.preventDefault();
        setError(null);
        if (!username.trim()) return;

        // Simplify Admin Check
        if (username.toLowerCase() === 'admin' && password === "secure_password") {
            const adminProfile: UserProfile = {
                id: 'admin',
                username: 'Admin',
                email: 'admin@example.com',
                password: 'secure_password',
                role: 'admin',
                progress: {},
                history: [],
                favorites: [],
                learningHistory: []
            };
            loginUser(adminProfile);
            return;
        }

        const storedProfiles = localStorage.getItem('profiles');
        const profiles: Record<string, UserProfile> = storedProfiles ? JSON.parse(storedProfiles) : {};
        const existingUser = profiles[username];

        if (existingUser) {
            if (existingUser.password && existingUser.password !== password) {
                setError("Incorrect Password");
                return;
            }

            if (existingUser.forcePasswordReset) {
                setTempUser(existingUser);
                setNewUsername(existingUser.username);
                setIsResettingPassword(true);
                setError(null);
                return;
            }

            loginUser(existingUser);
        } else {
            setError("User not found. Please check your credentials.");
        }
    };

    const handleCompleteSetup = (e: React.FormEvent) => {
        // ... (keep existing logic)
        e.preventDefault();
        if (!tempUser) return;

        if (!newUsername.trim()) {
            setError("Username cannot be empty.");
            return;
        }
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setError("Passwords do not match.");
            return;
        }

        const storedProfiles = localStorage.getItem('profiles');
        const profiles: Record<string, UserProfile> = storedProfiles ? JSON.parse(storedProfiles) : {};

        const isTaken = Object.values(profiles).some(u =>
            u.id !== tempUser.id && u.username.toLowerCase() === newUsername.toLowerCase()
        );

        if (isTaken) {
            setError("Username is already taken. Please choose another.");
            return;
        }

        const updatedUser: UserProfile = {
            ...tempUser,
            username: newUsername,
            password: newPassword,
            forcePasswordReset: false
        };

        const userKey = tempUser.email || tempUser.username;
        profiles[userKey] = updatedUser;
        localStorage.setItem('profiles', JSON.stringify(profiles));

        showToast("Account setup complete!", "success");
        loginUser(updatedUser, true);
    };

    const handleStartRegister = async (e: React.FormEvent) => {
        // ... (keep existing logic)
        e.preventDefault();
        setError(null);
        if (!username.trim() || !password.trim() || !email.trim()) {
            setError("All fields are required.");
            return;
        }

        const storedProfiles = localStorage.getItem('profiles');
        const profiles: Record<string, UserProfile> = storedProfiles ? JSON.parse(storedProfiles) : {};
        const isEmailTaken = Object.values(profiles).some(u => (u.email && u.email.toLowerCase() === email.toLowerCase()) || u.username.toLowerCase() === email.toLowerCase());
        const isUsernameTaken = Object.values(profiles).some(u => u.username.toLowerCase() === username.toLowerCase() || (u.email && u.email.toLowerCase() === username.toLowerCase()));

        if (profiles[email] || isEmailTaken) {
            setError("Email is already registered.");
            return;
        }
        if (profiles[username] || isUsernameTaken) {
            setError("Username is already taken.");
            return;
        }

        setIsSendingCode(true);
        const code = generateVerificationCode();
        setVerificationCode(code);
        await simulateSendEmail(email, code);
        setIsSendingCode(false);
        setIsVerifying(true);
        showToast(`Verification code sent to ${email}: ${code}`, 'success');
    };

    const handleVerifyAndRegister = () => {
        // ... (keep logic)
        if (userEnteredCode !== verificationCode) {
            setError("Invalid verification code. Please try again.");
            return;
        }

        const storedProfiles = localStorage.getItem('profiles');
        const profiles: Record<string, UserProfile> = storedProfiles ? JSON.parse(storedProfiles) : {};

        const newUser: UserProfile = {
            id: crypto.randomUUID(),
            email: email,
            username: username,
            password: password,
            role: role,
            progress: {},
            history: [],
            favorites: [],
            learningHistory: []
        };
        profiles[username] = newUser;
        localStorage.setItem('profiles', JSON.stringify(profiles));
        loginUser(newUser, true);
    };

    // ... (keep other handlers)
    const handleResendCode = async () => {
        setIsSendingCode(true);
        const code = generateVerificationCode();
        setVerificationCode(code);
        await simulateSendEmail(email, code);
        setIsSendingCode(false);
        showToast(`New code sent to ${email}: ${code}`, 'success');
    };

    const loginUser = (user: UserProfile, isNewUser: boolean = false) => {
        if (rememberMe) {
            localStorage.setItem('rememberedUser', JSON.stringify(user));
        } else {
            localStorage.removeItem('rememberedUser');
        }
        onLogin(user, isNewUser);
    };

    if (isResettingPassword) {
        return (
            <div className="w-full flex-grow flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">

                <div className="max-w-md w-full p-8 rounded-2xl bg-card/60 backdrop-blur-xl border border-border shadow-2xl relative z-10 animate-in fade-in zoom-in duration-500">
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 text-primary">
                            <Shield className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground text-center">Setup Your Account</h2>
                        <p className="text-muted-foreground mt-2 text-center text-sm">
                            Please set your username and a secure password to continue.
                        </p>
                    </div>
                    {/* ... form ... */}
                    <form onSubmit={handleCompleteSetup} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-primary uppercase tracking-wider ml-1">
                                {t('auth.username')}
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                    placeholder={t('auth.choose_username')}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-primary uppercase tracking-wider ml-1">
                                {t('auth.password')}
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                    placeholder={t('auth.choose_password')}
                                />
                            </div>
                        </div>

                        {/* ... confirm password ... */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-primary uppercase tracking-wider ml-1">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="password"
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-input border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                    placeholder="Re-enter password"
                                    title="Confirm Password"
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-destructive text-sm font-medium text-center bg-destructive/10 p-2 rounded-lg">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="w-full py-4 px-6 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                        >
                            Complete Setup <ArrowRight className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (isVerifying) {
        return (
            <div className="w-full flex-grow flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">

                <div className="max-w-md w-full p-8 rounded-2xl bg-card/60 backdrop-blur-xl border border-border shadow-2xl relative z-10 animate-in fade-in zoom-in duration-500">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 text-primary">
                            <Mail className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground text-center">{t('auth.verify_email')}</h2>
                        <p className="text-muted-foreground mt-2 text-center text-sm">
                            We sent a 6-digit code to <span className="font-semibold text-foreground">{email}</span>
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-primary uppercase tracking-wider ml-1">
                                {t('auth.verification_code')}
                            </label>
                            <input
                                type="text"
                                value={userEnteredCode}
                                onChange={(e) => setUserEnteredCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="w-full px-6 py-4 rounded-xl bg-background/50 text-foreground border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none text-center text-2xl tracking-[0.5em] font-mono"
                                placeholder="000000"
                                maxLength={6}
                                autoFocus
                            />
                        </div>

                        {error && (
                            <p className="text-destructive text-sm font-medium text-center bg-destructive/10 p-2 rounded-lg">
                                {error}
                            </p>
                        )}

                        <button
                            onClick={handleVerifyAndRegister}
                            disabled={userEnteredCode.length !== 6}
                            className="w-full py-4 px-6 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <CheckCircle className="w-5 h-5" />
                            <span>{t('auth.verify_create')}</span>
                        </button>

                        <div className="flex items-center justify-between text-sm mt-4">
                            <button
                                onClick={() => setIsVerifying(false)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                {t('common.back')}
                            </button>
                            <button
                                onClick={handleResendCode}
                                disabled={isSendingCode}
                                className="text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
                            >
                                <RefreshCcw className={`w-3 h-3 ${isSendingCode ? 'animate-spin' : ''}`} />
                                {t('auth.resend_code')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-center bg-background relative overflow-y-auto">
            {/* Background Decorations - Fixed to viewport to avoid scrolling with content */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-3xl opacity-50 animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-3xl opacity-50 animate-pulse delay-700" />
            </div>

            <div className="w-full flex-grow flex flex-col items-center justify-center p-4 relative z-10">
                <div className="max-w-md w-full p-8 rounded-2xl bg-card/60 backdrop-blur-xl border border-border shadow-2xl animate-in fade-in zoom-in duration-500">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                            <Sparkles className="w-8 h-8 text-primary-foreground" />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground text-center">
                            {t('auth.welcome_title')}
                        </h1>
                        <p className="text-muted-foreground mt-2 text-center">
                            {t('auth.welcome_subtitle')}
                        </p>
                    </div>

                    <div className="flex flex-col items-center mb-8 w-full">
                        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2 text-center">
                            {t('auth.choose_language')}
                        </p>
                        <div className="relative z-20">
                            <LanguageSelector />
                        </div>
                    </div>

                    {authMode === 'initial' && (
                        <div className="space-y-4">
                            <button
                                onClick={() => {
                                    setAuthMode('login');
                                    setUsername('');
                                    setPassword('');
                                    setError(null);
                                }}
                                className="w-full py-4 px-6 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all active:scale-95 text-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                            >
                                <User className="w-5 h-5" /> {t('auth.login')}
                            </button>
                            <button
                                onClick={() => {
                                    setAuthMode('register');
                                    setUsername('');
                                    setPassword('');
                                    setEmail('');
                                    setError(null);
                                }}
                                className="w-full py-4 px-6 rounded-xl bg-secondary text-secondary-foreground font-bold hover:bg-secondary/90 transition-all active:scale-95 text-lg border border-border/50 flex items-center justify-center gap-2"
                            >
                                <Sparkles className="w-5 h-5" /> {t('auth.register')}
                            </button>
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border/60"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-2 text-muted-foreground">{t('common.or')}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    const guestProfile: UserProfile = {
                                        id: 'guest',
                                        username: 'Guest',
                                        role: 'user',
                                        progress: {},
                                        history: [],
                                        favorites: [],
                                        learningHistory: []
                                    };
                                    onLogin(guestProfile);
                                }}
                                className="w-full py-3 px-6 rounded-xl bg-secondary/30 text-secondary-foreground font-semibold hover:bg-secondary/50 transition-all active:scale-95 text-sm"
                            >
                                {t('auth.guest')}
                            </button>
                        </div>
                    )}

                    {authMode === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="username" className="text-xs font-bold text-primary uppercase tracking-wider ml-1">
                                        {t('auth.username')}
                                    </label>
                                    <input
                                        id="username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full px-6 py-4 rounded-xl bg-background/50 text-foreground border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/50 text-lg"
                                        placeholder={t('auth.username_placeholder')}
                                        autoFocus
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="password" className="text-xs font-bold text-primary uppercase tracking-wider ml-1">
                                        {t('auth.password')}
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-6 py-4 pr-12 rounded-xl bg-background/50 text-foreground border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/50 text-lg"
                                            placeholder={t('auth.password_placeholder')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${rememberMe ? 'bg-primary border-primary' : 'border-input bg-background group-hover:border-primary/50'}`}>
                                        {rememberMe && <CheckCircle className="w-3.5 h-3.5 text-primary-foreground" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <span className="text-sm text-foreground select-none">{t('auth.remember_me')}</span>
                                </label>
                                <button
                                    type="button"
                                    className="text-sm text-primary hover:underline font-medium"
                                    onClick={() => showToast("Please contact an admin to reset your password.", "error")}
                                >
                                    {t('auth.forgot_password')}
                                </button>
                            </div>

                            {error && (
                                <div className="bg-destructive/10 p-3 rounded-lg flex flex-col items-center gap-2">
                                    <p className="text-destructive text-sm font-medium text-center">
                                        {error}
                                    </p>
                                    {error.includes("User not found") && (
                                        <>
                                            <span className="text-xs text-muted-foreground uppercase">{t('common.or') || "or"}</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setAuthMode('register');
                                                    setError(null);
                                                }}
                                                className="text-primary text-sm font-bold hover:underline transition-all"
                                            >
                                                New User - Create Account
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full py-4 px-6 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                            >
                                {t('auth.login')} <ArrowRight className="w-5 h-5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => { setAuthMode('initial'); setError(null); }}
                                className="w-full text-sm text-muted-foreground hover:text-foreground"
                            >
                                {t('common.back')}
                            </button>
                        </form>
                    )}

                    {authMode === 'register' && (
                        <form onSubmit={handleStartRegister} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-xs font-bold text-primary uppercase tracking-wider ml-1">
                                        {t('auth.email')}
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-6 py-4 rounded-xl bg-background/50 text-foreground border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/50 text-lg"
                                        placeholder={t('auth.email_placeholder')}
                                        autoFocus
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="username" className="text-xs font-bold text-primary uppercase tracking-wider ml-1">
                                        {t('auth.choose_username')}
                                    </label>
                                    <input
                                        id="username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full px-6 py-4 rounded-xl bg-background/50 text-foreground border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/50 text-lg"
                                        placeholder={t('auth.username_placeholder')}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="password" className="text-xs font-bold text-primary uppercase tracking-wider ml-1">
                                        {t('auth.choose_password')}
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-6 py-4 pr-12 rounded-xl bg-background/50 text-foreground border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/50 text-lg"
                                            placeholder="Create password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                                {/* Role Selection */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-primary uppercase tracking-wider ml-1">
                                        {t('auth.i_am_a')}
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setRole('user')}
                                            className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${role === 'user'
                                                ? 'bg-primary/20 border-primary text-primary'
                                                : 'bg-background/50 border-input text-muted-foreground hover:bg-secondary/50'
                                                }`}
                                        >
                                            <User className="w-5 h-5" />
                                            <span className="font-semibold">{t('auth.role_learner')}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRole('tutor')}
                                            className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${role === 'tutor'
                                                ? 'bg-primary/20 border-primary text-primary'
                                                : 'bg-background/50 border-input text-muted-foreground hover:bg-secondary/50'
                                                }`}
                                        >
                                            <GraduationCap className="w-5 h-5" />
                                            <span className="font-semibold">{t('auth.role_tutor')}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <p className="text-destructive text-sm font-medium text-center bg-destructive/10 p-2 rounded-lg">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={isSendingCode}
                                className="w-full py-4 px-6 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                            >
                                {isSendingCode ? "Sending Code..." : t('common.next')} <ArrowRight className="w-5 h-5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => { setAuthMode('initial'); setError(null); }}
                                className="w-full text-sm text-muted-foreground hover:text-foreground"
                            >
                                {t('common.back')}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
