import React, { useState } from 'react';
import { AppSettings, CategoryStyle } from '../types';
import { Plus, Trash2, Palette } from 'lucide-react';

interface CategoryManagerProps {
    settings: AppSettings;
    onSave: (newSettings: AppSettings) => void;
}

const DEFAULT_STYLE: CategoryStyle = {
    backgroundColor: '#ffffff',
    titleColor: '#000000',
    textColor: '#4b5563',
    borderColor: '#e5e7eb'
};

const PRESET_COLORS = [
    '#fecaca', '#fed7aa', '#fde68a', '#bbf7d0', '#bfdbfe', '#c7d2fe', '#e9d5ff', '#fbcfe8',
    '#ffffff', '#f3f4f6', '#e5e7eb'
];

const PRESET_TEXT_COLORS = [
    '#000000', '#1f2937', '#374151', '#4b5563',
    '#dc2626', '#ea580c', '#d97706', '#16a34a', '#2563eb', '#4f46e5', '#9333ea', '#db2777'
];

export function CategoryManager({ settings, onSave }: CategoryManagerProps) {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(Object.keys(settings.categories)[0] || null);

    const handleAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        const updatedSettings = {
            ...settings,
            categories: {
                ...settings.categories,
                [newCategoryName.trim()]: { ...DEFAULT_STYLE }
            }
        };
        onSave(updatedSettings);
        setActiveCategory(newCategoryName.trim());
        setNewCategoryName('');
    };

    const handleDeleteCategory = (category: string) => {
        if (Object.keys(settings.categories).length <= 1) {
            alert("You must have at least one category.");
            return;
        }
        if (confirm(`Delete category "${category}"? Cards will need to be reassigned.`)) {
            const newCats = { ...settings.categories };
            delete newCats[category];
            const updatedSettings = { ...settings, categories: newCats };
            onSave(updatedSettings);

            if (activeCategory === category) {
                setActiveCategory(Object.keys(newCats)[0]);
            }
        }
    };

    const updateCategoryStyle = (category: string, field: keyof CategoryStyle, value: string) => {
        const updatedSettings = {
            ...settings,
            categories: {
                ...settings.categories,
                [category]: {
                    ...settings.categories[category],
                    [field]: value
                }
            }
        };
        onSave(updatedSettings);
    };

    return (
        <div className="mt-12 pt-8 border-t border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Palette className="w-6 h-6 text-primary" />
                Category Customization
            </h2>

            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[500px]">
                {/* Sidebar */}
                <div className="w-full md:w-1/3 border-r border-border bg-secondary/10 flex flex-col">
                    <div className="p-4 border-b border-border">
                        <form onSubmit={handleAddCategory} className="flex gap-2">
                            <input
                                className="flex-1 px-3 py-2 rounded-lg bg-input border border-border text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                placeholder="New Category..."
                                value={newCategoryName}
                                onChange={e => setNewCategoryName(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={!newCategoryName.trim()}
                                className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 h-64 md:h-auto">
                        {Object.keys(settings.categories).map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all ${activeCategory === cat
                                    ? 'bg-primary/10 text-primary font-medium shadow-sm'
                                    : 'hover:bg-secondary text-muted-foreground'
                                    }`}
                            >
                                <span>{cat}</span>
                                {['Noun', 'Verb', 'Adjective'].includes(cat) ? null : (
                                    <div
                                        onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat); }}
                                        className="p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Editor */}
                <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                    {activeCategory && settings.categories[activeCategory] && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-foreground">Style: <span className="text-primary">{activeCategory}</span></h3>
                                <div className="flex gap-2">
                                    {/* Preview Card */}
                                    <div
                                        className="w-32 h-20 rounded-xl shadow-md border flex flex-col items-center justify-center p-2 transition-all"
                                        style={{
                                            backgroundColor: settings.categories[activeCategory].backgroundColor,
                                            borderColor: settings.categories[activeCategory].borderColor || 'transparent'
                                        }}
                                    >
                                        <span style={{ color: settings.categories[activeCategory].titleColor }} className="font-bold text-sm">Word</span>
                                        <span style={{ color: settings.categories[activeCategory].textColor }} className="text-xs">Definition</span>
                                    </div>
                                </div>
                            </div>

                            {/* Background Color */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-3">Background Color</label>
                                <div className="flex flex-wrap gap-3 mb-3">
                                    {PRESET_COLORS.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => updateCategoryStyle(activeCategory, 'backgroundColor', color)}
                                            className={`w-8 h-8 rounded-full border shadow-sm transition-transform hover:scale-110 ${settings.categories[activeCategory].backgroundColor === color ? 'ring-2 ring-primary ring-offset-2' : ''
                                                }`}
                                            style={{ backgroundColor: color }}
                                            title={color}
                                        />
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={settings.categories[activeCategory].backgroundColor}
                                        onChange={(e) => updateCategoryStyle(activeCategory, 'backgroundColor', e.target.value)}
                                        className="h-10 w-20 cursor-pointer rounded border border-border"
                                        title="Custom Color"
                                    />
                                    <span className="text-xs text-muted-foreground">Custom Hex</span>
                                </div>
                            </div>

                            {/* Title Color */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-3">Title Color</label>
                                <div className="flex flex-wrap gap-3 mb-3">
                                    {PRESET_TEXT_COLORS.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => updateCategoryStyle(activeCategory, 'titleColor', color)}
                                            className={`w-8 h-8 rounded-full border shadow-sm transition-transform hover:scale-110 ${settings.categories[activeCategory].titleColor === color ? 'ring-2 ring-primary ring-offset-2' : ''
                                                }`}
                                            style={{ backgroundColor: color }}
                                            title={color}
                                        />
                                    ))}
                                </div>
                                <input
                                    type="color"
                                    value={settings.categories[activeCategory].titleColor}
                                    onChange={(e) => updateCategoryStyle(activeCategory, 'titleColor', e.target.value)}
                                    className="h-10 w-20 cursor-pointer rounded border border-border"
                                />
                            </div>

                            {/* Text Color */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-3">Text Color (Definition/Example)</label>
                                <div className="flex flex-wrap gap-3 mb-3">
                                    {PRESET_TEXT_COLORS.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => updateCategoryStyle(activeCategory, 'textColor', color)}
                                            className={`w-8 h-8 rounded-full border shadow-sm transition-transform hover:scale-110 ${settings.categories[activeCategory].textColor === color ? 'ring-2 ring-primary ring-offset-2' : ''
                                                }`}
                                            style={{ backgroundColor: color }}
                                            title={color}
                                        />
                                    ))}
                                </div>
                                <input
                                    type="color"
                                    value={settings.categories[activeCategory].textColor}
                                    onChange={(e) => updateCategoryStyle(activeCategory, 'textColor', e.target.value)}
                                    className="h-10 w-20 cursor-pointer rounded border border-border"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
