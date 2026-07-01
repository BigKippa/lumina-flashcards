import React, { createContext, useContext, useState, useEffect } from 'react';
import { Settings, X, Palette, Type, Square, Save, Undo, Redo, Check, Plus, Bookmark } from 'lucide-react';

interface DevModeContextType {
    isDevMode: boolean;
    toggleDevMode: () => void;
}

const DevModeContext = createContext<DevModeContextType>({
    isDevMode: false,
    toggleDevMode: () => {}
});

export const useDevMode = () => useContext(DevModeContext);

type StyleOverrides = Record<string, React.CSSProperties>;

const generateStructuralPath = (element: HTMLElement | null): string | null => {
    if (!element) return null;
    if (element.hasAttribute('data-dev-id')) {
        return `[data-dev-id="${element.getAttribute('data-dev-id')}"]`;
    }
    const path: string[] = [];
    let current: HTMLElement | null = element;
    
    while (current && current.nodeType === Node.ELEMENT_NODE && current.tagName !== 'BODY' && current.tagName !== 'HTML') {
        if (current.hasAttribute('data-dev-id')) {
            path.unshift(`[data-dev-id="${current.getAttribute('data-dev-id')}"]`);
            break;
        }
        
        let tag = current.tagName.toLowerCase();
        let index = 1;
        let sibling = current.previousElementSibling;
        while (sibling) {
            if (sibling.nodeName === current.nodeName) {
                index++;
            }
            sibling = sibling.previousElementSibling;
        }
        
        path.unshift(`${tag}:nth-of-type(${index})`);
        current = current.parentElement;
    }
    
    return path.join(' > ');
};

const getFilteredStyles = (
    styles: React.CSSProperties, 
    flags: { background: boolean; borders: boolean; text: boolean }, 
    isPrimary: boolean
): React.CSSProperties => {
    if (isPrimary) return styles;
    
    const filtered: React.CSSProperties = {};
    const s = styles as any;
    const f = filtered as any;
    
    if (flags.background) {
        if (styles.backgroundColor !== undefined) filtered.backgroundColor = styles.backgroundColor;
        if (s._backgroundColorBase !== undefined) f._backgroundColorBase = s._backgroundColorBase;
        if (s._backgroundColorStrength !== undefined) f._backgroundColorStrength = s._backgroundColorStrength;
        if (s._backgroundColorOpacity !== undefined) f._backgroundColorOpacity = s._backgroundColorOpacity;
    }
    
    if (flags.borders) {
        if (styles.borderColor !== undefined) filtered.borderColor = styles.borderColor;
        if (s._borderColorBase !== undefined) f._borderColorBase = s._borderColorBase;
        if (s._borderColorStrength !== undefined) f._borderColorStrength = s._borderColorStrength;
        if (s._borderColorOpacity !== undefined) f._borderColorOpacity = s._borderColorOpacity;
        if (styles.borderWidth !== undefined) filtered.borderWidth = styles.borderWidth;
        if (styles.borderStyle !== undefined) filtered.borderStyle = styles.borderStyle;
        if (styles.borderRadius !== undefined) filtered.borderRadius = styles.borderRadius;
    }
    
    if (flags.text) {
        if (styles.color !== undefined) filtered.color = styles.color;
        if (s._colorBase !== undefined) f._colorBase = s._colorBase;
        if (s._colorStrength !== undefined) f._colorStrength = s._colorStrength;
        if (s._colorOpacity !== undefined) f._colorOpacity = s._colorOpacity;
        if (styles.fontSize !== undefined) filtered.fontSize = styles.fontSize;
        if (styles.fontWeight !== undefined) filtered.fontWeight = styles.fontWeight;
        if (styles.fontFamily !== undefined) filtered.fontFamily = styles.fontFamily;
    }
    
    return filtered;
};

