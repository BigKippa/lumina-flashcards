import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';

const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'pt', label: 'Portuguese' },
    { code: 'uk', label: 'Ukrainian' },
    { code: 'es', label: 'Spanish' },
    { code: 'it', label: 'Italian' },
    { code: 'fr', label: 'French' },
    { code: 'zh', label: 'Chinese' },
    { code: 'hi', label: 'Hindi' },
    { code: 'ja', label: 'Japanese' },
    { code: 'ko', label: 'Korean' }
];

export const LanguageSelector: React.FC = () => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    const currentLang = LANGUAGES.find(l => l.code === i18n.language) ||
        LANGUAGES.find(l => i18n.language?.startsWith(l.code)) ||
        LANGUAGES[0];

    const [focusedIndex, setFocusedIndex] = React.useState(-1);
    const itemRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        setIsOpen(false);
        setFocusedIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsOpen(true);
                setFocusedIndex(0);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setFocusedIndex(prev => (prev + 1) % LANGUAGES.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setFocusedIndex(prev => (prev - 1 + LANGUAGES.length) % LANGUAGES.length);
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (focusedIndex >= 0) {
                    changeLanguage(LANGUAGES[focusedIndex].code);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                break;
            case 'Tab':
                setIsOpen(false);
                break;
        }
    };

    React.useEffect(() => {
        if (isOpen && focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
            itemRefs.current[focusedIndex]?.focus();
        }
    }, [focusedIndex, isOpen]);

    React.useEffect(() => {
        if (!isOpen) setFocusedIndex(-1);
    }, [isOpen]);

    // Close on click outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div ref={dropdownRef} className="relative z-50" onKeyDown={handleKeyDown}>
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-secondary hover:bg-secondary/80 border-2 border-primary/10 text-foreground shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    title="Change Language"
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                >
                    <Globe className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline">{currentLang.label}</span>
                </button>

                {isOpen && (
                    <div className="absolute right-0 mt-2 w-48 max-h-60 overflow-y-auto py-2 bg-secondary rounded-xl shadow-xl border border-border animate-in fade-in zoom-in-95 origin-top-right" role="listbox">
                        {LANGUAGES.map((lang, index) => (
                            <button
                                key={lang.code}
                                ref={el => itemRefs.current[index] = el}
                                onClick={() => changeLanguage(lang.code)}
                                tabIndex={focusedIndex === index ? 0 : -1}
                                className={`w-full px-4 py-2 text-left flex items-center justify-between hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus:bg-accent focus:text-accent-foreground
                                ${i18n.language === lang.code ? 'bg-accent/50 text-primary font-medium' : 'text-foreground'}`}
                                role="option"
                                aria-selected={i18n.language === lang.code}
                            >
                                <span className="flex items-center gap-2">
                                    {lang.label}
                                </span>
                                {i18n.language === lang.code && <Check className="w-4 h-4" />}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
