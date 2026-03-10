import re

p = "src/components/ProfilePage.tsx"

with open(p, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Remove ALL instances of `isEditing={isEditing}`
text = re.sub(r'\s*isEditing={isEditing}', '', text)

# 2. Add EditContextConsumer to Identity & Context (Display Name)
text = text.replace('''<label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Display Name</label>
                                {isEditing ? (''', '''<label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Display Name</label>
                                <EditContextConsumer>
                                    {isEditing => isEditing ? (''')
text = text.replace('''<span className={!editForm.tutorData.displayName ? 'text-muted-foreground italic' : ''}>{editForm.tutorData.displayName || 'Not set'}</span>
                                    </div>
                                )}
                            </div>''', '''<span className={!editForm.tutorData.displayName ? 'text-muted-foreground italic' : ''}>{editForm.tutorData.displayName || 'Not set'}</span>
                                    </div>
                                )}
                                </EditContextConsumer>
                            </div>''')

# 3. Add EditContextConsumer to Linguistic Profile grid
text = text.replace('''<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 mb-4">
                                <div>''', '''<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 mb-4">
                                <EditContextConsumer>
                                    {isEditing => (
                                        <>
                                            <div>''')
text = text.replace('''<span className={!editForm.tutorData.originType ? 'text-muted-foreground italic' : ''}>{editForm.tutorData.originType || 'Not set'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>''', '''<span className={!editForm.tutorData.originType ? 'text-muted-foreground italic' : ''}>{editForm.tutorData.originType || 'Not set'}</span>
                                        </div>
                                    )}
                                </div>
                                        </>
                                    )}
                                </EditContextConsumer>
                            </div>''')

# 4. Bio & Philosophy
text = text.replace('''<label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Bio & Philosophy</label>
                                {isEditing ? (''', '''<label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Bio & Philosophy</label>
                                <EditContextConsumer>
                                    {isEditing => isEditing ? (''')
text = text.replace('''<span className={!editForm.tutorData.bio ? 'text-muted-foreground italic' : ''}>{editForm.tutorData.bio || 'No bio.'}</span>
                                    </div>
                                )}
                            </div>''', '''<span className={!editForm.tutorData.bio ? 'text-muted-foreground italic' : ''}>{editForm.tutorData.bio || 'No bio.'}</span>
                                    </div>
                                )}
                                </EditContextConsumer>
                            </div>''')

# 5. Years of Experience
text = text.replace('''<label className="text-xs font-semibold text-muted-foreground uppercase">Years of Experience</label>
                                {isEditing ? (''', '''<label className="text-xs font-semibold text-muted-foreground uppercase">Years of Experience</label>
                                <EditContextConsumer>
                                    {isEditing => isEditing ? (''')
text = text.replace('''<span className={!editForm.tutorData.yearsExperience ? 'text-muted-foreground italic' : ''}>{editForm.tutorData.yearsExperience || '0'} years</span>
                                    </div>
                                )}
                            </div>''', '''<span className={!editForm.tutorData.yearsExperience ? 'text-muted-foreground italic' : ''}>{editForm.tutorData.yearsExperience || '0'} years</span>
                                    </div>
                                )}
                                </EditContextConsumer>
                            </div>''')

# 6. Logistics & Pricing
text = text.replace('''<Section onSave={handleSaveProfile} title="Logistics & Pricing" icon={Settings} colorTheme="muted">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">''', '''<Section onSave={handleSaveProfile} title="Logistics & Pricing" icon={Settings} colorTheme="muted">
                            <EditContextConsumer>
                                {isEditing => (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">''')
text = text.replace('''<span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Offers Trial Lesson</span>
                                    </label>
                                </div>
                            </div>
                        </Section>''', '''<span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Offers Trial Lesson</span>
                                    </label>
                                </div>
                            </div>
                                )}
                            </EditContextConsumer>
                        </Section>''')

with open(p, 'w', encoding='utf-8') as f:
    f.write(text)

print("Wrappers applied!")