export const DevModeProvider: React.FC<{ children: React.ReactNode; isAdmin: boolean }> = ({ children, isAdmin }) => {
    const [isDevMode, setIsDevMode] = useState(false);
    const [enableDevStyling, setEnableDevStyling] = useState(false);
    const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
    const [selectedElements, setSelectedElements] = useState<HTMLElement[]>([]);
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
    const selectedElement = selectedElements[0] || null;
    
    // Sync settings for multi-element editing
    const [syncBackground, setSyncBackground] = useState(false);
    const [syncBorders, setSyncBorders] = useState(false);
    const [syncText, setSyncText] = useState(false);
    const [isSyncEditingEnabled, setIsSyncEditingEnabled] = useState(false);
    
    // Theme Management
    const [showThemeModal, setShowThemeModal] = useState(false);
    const [themeName, setThemeName] = useState('');
    const [savedThemes, setSavedThemes] = useState<Record<string, StyleOverrides>>(() => JSON.parse(localStorage.getItem('lumina_dev_themes') || '{}'));

    // Publish Targeting
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [publishTarget, setPublishTarget] = useState<'all' | 'user' | 'tutor' | 'admin'>('all');

    // History array for cumulative changes and Undo
    const [history, setHistory] = useState<StyleOverrides[]>(() => {
        const saved = localStorage.getItem('lumina_dev_active_history');
        return saved ? JSON.parse(saved) : [{}];
    });
    const [currentIndex, setCurrentIndex] = useState(() => {
        const saved = localStorage.getItem('lumina_dev_active_index');
        return saved ? parseInt(saved, 10) : 0;
    });
    const [previewOverrides, setPreviewOverrides] = useState<StyleOverrides>({});

    useEffect(() => {
        try {
            localStorage.setItem('lumina_dev_active_history', JSON.stringify(history));
        } catch (e) {
            console.warn("Storage Quota Exceeded for dev history. Purging older states.", e);
            if (history.length > 5) {
                const pruned = history.slice(-5);
                setHistory(pruned);
                setCurrentIndex(pruned.length - 1);
            }
        }
    }, [history]);

    useEffect(() => {
        localStorage.setItem('lumina_dev_active_index', currentIndex.toString());
    }, [currentIndex]);

    const currentOverrides = history[currentIndex];

    // CSS Generator
    useEffect(() => {
        let styleStr = '/* Dev Theme Overrides */\n';
        
        const mergedOverrides: StyleOverrides = JSON.parse(JSON.stringify(currentOverrides));
        for(const [sel, rules] of Object.entries(previewOverrides)) {
            mergedOverrides[sel] = { ...(mergedOverrides[sel] || {}), ...rules };
        }

        for (const [selector, rules] of Object.entries(mergedOverrides)) {
            styleStr += `${selector} {\n`;
            for (const [key, value] of Object.entries(rules)) {
                 if (key.startsWith('_')) continue;
                 // convert camelCase to kebab-case
                 const kebabKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
                 styleStr += `  ${kebabKey}: ${value} !important;\n`;
            }
            styleStr += `}\n`;
        }

        let styleTag = document.getElementById('dev-theme-overrides');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'dev-theme-overrides';
            document.head.appendChild(styleTag);
        }
        styleTag.innerHTML = styleStr;
    }, [currentOverrides, previewOverrides]);

    useEffect(() => {
        if (!isAdmin) {
            if (isDevMode) setIsDevMode(false);
            setHoveredElement(null);
            setSelectedElements([]);
            return;
        }

        if (!isDevMode) {
            setHoveredElement(null);
            setSelectedElements([]);
            return;
        }

        const handleMouseOver = (e: MouseEvent) => {
            const el = e.target as HTMLElement;
            if (el.closest('#dev-tools-toggle')) {
                setHoveredElement(null);
                return;
            }
            
            const inToolbar = el.closest('#dev-tools');
            const inPanels = el.closest('#dev-editor-panel') || el.closest('#dev-theme-modal-content') || el.closest('#dev-publish-modal-content');
            
            // Panels are ALWAYS natively ignored unless Shift is held.
            if (inPanels && !e.shiftKey) {
                setHoveredElement(null);
                return;
            }
            
            // Toolbar is natively ignored unless `enableDevStyling` is checked or Shift is held.
            if (inToolbar && !enableDevStyling && !e.shiftKey) {
                setHoveredElement(null);
                return;
            }

            let targetEl = el;
            const styledParent = el.closest('button, label, [data-dev-id]');
            if (styledParent) {
                targetEl = styledParent as HTMLElement;
            }
            setHoveredElement(targetEl);
        };

        const handleMouseOut = () => {
            setHoveredElement(null);
        };

        const handleClick = (e: MouseEvent) => {
            const el = e.target as HTMLElement;
            if (el && el.closest('#dev-tools-toggle')) {
                return; // Let native checkbox toggle operate normally
            }
            if (hoveredElement) {
                const inToolbar = hoveredElement.closest('#dev-tools');
                const inPanels = hoveredElement.closest('#dev-editor-panel') || hoveredElement.closest('#dev-theme-modal-content') || hoveredElement.closest('#dev-publish-modal-content');
                
                // If they click inside Panels without Shift, let it work natively!
                if (inPanels && !e.shiftKey) {
                    return;
                }

                // If they click inside the Toolbar without Style mode or Shift, let it work natively!
                if (inToolbar && !enableDevStyling && !e.shiftKey) {
                    return;
                }
                
                e.preventDefault();
                e.stopPropagation();
                
                let targetEl = hoveredElement || el;
                
                const toggle = e.ctrlKey || e.metaKey || isMultiSelectMode;
                if (toggle) {
                    setSelectedElements(prev => {
                        const exists = prev.includes(targetEl);
                        if (exists) {
                            return prev.filter(item => item !== targetEl);
                        } else {
                            return [...prev, targetEl];
                        }
                    });
                } else {
                    if (selectedElements.length > 1 || (selectedElements.length === 1 && selectedElements[0] !== targetEl)) {
                        commitPreviewToHistory();
                    }
                    setSelectedElements([targetEl]);
                    setSyncBackground(false);
                    setSyncBorders(false);
                    setSyncText(false);
                    setIsSyncEditingEnabled(false);
                }
            }
        };

        document.addEventListener('mouseover', handleMouseOver);
        document.addEventListener('mouseout', handleMouseOut);
        document.addEventListener('click', handleClick, { capture: true });

        return () => {
            document.removeEventListener('mouseover', handleMouseOver);
            document.removeEventListener('mouseout', handleMouseOut);
            document.removeEventListener('click', handleClick, { capture: true });
        };
    }, [isDevMode, hoveredElement, selectedElements, isMultiSelectMode, previewOverrides, currentOverrides, currentIndex, history, enableDevStyling]);

    const commitPreviewToHistory = () => {
        if (Object.keys(previewOverrides).length === 0) return;
        
        let newOverrides = { ...currentOverrides };
        for (const [selector, rules] of Object.entries(previewOverrides)) {
            newOverrides[selector] = { ...newOverrides[selector], ...rules };
        }
        
        let newHistory = history.slice(0, currentIndex + 1);
        newHistory.push(newOverrides);
        
        if (newHistory.length > 30) {
            newHistory = newHistory.slice(-30);
        }
        
        setHistory(newHistory);
        setCurrentIndex(newHistory.length - 1);
        setPreviewOverrides({});
    };



    const canUndo = currentIndex > 0;
    const canRedo = currentIndex < history.length - 1;

    const handleUndo = () => {
        let actualIndex = currentIndex;
        
        // If there's an active draft, package it into history first so it's not permanently lost
        if (Object.keys(previewOverrides).length > 0) {
            let newOverrides = { ...currentOverrides };
            for (const [selector, rules] of Object.entries(previewOverrides)) {
                newOverrides[selector] = { ...newOverrides[selector], ...rules };
            }
            let newHistory = history.slice(0, currentIndex + 1);
            newHistory.push(newOverrides);
            
            if (newHistory.length > 30) {
                newHistory = newHistory.slice(-30);
            }
            
            setHistory(newHistory);
            actualIndex = newHistory.length - 1;
            setPreviewOverrides({});
        }

        // Now step back one state in history
        if (actualIndex > 0) {
            setCurrentIndex(actualIndex - 1);
        }
    };

    const handleRedo = () => {
        if (currentIndex < history.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const executePublish = async () => {
        try {
            let styleStr = '/* PUBLISHED DEV OVERRIDES */\n';
            const prefix = publishTarget === 'all' ? '' : `body[data-user-role="${publishTarget}"] `;
            
            for (const [selector, rules] of Object.entries(currentOverrides)) {
                styleStr += `${prefix}${selector} {\n`;
                for (const [key, value] of Object.entries(rules)) {
                     if (key.startsWith('_')) continue;
                     const kebabKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
                     styleStr += `  ${kebabKey}: ${value} !important;\n`;
                }
                styleStr += `}\n`;
            }

            const res = await fetch('/__dev_save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ css: styleStr })
            });
            if (res.ok) {
                alert("Styles saved to dev-theme.css! You can now run the save-to-beta workflow.");
                setShowPublishModal(false);
            } else {
                alert("Failed to save styles.");
            }
        } catch (e) {
            console.error(e);
            alert("Error saving styles.");
        }
    };

    const handleSaveTheme = () => {
        if (!themeName.trim()) return;
        const newThemes = { ...savedThemes, [themeName]: currentOverrides };
        setSavedThemes(newThemes);
        localStorage.setItem('lumina_dev_themes', JSON.stringify(newThemes));
        setThemeName('');
    };

    const handleLoadTheme = (theme: StyleOverrides) => {
        const newHistory = history.slice(0, currentIndex + 1);
        newHistory.push(theme);
        setHistory(newHistory);
        setCurrentIndex(newHistory.length - 1);
        setShowThemeModal(false);
    };

    return (
        <DevModeContext.Provider value={{ isDevMode, toggleDevMode: () => setIsDevMode(!isDevMode) }}>
            {children}
            
            {/* Dev Mode Floating Toolbar (Admin Only) */}
            {isAdmin && (
                <div id="dev-tools" data-dev-id="dev-tools-toolbar" className="fixed bottom-6 left-6 z-[9999] flex items-center gap-2 transition-all">
                    {isDevMode && (
                    <div className="bg-card border border-border shadow-2xl rounded-full px-4 py-2 flex items-center gap-3 animate-in slide-in-from-left">
                        <span className="text-sm font-bold text-primary">Dev Mode Active</span>
                        <label id="dev-tools-toggle" className="flex items-center gap-1.5 bg-primary/10 px-2 py-0.5 rounded cursor-pointer border border-primary/20 hover:bg-primary/20 transition-colors mr-2">
                            <input type="checkbox" checked={enableDevStyling} onChange={(e) => setEnableDevStyling(e.target.checked)} className="accent-primary" />
                            <span className="text-[10px] font-bold text-foreground tracking-tight uppercase">Style Dev UI</span>
                        </label>
                        <button onClick={() => canUndo && handleUndo()} className={`relative group p-2 rounded-full hover:bg-secondary transition-colors ${!canUndo && !enableDevStyling ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <Undo className="w-5 h-5" />
                            <span id="tooltip-undo" className={`absolute -top-10 left-1/2 -translate-x-1/2 bg-card text-foreground border border-border shadow-md px-2 py-1 text-[10px] rounded transition-opacity whitespace-nowrap z-[10000] font-bold uppercase tracking-wider ${selectedElement?.id === 'tooltip-undo' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none group-hover:opacity-100'}`}>Undo Last Change</span>
                        </button>
                        
                        <button onClick={() => canRedo && handleRedo()} className={`relative group p-2 rounded-full hover:bg-secondary transition-colors ${!canRedo && !enableDevStyling ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <Redo className="w-5 h-5" />
                            <span id="tooltip-redo" className={`absolute -top-10 left-1/2 -translate-x-1/2 bg-card text-foreground border border-border shadow-md px-2 py-1 text-[10px] rounded transition-opacity whitespace-nowrap z-[10000] font-bold uppercase tracking-wider ${selectedElement?.id === 'tooltip-redo' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none group-hover:opacity-100'}`}>Redo Last Change</span>
                        </button>
                        
                        <button onClick={() => setShowPublishModal(true)} className="relative group p-2 rounded-full bg-green-500/20 text-green-600 hover:bg-green-500/30 transition-colors flex items-center justify-center">
                            <Check className="w-5 h-5" />
                            <span id="tooltip-publish" className={`absolute -top-10 left-1/2 -translate-x-1/2 bg-card text-foreground border border-border shadow-md px-2 py-1 text-[10px] rounded transition-opacity whitespace-nowrap z-[10000] font-bold uppercase tracking-wider ${selectedElement?.id === 'tooltip-publish' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none group-hover:opacity-100'}`}>Publish Changes</span>
                        </button>
                        
                        <button onClick={() => setShowThemeModal(true)} className="relative group p-2 rounded-full bg-blue-500/20 text-blue-600 hover:bg-blue-500/30 transition-colors flex items-center justify-center">
                            <Bookmark className="w-5 h-5" />
                            <span id="tooltip-themes" className={`absolute -top-10 left-1/2 -translate-x-1/2 bg-card text-foreground border border-border shadow-md px-2 py-1 text-[10px] rounded transition-opacity whitespace-nowrap z-[10000] font-bold uppercase tracking-wider ${selectedElement?.id === 'tooltip-themes' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none group-hover:opacity-100'}`}>Themes</span>
                        </button>
                        
                        <button onClick={() => { setHistory([{}]); setCurrentIndex(0); }} className="relative group p-2 rounded-full bg-red-500/20 text-red-600 hover:bg-red-500/30 transition-colors flex items-center justify-center">
                            <X className="w-5 h-5" />
                            <span id="tooltip-discard" className={`absolute -top-10 left-1/2 -translate-x-1/2 bg-card text-foreground border border-border shadow-md px-2 py-1 text-[10px] rounded transition-opacity whitespace-nowrap z-[10000] font-bold uppercase tracking-wider ${selectedElement?.id === 'tooltip-discard' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none group-hover:opacity-100'}`}>Discard Changes</span>
                        </button>
                    </div>
                )}
                <button 
                    onClick={() => setIsDevMode(!isDevMode)} 
                    className={`p-4 rounded-full shadow-2xl text-white transition-all ${isDevMode ? 'bg-orange-500 hover:bg-orange-600 scale-110' : 'bg-primary hover:bg-primary/90'}`}
                    title="Toggle Developer Mode"
                >
                    <Settings className="w-6 h-6" />
                </button>
            </div>
            )}

            {/* Themes UI */}
            {isDevMode && showThemeModal && (
                <div id="dev-theme-modal" className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
                    <div id="dev-theme-modal-content" data-dev-id="dev-theme-modal-content" className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border p-6 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-foreground">Theme Templates</h2>
                            <div className="flex items-center gap-2">
                                <button onClick={() => {
                                    const modal = document.getElementById('dev-theme-modal-content');
                                    if (modal) setSelectedElements([modal]);
                                }} className="text-[10px] uppercase font-black text-purple-600 bg-purple-500/20 px-2 py-0.5 rounded hover:bg-purple-500/40 border border-purple-500/30 transition-colors">Edit Window</button>
                                <button onClick={() => setShowThemeModal(false)} className="p-2 hover:bg-muted rounded-full">
                                    <X className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>
                        
                        <div className="mb-6 bg-muted/50 p-4 rounded-xl border border-border/50">
                            <label className="block text-sm font-medium mb-2 text-foreground">Save Current Session</label>
                            <div className="flex gap-2">
                                <input type="text" value={themeName} onChange={e => setThemeName(e.target.value)} placeholder="Theme Name (e.g., Cyberpunk)" className="flex-1 bg-background border border-border rounded px-3 py-2 outline-none focus:border-primary text-sm" />
                                <button onClick={handleSaveTheme} className="bg-primary text-primary-foreground px-4 py-2 rounded font-bold hover:bg-primary/90 transition-colors">Save</button>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider text-muted-foreground">Saved Templates</h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {Object.keys(savedThemes).length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic">No themes saved yet.</p>
                                ) : (
                                    Object.entries(savedThemes).map(([key, data]: [string, any]) => {
                                        // Normalize fallback for both Array and Object storage structures gracefully
                                        const isArrayStruct = data && typeof data === 'object' && 'name' in data && 'overrides' in data;
                                        const themeName = isArrayStruct ? data.name : key;
                                        const themeStyles = isArrayStruct ? data.overrides : data;

                                        return (
                                            <div key={key} className="flex items-center justify-between bg-background border border-border rounded-lg p-3 hover:border-primary/50 transition-colors">
                                                <span className="font-semibold text-foreground">{themeName}</span>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleLoadTheme(themeStyles)} className="text-sm px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded font-medium">Load</button>
                                                    <button onClick={() => {
                                                        if (!confirm(`Are you sure you want to overwrite "${themeName}" with your current layout?`)) return;
                                                        const newThemes: any = Array.isArray(savedThemes) ? [...savedThemes] : { ...savedThemes };
                                                        if (Array.isArray(newThemes)) {
                                                            newThemes[parseInt(key, 10)].overrides = currentOverrides;
                                                        } else {
                                                            newThemes[key] = currentOverrides;
                                                        }
                                                        setSavedThemes(newThemes);
                                                        localStorage.setItem('lumina_dev_themes', JSON.stringify(newThemes));
                                                    }} className="text-sm px-3 py-1 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 rounded font-medium">Update</button>
                                                    <button onClick={() => {
                                                        const newThemes: any = Array.isArray(savedThemes) ? [...savedThemes] : { ...savedThemes };
                                                        if (Array.isArray(newThemes)) {
                                                            newThemes.splice(parseInt(key, 10), 1);
                                                        } else {
                                                            delete newThemes[key];
                                                        }
                                                        setSavedThemes(newThemes);
                                                        localStorage.setItem('lumina_dev_themes', JSON.stringify(newThemes));
                                                    }} className="text-sm px-3 py-1 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded font-medium">Delete</button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Publish Targeting UI */}
            {isDevMode && showPublishModal && (
                <div id="dev-publish-modal" className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
                    <div id="dev-publish-modal-content" data-dev-id="dev-publish-modal-content" className="bg-card w-full max-w-sm rounded-2xl shadow-xl border border-border p-6 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
                            <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><Check className="w-5 h-5 text-green-500"/> Publish Options</h2>
                            <div className="flex items-center gap-2">
                                <button onClick={() => {
                                    const modal = document.getElementById('dev-publish-modal-content');
                                    if (modal) setSelectedElements([modal]);
                                }} className="text-[10px] uppercase font-black text-purple-600 bg-purple-500/20 px-2 py-0.5 rounded hover:bg-purple-500/40 border border-purple-500/30 transition-colors">Edit Window</button>
                                <button onClick={() => setShowPublishModal(false)} className="p-2 hover:bg-muted rounded-full">
                                    <X className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>
                        
                        <div className="space-y-4 mb-8">
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-foreground">Target Profiles</p>
                                <p className="text-xs text-muted-foreground leading-tight mb-3">Select which user roles these CSS changes should be logically scoped to.</p>
                            </div>
                            
                            <div className="space-y-2">
                                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${publishTarget === 'all' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`}>
                                    <input type="radio" checked={publishTarget === 'all'} onChange={() => setPublishTarget('all')} className="w-4 h-4 accent-primary" />
                                    <span className="font-semibold text-sm">Apply to All</span>
                                </label>
                                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${publishTarget === 'user' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`}>
                                    <input type="radio" checked={publishTarget === 'user'} onChange={() => setPublishTarget('user')} className="w-4 h-4 accent-primary" />
                                    <span className="font-semibold text-sm">Student Profiles</span>
                                </label>
                                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${publishTarget === 'tutor' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`}>
                                    <input type="radio" checked={publishTarget === 'tutor'} onChange={() => setPublishTarget('tutor')} className="w-4 h-4 accent-primary" />
                                    <span className="font-semibold text-sm">Tutor Profiles</span>
                                </label>
                                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${publishTarget === 'admin' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`}>
                                    <input type="radio" checked={publishTarget === 'admin'} onChange={() => setPublishTarget('admin')} className="w-4 h-4 accent-primary" />
                                    <span className="font-semibold text-sm">Admin Profiles</span>
                                </label>
                            </div>
                        </div>

                        <button onClick={executePublish} className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-md transition-colors flex justify-center items-center gap-2">
                            Commit & Publish
                        </button>
                    </div>
                </div>
            )}

            {/* Hover Highlight Overlay */}
            {isDevMode && hoveredElement && !selectedElements.includes(hoveredElement) && (
                <div 
                    className="fixed pointer-events-none z-[9998] border-2 border-orange-500 border-dashed bg-transparent flex items-start justify-end animate-pulse"
                    style={{
                        top: hoveredElement.getBoundingClientRect().top,
                        left: hoveredElement.getBoundingClientRect().left,
                        width: hoveredElement.getBoundingClientRect().width,
                        height: hoveredElement.getBoundingClientRect().height,
                    }}
                >
                    <div className="bg-orange-500 text-white p-1 rounded-bl-lg shadow-sm">
                        <Settings className="w-4 h-4" />
                    </div>
                </div>
            )}

            {/* Selected Elements Highlight Overlays */}
            {isDevMode && selectedElements.map((el, index) => {
                const rect = el.getBoundingClientRect();
                return (
                    <div 
                        key={`sel-highlight-${index}`}
                        className="fixed pointer-events-none z-[9998] border-2 border-purple-500 bg-purple-500/10 flex items-start justify-end shadow-md"
                        style={{
                            top: rect.top,
                            left: rect.left,
                            width: rect.width,
                            height: rect.height,
                        }}
                    >
                        <div className="bg-purple-500 text-white px-1.5 py-0.5 text-[9px] font-bold rounded-bl-lg flex items-center gap-1 shadow-sm">
                            <span>#{index + 1}</span>
                        </div>
                    </div>
                );
            })}

            {/* Editor Modal */}
            {isDevMode && selectedElements.length > 0 && (() => {
                const primaryElement = selectedElements[0];
                const selector = generateStructuralPath(primaryElement);
                if (!selector) return null;
                return (
                    <EditorModal 
                        key="dev-editor-modal"
                        element={primaryElement} 
                        elements={selectedElements}
                        isMultiSelectMode={isMultiSelectMode}
                        setIsMultiSelectMode={setIsMultiSelectMode}
                        isSyncEditingEnabled={isSyncEditingEnabled}
                        setIsSyncEditingEnabled={setIsSyncEditingEnabled}
                        syncBackground={syncBackground}
                        setSyncBackground={setSyncBackground}
                        syncBorders={syncBorders}
                        setSyncBorders={setSyncBorders}
                        syncText={syncText}
                        setSyncText={setSyncText}
                        currentStyles={currentOverrides[selector] || {}}
                        draftStyles={previewOverrides[selector] || {}}
                        onPreviewUpdate={(styles) => {
                            const newPreviews: Record<string, React.CSSProperties> = {};
                            selectedElements.forEach((el, index) => {
                                const sel = generateStructuralPath(el);
                                if (sel) {
                                    newPreviews[sel] = getFilteredStyles(styles, {
                                        background: isSyncEditingEnabled && syncBackground,
                                        borders: isSyncEditingEnabled && syncBorders,
                                        text: isSyncEditingEnabled && syncText
                                    }, index === 0);
                                }
                            });
                            setPreviewOverrides(prev => ({
                                ...prev,
                                ...newPreviews
                            }));
                        }}
                        onEditPanelRequest={() => {
                            const panel = document.getElementById('dev-editor-panel');
                            if (panel) setSelectedElements([panel]);
                        }}
                        onClose={() => {
                            setSelectedElements([]);
                            setSyncBackground(false);
                            setSyncBorders(false);
                            setSyncText(false);
                            setIsSyncEditingEnabled(false);
                        }} 
                        onSave={(styles) => {
                            let newOverrides = { ...currentOverrides };
                            selectedElements.forEach((el, index) => {
                                const sel = generateStructuralPath(el);
                                if (sel) {
                                    const filtered = getFilteredStyles(styles, {
                                        background: isSyncEditingEnabled && syncBackground,
                                        borders: isSyncEditingEnabled && syncBorders,
                                        text: isSyncEditingEnabled && syncText
                                    }, index === 0);
                                    newOverrides[sel] = { ...newOverrides[sel], ...filtered };
                                }
                            });
                            let newHistory = history.slice(0, currentIndex + 1);
                            newHistory.push(newOverrides);
                            if (newHistory.length > 30) {
                                newHistory = newHistory.slice(-30);
                            }
                            setHistory(newHistory);
                            setCurrentIndex(newHistory.length - 1);
                            setPreviewOverrides({});
                            setSelectedElements([]);
                            setSyncBackground(false);
                            setSyncBorders(false);
                            setSyncText(false);
                            setIsSyncEditingEnabled(false);
                        }}
                        onRevert={() => {
                            setPreviewOverrides({});
                            setSelectedElements([]);
                            setSyncBackground(false);
                            setSyncBorders(false);
                            setSyncText(false);
                            setIsSyncEditingEnabled(false);
                        }}
                    />
                );
            })()}
        </DevModeContext.Provider>
    );
};

interface EditorModalProps {
    element: HTMLElement;
    elements: HTMLElement[];
    isMultiSelectMode: boolean;
    setIsMultiSelectMode: (val: boolean) => void;
    isSyncEditingEnabled: boolean;
    setIsSyncEditingEnabled: (val: boolean) => void;
    syncBackground: boolean;
    setSyncBackground: (val: boolean) => void;
    syncBorders: boolean;
    setSyncBorders: (val: boolean) => void;
    syncText: boolean;
    setSyncText: (val: boolean) => void;
    currentStyles: React.CSSProperties;
    draftStyles: React.CSSProperties;
    onPreviewUpdate: (styles: React.CSSProperties) => void;
    onEditPanelRequest: () => void;
    onClose: () => void;
    onSave: (styles: React.CSSProperties) => void;
    onRevert: () => void;
}

const isColorLight = (color: string): boolean => {
    const cleaned = color.trim().toLowerCase();
    
    // Check transparent
    if (cleaned === 'transparent') return true;
    
    // Check theme variables
    if (cleaned.includes('--color-5') || cleaned.includes('--color-6') || cleaned.includes('--color-7')) {
        return false; // These are dark colors, so mix with white to lighten
    }
    if (cleaned.includes('--color-')) {
        return true; // Other theme colors (1, 2, 3, 4, 8, 9, 10) are light/medium, so mix with black to darken
    }
    
    // Check hex colors
    if (cleaned.startsWith('#')) {
        const hex = cleaned.substring(1);
        let r = 255, g = 255, b = 255;
        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        } else if (hex.length === 6) {
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        }
        // YIQ brightness formula
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness >= 128;
    }
    
    // Check rgb / rgba
    if (cleaned.startsWith('rgb')) {
        const matches = cleaned.match(/\d+/g);
        if (matches && matches.length >= 3) {
            const r = parseInt(matches[0]);
            const g = parseInt(matches[1]);
            const b = parseInt(matches[2]);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            return brightness >= 128;
        }
    }
    
    // Check hsl / hsla
    if (cleaned.startsWith('hsl')) {
        const matches = cleaned.match(/\d+/g);
        if (matches && matches.length >= 3) {
            const l = parseInt(matches[2]); // lightness %
            return l >= 50;
        }
    }
    
    return true; // Default to light
};

const EditorModal: React.FC<EditorModalProps> = ({ element, elements, isMultiSelectMode, setIsMultiSelectMode, isSyncEditingEnabled, setIsSyncEditingEnabled, syncBackground, setSyncBackground, syncBorders, setSyncBorders, syncText, setSyncText, currentStyles, draftStyles, onPreviewUpdate, onEditPanelRequest, onClose, onSave, onRevert }) => {
    const [localStylesHistory, setLocalStylesHistory] = useState<React.CSSProperties[]>([{ ...currentStyles, ...draftStyles }]);
    const [historyIndex, setHistoryIndex] = useState(0);

    const localStyles = localStylesHistory[historyIndex];
    
    const defaultPalette = [
        { name: 'Transparent', value: 'transparent' },
        { name: 'Color 1 (Light Cool Gray)', value: 'hsl(var(--color-1))' },
        { name: 'Color 2 (Taupe / Warm Grey)', value: 'hsl(var(--color-2))' },
        { name: 'Color 3 (Ochre / Sand)', value: 'hsl(var(--color-3))' },
        { name: 'Color 4 (Slate Blue)', value: 'hsl(var(--color-4))' },
        { name: 'Color 5 (Charcoal Blue)', value: 'hsl(var(--color-5))' },
        { name: 'Color 6 (Steel / Denim Blue)', value: 'hsl(var(--color-6))' },
        { name: 'Color 7 (Slate / Teal Green)', value: 'hsl(var(--color-7))' },
        { name: 'Color 8 (Sage Green)', value: 'hsl(var(--color-8))' },
        { name: 'Color 9 (Pale Olive)', value: 'hsl(var(--color-9))' },
        { name: 'Color 10 (Sandy Wheat)', value: 'hsl(var(--color-10))' }
    ];

    const [palette, setPalette] = useState<{name: string, value: string}[]>(() => {
        const saved = localStorage.getItem('dev_palette');
        return saved ? JSON.parse(saved) : defaultPalette;
    });

    const [isEditingPalette, setIsEditingPalette] = useState(false);
    const [newColorName, setNewColorName] = useState('');
    const [newColorValue, setNewColorValue] = useState('#ffffff');

    const handleAddColor = () => {
        if (!newColorValue.trim()) return;
        const finalName = newColorName.trim() ? newColorName.trim() : `Custom ${newColorValue}`;
        const newPalette = [...palette, { name: finalName, value: newColorValue }];
        setPalette(newPalette);
        localStorage.setItem('dev_palette', JSON.stringify(newPalette));
        setNewColorName('');
        setNewColorValue('#ffffff');
    };

    const handleRemoveColor = (idx: number) => {
        const newPalette = [...palette];
        newPalette.splice(idx, 1);
        setPalette(newPalette);
        localStorage.setItem('dev_palette', JSON.stringify(newPalette));
    };

    const renderPaletteGrid = (propToUpdate: 'backgroundColor' | 'color' | 'borderColor') => {
        const currentBase = (localStyles[`_${propToUpdate}Base` as keyof React.CSSProperties] as string) || 'transparent';
        const currentStrengthStr = localStyles[`_${propToUpdate}Strength` as keyof React.CSSProperties] as string;
        const currentStrength = currentStrengthStr ? parseInt(currentStrengthStr, 10) : 100;
        const currentOpacityStr = localStyles[`_${propToUpdate}Opacity` as keyof React.CSSProperties] as string;
        const currentOpacity = currentOpacityStr ? parseInt(currentOpacityStr, 10) : 100;

        return (
            <div className="flex flex-col gap-2">
                <div className="grid grid-cols-5 gap-y-3 gap-x-2">
                    {palette.map((c, idx) => (
                        <div key={`pal-${idx}-${c.value}`} className="relative flex justify-center">
                            <button 
                                type="button"
                                onClick={() => {
                                    if (isEditingPalette) {
                                        handleRemoveColor(idx);
                                    } else {
                                        applyColorWithOptions(propToUpdate, c.value, 100);
                                    }
                                }} 
                                className={`w-8 h-8 rounded-full border shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-color4 ${(currentBase === c.value) && !isEditingPalette ? 'border-color1 scale-110 ring-2 ring-color4' : 'border-color1/40'} ${isEditingPalette ? 'hover:scale-90 opacity-80' : 'active:scale-95'}`} 
                                style={{ backgroundColor: c.value === 'transparent' ? '#ccc' : c.value }} 
                                title={isEditingPalette ? `Remove ${c.name}` : c.name}
                            />
                            {isEditingPalette && (
                                <div className="absolute -top-1.5 -right-0.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] pointer-events-none shadow-sm shadow-black/50 border border-white/20">x</div>
                            )}
                        </div>
                    ))}
                    
                    {!isEditingPalette && (
                        <div className="relative flex justify-center items-center">
                            <label className="w-8 h-8 rounded-full border border-color1/40 shadow-sm flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform overflow-hidden" title="Custom Color" style={{ background: 'conic-gradient(#ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' }}>
                                <input type="color" className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" onChange={(e) => applyColorWithOptions(propToUpdate, e.target.value, 100)} />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                                    <Plus className="w-5 h-5 text-white drop-shadow-md" />
                                </div>
                            </label>
                        </div>
                    )}
                </div>
                
                {/* Strength Slider */}
                <div className="mt-2 bg-color6/20 p-2 rounded-lg border border-color6/20">
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-color1/80 mb-2">
                        <span>Color Strength</span>
                        <div className="flex items-center gap-1">
                            <input type="number" min="0" max="100" value={currentStrength} onChange={e => {
                                let val = parseInt(e.target.value);
                                if(isNaN(val)) val = 100;
                                applyColorWithOptions(propToUpdate, currentBase, Math.min(100, Math.max(0, val)));
                            }} className="w-10 bg-color5/50 border border-color6 text-right px-1 py-0.5 rounded outline-none" />
                            <span>%</span>
                        </div>
                    </div>
                    <input type="range" min="0" max="100" value={currentStrength} onChange={e => applyColorWithOptions(propToUpdate, currentBase, parseInt(e.target.value))} className="w-full h-1.5 bg-color6/50 rounded-lg appearance-none cursor-pointer mb-3 accent-color4" />
                    <div className="flex justify-between gap-1">
                        {[100, 75, 50, 25, 0].map(pct => (
                            <button key={pct} onClick={() => applyColorWithOptions(propToUpdate, currentBase, pct)} className={`flex-1 text-[10px] font-bold py-1 rounded transition-colors ${currentStrength === pct ? 'bg-color4 text-color1 scale-105' : 'bg-color5 text-color1/60 hover:text-color1 hover:bg-color5/80'}`}>
                                {pct}%
                            </button>
                        ))}
                    </div>
                </div>

                {/* Opacity / Transparency Slider */}
                <div className="mt-2 bg-color6/20 p-2 rounded-lg border border-color6/20">
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-color1/80 mb-2">
                        <span>Opacity (Solidness)</span>
                        <div className="flex items-center gap-1">
                            <input type="number" min="0" max="100" value={currentOpacity} onChange={e => {
                                let val = parseInt(e.target.value);
                                if(isNaN(val)) val = 100;
                                applyColorWithOptions(propToUpdate, currentBase, currentStrength, Math.min(100, Math.max(0, val)));
                            }} className="w-10 bg-color5/50 border border-color6 text-right px-1 py-0.5 rounded outline-none" />
                            <span>%</span>
                        </div>
                    </div>
                    <input type="range" min="0" max="100" value={currentOpacity} onChange={e => applyColorWithOptions(propToUpdate, currentBase, currentStrength, parseInt(e.target.value))} className="w-full h-1.5 bg-color6/50 rounded-lg appearance-none cursor-pointer mb-3 accent-color4" />
                    <div className="flex justify-between gap-1">
                        {[100, 75, 50, 25, 0].map(pct => (
                            <button key={pct} onClick={() => applyColorWithOptions(propToUpdate, currentBase, currentStrength, pct)} className={`flex-1 text-[10px] font-bold py-1 rounded transition-colors ${currentOpacity === pct ? 'bg-color4 text-color1 scale-105' : 'bg-color5 text-color1/60 hover:text-color1 hover:bg-color5/80'}`}>
                                {pct}%
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    };
    const [customText, setCustomText] = useState(element.textContent || '');

    useEffect(() => {
        onPreviewUpdate(localStyles);
    }, [localStyles]);

    const updateStyle = (key: string, value: string) => {
        const newHistory = localStylesHistory.slice(0, historyIndex + 1);
        newHistory.push({ ...localStyles, [key as keyof React.CSSProperties]: value });
        setLocalStylesHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const applyColorWithOptions = (
        prop: 'backgroundColor' | 'color' | 'borderColor', 
        baseVal: string, 
        strength: number,
        opacity?: number
    ) => {
        const newHistory = localStylesHistory.slice(0, historyIndex + 1);
        
        // Retrieve current values if not provided
        const currentOpacityStr = localStyles[`_${prop}Opacity` as keyof React.CSSProperties] as string;
        const finalOpacity = opacity !== undefined ? opacity : (currentOpacityStr ? parseInt(currentOpacityStr, 10) : 100);
        
        const mixTarget = isColorLight(baseVal) ? 'black' : 'white';
        const solidColor = baseVal === 'transparent' ? 'transparent' : `color-mix(in srgb, ${baseVal} ${strength}%, ${mixTarget})`;
        const finalColor = (solidColor === 'transparent' || finalOpacity === 100) 
            ? solidColor 
            : `color-mix(in srgb, ${solidColor} ${finalOpacity}%, transparent)`;
            
        newHistory.push({ 
            ...localStyles, 
            [prop]: finalColor,
            [`_${prop}Base` as keyof React.CSSProperties]: baseVal,
            [`_${prop}Strength` as keyof React.CSSProperties]: strength.toString(),
            [`_${prop}Opacity` as keyof React.CSSProperties]: finalOpacity.toString()
        });
        setLocalStylesHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const updateElementText = (el: HTMLElement, val: string) => {
        if (el.isConnected) {
            el.textContent = val;
        } else if (el.id) {
            const liveEl = document.getElementById(el.id);
            if (liveEl) liveEl.textContent = val;
        }
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setCustomText(val);
        updateElementText(element, val);
        if (elements.length > 1 && isSyncEditingEnabled && syncText) {
            elements.forEach((el, idx) => {
                if (idx > 0) {
                    updateElementText(el, val);
                }
            });
        }
    };

    return (
        <div id="dev-editor-panel" data-dev-id="dev-tools-panel" className="fixed top-20 right-4 w-80 bg-color5 text-color1 border-2 border-color6 shadow-2xl rounded-2xl z-[100000] flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-8 transition-colors">
            <div className="bg-color6/30 p-4 flex items-center justify-between border-b border-color6/50">
                <span className="font-bold text-color1 flex items-center gap-2"><Palette className="w-5 h-5"/> Dev Stylist</span>
                <div className="flex items-center gap-1">
                    <button onClick={onEditPanelRequest} className="text-[10px] uppercase font-black text-purple-600 bg-purple-500/20 px-2 py-0.5 rounded hover:bg-purple-500/40 border border-purple-500/30 transition-colors mr-1">Edit Stylist</button>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded text-color1/70 transition-colors"><X className="w-5 h-5"/></button>
                </div>
            </div>
            
            <div className="p-4 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar text-sm">
                
                {/* Selection Mode Control */}
                <div className="bg-color6/20 p-3 rounded-xl border border-color6/30 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-color4 text-xs uppercase tracking-wider">Selection Mode</span>
                        <span className="text-[10px] bg-color4/20 text-color4 px-2 py-0.5 rounded-full font-bold">
                            {elements.length} selected
                        </span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer select-none py-1">
                        <input 
                            type="checkbox" 
                            checked={isMultiSelectMode} 
                            onChange={(e) => setIsMultiSelectMode(e.target.checked)} 
                            className="w-4 h-4 rounded border-color6 bg-color5 accent-color4 cursor-pointer" 
                        />
                        <span className="text-xs font-semibold text-color1/80">Multi-Select (Ctrl/Cmd + click to add)</span>
                    </label>
                    {elements.length > 1 && (
                        <label className="flex items-center gap-2 cursor-pointer select-none py-1 border-t border-color6/20 pt-2 mt-1">
                            <input 
                                type="checkbox" 
                                checked={isSyncEditingEnabled} 
                                onChange={(e) => {
                                    setIsSyncEditingEnabled(e.target.checked);
                                    if (!e.target.checked) {
                                        setSyncBackground(false);
                                        setSyncBorders(false);
                                        setSyncText(false);
                                        setTimeout(() => onPreviewUpdate(localStyles), 0);
                                    }
                                }} 
                                className="w-4 h-4 rounded border-color6 bg-color5 accent-color4 cursor-pointer" 
                            />
                            <span className="text-xs font-semibold text-color1/80">Synchronized Editing</span>
                        </label>
                    )}
                </div>
                
                {/* Background Color */}
                <div className="space-y-5">
                    <div className="flex items-center justify-between border-b border-color6/30 pb-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-color4">Background</h3>
                            {elements.length > 1 && isSyncEditingEnabled && (
                                <label className="flex items-center gap-1 cursor-pointer select-none text-[10px] text-color1/60 hover:text-color1">
                                    <input 
                                        type="checkbox" 
                                        checked={syncBackground} 
                                        onChange={(e) => {
                                            setSyncBackground(e.target.checked);
                                            setTimeout(() => onPreviewUpdate(localStyles), 0);
                                        }} 
                                        className="w-3.5 h-3.5 rounded border-color6 bg-color5 accent-color4 cursor-pointer" 
                                    />
                                    <span>Sync</span>
                                </label>
                            )}
                        </div>
                        <button onClick={() => setIsEditingPalette(!isEditingPalette)} className="text-xs text-color1/70 hover:text-color1 underline">
                            {isEditingPalette ? 'Done Editing' : 'Edit Palette'}
                        </button>
                    </div>

                    {isEditingPalette && (
                        <div className="bg-color6/10 border border-color6/30 p-3 rounded-lg flex flex-col gap-2">
                            <label className="text-xs font-bold text-color1/90 border-b border-color6/20 pb-1 uppercase tracking-wider">Add Custom Color</label>
                            <div className="flex flex-col gap-2">
                                <input type="text" value={newColorName} onChange={e => setNewColorName(e.target.value)} placeholder="Color Name (e.g., Bright Red)" className="w-full bg-color5 border border-color6 text-color1 rounded p-1.5 text-xs outline-none focus:border-color4" />
                                <div className="flex gap-2">
                                    <input type="color" value={newColorValue.startsWith('#') ? newColorValue : '#ffffff'} onChange={e => setNewColorValue(e.target.value)} className="w-8 h-8 rounded shrink-0 bg-transparent border-none cursor-pointer" />
                                    <input type="text" value={newColorValue} onChange={e => setNewColorValue(e.target.value)} placeholder="Hex or rgb/hsl" className="flex-1 bg-color5 border border-color6 text-color1 rounded p-1.5 text-xs outline-none focus:border-color4" />
                                </div>
                            </div>
                            <button type="button" onClick={handleAddColor} className="mt-1 bg-color4 text-color1 rounded p-1.5 text-xs font-bold hover:bg-color4/90 flex items-center justify-center gap-1 transition-colors"><Plus className="w-3 h-3"/> Add to Palette</button>
                        </div>
                    )}
                    
                    <div className="bg-color5/30 p-2 rounded-lg border border-color6/10">
                        <label className="block mb-2 font-semibold text-color1 text-xs uppercase tracking-wider">Background Color</label>
                        {renderPaletteGrid('backgroundColor')}
                    </div>
                </div>

                {/* Border Options */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-color6/30 pb-1 mt-2">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-color4 flex items-center gap-2"><Square className="w-4 h-4"/> Borders</h3>
                            {elements.length > 1 && isSyncEditingEnabled && (
                                <label className="flex items-center gap-1 cursor-pointer select-none text-[10px] text-color1/60 hover:text-color1">
                                    <input 
                                        type="checkbox" 
                                        checked={syncBorders} 
                                        onChange={(e) => {
                                            setSyncBorders(e.target.checked);
                                            setTimeout(() => onPreviewUpdate(localStyles), 0);
                                        }} 
                                        className="w-3.5 h-3.5 rounded border-color6 bg-color5 accent-color4 cursor-pointer" 
                                    />
                                    <span>Sync</span>
                                </label>
                            )}
                        </div>
                    </div>
                    
                    <div className="bg-color5/30 p-2 rounded-lg border border-color6/10">
                        <label className="block mb-2 font-semibold text-color1 text-xs uppercase tracking-wider">Border Color</label>
                        {renderPaletteGrid('borderColor')}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1 font-medium text-xs text-color1/80">Width</label>
                            <select value={localStyles.borderWidth as string || ''} onChange={(e) => updateStyle('borderWidth', e.target.value)} className="w-full bg-color5 border border-color6/50 text-color1 rounded p-1 outline-none focus:border-color4">
                                <option value="">Default</option>
                                <option value="0px">0px</option>
                                <option value="1px">1px</option>
                                <option value="2px">2px</option>
                                <option value="4px">4px</option>
                                <option value="8px">8px</option>
                            </select>
                        </div>
                        <div>
                            <label className="block mb-1 font-medium text-xs text-color1/80">Radius (Shape)</label>
                            <select value={localStyles.borderRadius as string || ''} onChange={(e) => updateStyle('borderRadius', e.target.value)} className="w-full bg-color5 border border-color6/50 text-color1 rounded p-1 outline-none focus:border-color4">
                                <option value="">Default</option>
                                <option value="0px">0 (Square)</option>
                                <option value="0.5rem">8px (lg)</option>
                                <option value="1rem">16px (2xl)</option>
                                <option value="9999px">Pill / Circle</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Typography */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-color6/30 pb-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-color4 flex items-center gap-2"><Type className="w-4 h-4"/> Typography</h3>
                            {elements.length > 1 && isSyncEditingEnabled && (
                                <label className="flex items-center gap-1 cursor-pointer select-none text-[10px] text-color1/60 hover:text-color1">
                                    <input 
                                        type="checkbox" 
                                        checked={syncText} 
                                        onChange={(e) => {
                                            setSyncText(e.target.checked);
                                            setTimeout(() => onPreviewUpdate(localStyles), 0);
                                        }} 
                                        className="w-3.5 h-3.5 rounded border-color6 bg-color5 accent-color4 cursor-pointer" 
                                    />
                                    <span>Sync</span>
                                </label>
                            )}
                        </div>
                    </div>
                    
                    <div className="bg-color5/30 p-2 rounded-lg border border-color6/10">
                        <label className="block mb-2 font-semibold text-color1 text-xs uppercase tracking-wider">Text Color</label>
                        {renderPaletteGrid('color')}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1 font-medium text-xs text-color1/80">Size</label>
                            <select value={localStyles.fontSize as string || ''} onChange={(e) => updateStyle('fontSize', e.target.value)} className="w-full bg-color5 border border-color6/50 text-color1 rounded p-1 outline-none focus:border-color4">
                                <option value="">Default</option>
                                <option value="0.75rem">xs</option>
                                <option value="1rem">base</option>
                                <option value="1.25rem">xl</option>
                                <option value="1.5rem">2xl</option>
                                <option value="2.25rem">4xl</option>
                            </select>
                        </div>
                        <div>
                            <label className="block mb-1 font-medium text-xs text-color1/80">Weight</label>
                            <select value={localStyles.fontWeight as string || ''} onChange={(e) => updateStyle('fontWeight', e.target.value)} className="w-full bg-color5 border border-color6/50 text-color1 rounded p-1 outline-none focus:border-color4">
                                <option value="">Default</option>
                                <option value="400">Normal</option>
                                <option value="600">SemiBold</option>
                                <option value="700">Bold</option>
                                <option value="900">Black</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block mb-1 font-medium text-xs text-color1/80">Font Family</label>
                        <select value={localStyles.fontFamily as string || ''} onChange={(e) => updateStyle('fontFamily', e.target.value)} className="w-full bg-color5 border border-color6/50 text-color1 rounded p-1 outline-none focus:border-color4">
                            <option value="">Default (Inter/Outfit)</option>
                            <option value="serif">Serif (Elegant)</option>
                            <option value="monospace">Monospace (Code)</option>
                        </select>
                    </div>
                </div>

                {/* Content Edition */}
                <div className="space-y-4">
                    <h3 className="font-bold text-color4 border-b border-color6/30 pb-1 flex items-center gap-2 mt-2"><Type className="w-4 h-4"/> Content</h3>
                    
                    <div className="bg-color5/30 p-2 rounded-lg border border-color6/10">
                        <label className="block mb-2 font-semibold text-color1 text-xs uppercase tracking-wider text-green-500/80">Local Text Mockup</label>
                        <p className="text-[10px] text-color1/50 mb-2 leading-tight">Changes made here are strictly for local mockup visualization and will not be natively published to the codebase via CSS overrides. Text must be altered in source code.</p>
                        <textarea 
                            value={customText} 
                            onChange={handleTextChange} 
                            placeholder="Type here to replace the element's actual text content..."
                            className="w-full h-24 bg-color5 border border-color6/50 text-color1 rounded-md p-2 text-xs outline-none focus:border-color4 focus:ring-1 focus:ring-color4 resize-y custom-scrollbar"
                        />
                    </div>
                </div>

            </div>
            
            <div className="p-4 grid grid-cols-3 gap-2 bg-color6/20 border-t border-color6/50">
                <button onClick={() => { onRevert(); onClose(); }} className="px-2 py-2 bg-color1/10 hover:bg-color1/20 text-color1 rounded-lg font-bold text-xs transition-colors" title="Discard edits and close">
                    Revert
                </button>
                <button disabled={historyIndex === 0} onClick={() => { if (historyIndex > 0) setHistoryIndex(historyIndex - 1); }} className={`px-2 py-2 bg-color1/10 hover:bg-color1/20 text-color1 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-colors ${historyIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <Undo className="w-3 h-3"/> Undo
                </button>
                <button onClick={() => onSave(localStyles)} className="px-2 py-2 bg-color4 hover:bg-color4/90 text-color1 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-colors">
                    <Save className="w-3 h-3"/> Save
                </button>
            </div>
        </div>
    );
};
