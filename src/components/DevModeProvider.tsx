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

export const DevModeProvider: React.FC<{ children: React.ReactNode; isAdmin: boolean }> = ({ children, isAdmin }) => {
    const [isDevMode, setIsDevMode] = useState(false);
    const [enableDevStyling, setEnableDevStyling] = useState(false);
    const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
    const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
    
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
        localStorage.setItem('lumina_dev_active_history', JSON.stringify(history));
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
            setSelectedElement(null);
            return;
        }

        if (!isDevMode) {
            setHoveredElement(null);
            setSelectedElement(null);
            return;
        }

        const isDevUI = (el: HTMLElement) => 
            el.closest('#dev-tools') || 
            el.closest('#dev-editor-panel') || 
            el.closest('#dev-theme-modal-content') || 
            el.closest('#dev-publish-modal-content');

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

            setHoveredElement(el);
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
                
                // Ensure the element has a unique ID or path for selection
                if (!hoveredElement.dataset.devId) {
                    hoveredElement.dataset.devId = 'dev-' + Math.random().toString(36).substr(2, 9);
                }
                
                if (selectedElement && selectedElement !== hoveredElement) {
                    // Auto-commit any unsaved drafts from the previous element to the global history
                    commitPreviewToHistory();
                }
                
                setSelectedElement(hoveredElement);
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
    }, [isDevMode, hoveredElement, selectedElement, previewOverrides, currentOverrides, currentIndex, history, enableDevStyling]);

    const commitPreviewToHistory = () => {
        if (Object.keys(previewOverrides).length === 0) return;
        
        let newOverrides = { ...currentOverrides };
        for (const [selector, rules] of Object.entries(previewOverrides)) {
            newOverrides[selector] = { ...newOverrides[selector], ...rules };
        }
        
        const newHistory = history.slice(0, currentIndex + 1);
        newHistory.push(newOverrides);
        setHistory(newHistory);
        setCurrentIndex(newHistory.length - 1);
        setPreviewOverrides({});
    };

    const handleApplyStyle = (newStyles: React.CSSProperties, commit: boolean = false) => {
        if (!selectedElement || !selectedElement.dataset.devId) return;
        const selector = `[data-dev-id="${selectedElement.dataset.devId}"]`;
        
        let newOverrides = { ...currentOverrides };
        newOverrides[selector] = { ...newOverrides[selector], ...newStyles };
        
        if (commit) {
            commitPreviewToHistory();
        }
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
            const newHistory = history.slice(0, currentIndex + 1);
            newHistory.push(newOverrides);
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
                        <div className="relative group flex flex-col items-center">
                            <button onClick={handleUndo} disabled={!canUndo} className={`p-2 rounded-full hover:bg-secondary transition-colors ${!canUndo ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <Undo className="w-5 h-5" />
                            </button>
                            <span id="tooltip-undo" className={`absolute -top-10 bg-card text-foreground border border-border shadow-md px-2 py-1 text-[10px] rounded transition-opacity whitespace-nowrap z-[10000] font-bold uppercase tracking-wider pointer-events-auto ${selectedElement?.id === 'tooltip-undo' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>Undo Last Change</span>
                        </div>
                        
                        <div className="relative group flex flex-col items-center">
                            <button onClick={handleRedo} disabled={!canRedo} className={`p-2 rounded-full hover:bg-secondary transition-colors ${!canRedo ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <Redo className="w-5 h-5" />
                            </button>
                            <span id="tooltip-redo" className={`absolute -top-10 bg-card text-foreground border border-border shadow-md px-2 py-1 text-[10px] rounded transition-opacity whitespace-nowrap z-[10000] font-bold uppercase tracking-wider pointer-events-auto ${selectedElement?.id === 'tooltip-redo' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>Redo Last Change</span>
                        </div>
                        
                        <div className="relative group flex flex-col items-center">
                            <button onClick={() => setShowPublishModal(true)} className="p-2 rounded-full bg-green-500/20 text-green-600 hover:bg-green-500/30 transition-colors flex items-center justify-center">
                                <Check className="w-5 h-5" />
                            </button>
                            <span id="tooltip-publish" className={`absolute -top-10 bg-card text-foreground border border-border shadow-md px-2 py-1 text-[10px] rounded transition-opacity whitespace-nowrap z-[10000] font-bold uppercase tracking-wider pointer-events-auto ${selectedElement?.id === 'tooltip-publish' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>Publish Changes</span>
                        </div>
                        
                        <div className="relative group flex flex-col items-center">
                            <button onClick={() => setShowThemeModal(true)} className="p-2 rounded-full bg-blue-500/20 text-blue-600 hover:bg-blue-500/30 transition-colors flex items-center justify-center">
                                <Bookmark className="w-5 h-5" />
                            </button>
                            <span id="tooltip-themes" className={`absolute -top-10 bg-card text-foreground border border-border shadow-md px-2 py-1 text-[10px] rounded transition-opacity whitespace-nowrap z-[10000] font-bold uppercase tracking-wider pointer-events-auto ${selectedElement?.id === 'tooltip-themes' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>Themes</span>
                        </div>
                        
                        <div className="relative group flex flex-col items-center">
                            <button onClick={() => { setHistory([{}]); setCurrentIndex(0); }} className="p-2 rounded-full bg-red-500/20 text-red-600 hover:bg-red-500/30 transition-colors flex items-center justify-center">
                                <X className="w-5 h-5" />
                            </button>
                            <span id="tooltip-discard" className={`absolute -top-10 bg-card text-foreground border border-border shadow-md px-2 py-1 text-[10px] rounded transition-opacity whitespace-nowrap z-[10000] font-bold uppercase tracking-wider pointer-events-auto ${selectedElement?.id === 'tooltip-discard' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>Discard Changes</span>
                        </div>
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
                                    if (modal) setSelectedElement(modal);
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
                                    if (modal) setSelectedElement(modal);
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
            {isDevMode && hoveredElement && !selectedElement && (
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
                        <Settings className="w-4 h-4" /> {/* The "Edit Pencil" equivalent */}
                    </div>
                </div>
            )}

            {/* Editor Modal */}
            {isDevMode && selectedElement && (
                <EditorModal 
                    key={selectedElement.dataset.devId || 'dev'}
                    element={selectedElement} 
                    currentStyles={selectedElement.dataset.devId ? currentOverrides[`[data-dev-id="${selectedElement.dataset.devId}"]`] || {} : {}}
                    draftStyles={selectedElement.dataset.devId ? previewOverrides[`[data-dev-id="${selectedElement.dataset.devId}"]`] || {} : {}}
                    onPreviewUpdate={(styles) => {
                        if(selectedElement.dataset.devId) {
                            setPreviewOverrides(prev => ({
                                ...prev,
                                [`[data-dev-id="${selectedElement.dataset.devId}"]`]: styles
                            }));
                        }
                    }}
                    onEditPanelRequest={() => {
                        const panel = document.getElementById('dev-editor-panel');
                        if (panel) setSelectedElement(panel);
                    }}
                    onClose={() => setSelectedElement(null)} 
                    onSave={(styles) => {
                        handleApplyStyle(styles, true);
                        if(selectedElement.dataset.devId) {
                            const newPreviews = {...previewOverrides};
                            delete newPreviews[`[data-dev-id="${selectedElement.dataset.devId}"]`];
                            setPreviewOverrides(newPreviews);
                        }
                        setSelectedElement(null);
                    }}
                    onRevert={() => {
                        if(selectedElement.dataset.devId) {
                            const newPreviews = {...previewOverrides};
                            delete newPreviews[`[data-dev-id="${selectedElement.dataset.devId}"]`];
                            setPreviewOverrides(newPreviews);
                        }
                        setSelectedElement(null);
                    }}
                />
            )}
        </DevModeContext.Provider>
    );
};

interface EditorModalProps {
    element: HTMLElement;
    currentStyles: React.CSSProperties;
    draftStyles: React.CSSProperties;
    onPreviewUpdate: (styles: React.CSSProperties) => void;
    onEditPanelRequest: () => void;
    onClose: () => void;
    onSave: (styles: React.CSSProperties) => void;
    onRevert: () => void;
}

const EditorModal: React.FC<EditorModalProps> = ({ element, currentStyles, draftStyles, onPreviewUpdate, onEditPanelRequest, onClose, onSave, onRevert }) => {
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
        if (!newColorName.trim() || !newColorValue.trim()) return;
        const newPalette = [...palette, { name: newColorName, value: newColorValue }];
        setPalette(newPalette);
        localStorage.setItem('dev_palette', JSON.stringify(newPalette));
        setNewColorName('');
        setNewColorValue('#ffffff');
    };

    const handleRemoveColor = (val: string) => {
        const newPalette = palette.filter(c => c.value !== val);
        setPalette(newPalette);
        localStorage.setItem('dev_palette', JSON.stringify(newPalette));
    };

    const renderPaletteGrid = (propToUpdate: 'backgroundColor' | 'color' | 'borderColor') => {
        const currentBase = (localStyles[`_${propToUpdate}Base` as keyof React.CSSProperties] as string) || 'transparent';
        const currentStrengthStr = localStyles[`_${propToUpdate}Strength` as keyof React.CSSProperties] as string;
        const currentStrength = currentStrengthStr ? parseInt(currentStrengthStr, 10) : 100;

        return (
            <div className="flex flex-col gap-2">
                <div className="grid grid-cols-5 gap-y-3 gap-x-2">
                    {palette.map(c => (
                        <div key={c.value} className="relative flex justify-center">
                            <button 
                                onClick={() => {
                                    if (isEditingPalette) {
                                        handleRemoveColor(c.value);
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

    const applyColorWithOptions = (prop: 'backgroundColor' | 'color' | 'borderColor', baseVal: string, strength: number) => {
        const newHistory = localStylesHistory.slice(0, historyIndex + 1);
        const finalColor = baseVal === 'transparent' ? 'transparent' : `color-mix(in srgb, ${baseVal} ${strength}%, transparent)`;
        newHistory.push({ 
            ...localStyles, 
            [prop]: finalColor,
            [`_${prop}Base` as keyof React.CSSProperties]: baseVal,
            [`_${prop}Strength` as keyof React.CSSProperties]: strength.toString()
        });
        setLocalStylesHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCustomText(e.target.value);
        if (element) {
            if (element.isConnected) {
                element.textContent = e.target.value;
            } else if (element.id) {
                const liveEl = document.getElementById(element.id);
                if (liveEl) liveEl.textContent = e.target.value;
            }
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
                
                {/* Background & Text Colors */}
                <div className="space-y-5">
                    <div className="flex items-center justify-between border-b border-color6/30 pb-1">
                        <h3 className="font-bold text-color4">Colors</h3>
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
                            <button onClick={handleAddColor} className="mt-1 bg-color4 text-color1 rounded p-1.5 text-xs font-bold hover:bg-color4/90 flex items-center justify-center gap-1 transition-colors"><Plus className="w-3 h-3"/> Add to Palette</button>
                        </div>
                    )}
                    
                    <div className="bg-color5/30 p-2 rounded-lg border border-color6/10">
                        <label className="block mb-2 font-semibold text-color1 text-xs uppercase tracking-wider">Background Color</label>
                        {renderPaletteGrid('backgroundColor')}
                    </div>
                    
                    <div className="bg-color5/30 p-2 rounded-lg border border-color6/10">
                        <label className="block mb-2 font-semibold text-color1 text-xs uppercase tracking-wider">Text Color</label>
                        {renderPaletteGrid('color')}
                    </div>
                </div>

                {/* Border Options */}
                <div className="space-y-4">
                    <h3 className="font-bold text-color4 border-b border-color6/30 pb-1 flex items-center gap-2 mt-2"><Square className="w-4 h-4"/> Borders</h3>
                    
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
                    <h3 className="font-bold text-color4 border-b border-color6/30 pb-1 flex items-center gap-2"><Type className="w-4 h-4"/> Typography</h3>
                    
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
