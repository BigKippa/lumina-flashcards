import { useTranslation } from 'react-i18next';
import { Sparkles, Shield, GraduationCap } from 'lucide-react';
import { UserRole } from '../types';

interface UserModeSelectionScreenProps {
    onSelectMode: (role: UserRole) => void;
}

export function UserModeSelectionScreen({ onSelectMode }: UserModeSelectionScreenProps) {
    const { t } = useTranslation();

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-3xl opacity-50 animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-3xl opacity-50 animate-pulse delay-700" />
            </div>

            <div className="z-10 w-full flex flex-col items-center max-w-4xl">
                <div className="mb-12 text-center animate-in fade-in zoom-in duration-500">
                    <h1 className="text-4xl font-bold text-foreground mb-4">
                        {t('mode.title')}
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        {t('mode.subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {/* Learner */}
                    <button
                        onClick={() => onSelectMode('user')}
                        className="flex flex-col items-center p-8 rounded-2xl bg-card/60 backdrop-blur-sm border border-border hover:border-primary/50 hover:bg-card/80 transition-all group hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                        <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Sparkles className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">{t('mode.learner')}</h3>
                        <p className="text-muted-foreground text-center">
                            {t('mode.learner_desc')}
                        </p>
                    </button>

                    {/* Tutor */}
                    <button
                        onClick={() => onSelectMode('tutor')}
                        className="flex flex-col items-center p-8 rounded-2xl bg-card/60 backdrop-blur-sm border border-border hover:border-purple-500/50 hover:bg-card/80 transition-all group hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                        <div className="w-20 h-20 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <GraduationCap className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">{t('mode.tutor')}</h3>
                        <p className="text-muted-foreground text-center">
                            {t('mode.tutor_desc')}
                        </p>
                    </button>

                    {/* Admin */}
                    <button
                        onClick={() => onSelectMode('admin')}
                        className="flex flex-col items-center p-8 rounded-2xl bg-card/60 backdrop-blur-sm border border-border hover:border-orange-500/50 hover:bg-card/80 transition-all group hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                        <div className="w-20 h-20 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-6 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                            <Shield className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">{t('mode.admin')}</h3>
                        <p className="text-muted-foreground text-center">
                            {t('mode.admin_desc')}
                        </p>
                    </button>
                </div>
            </div>

        </div>
    );
}
