import re

p = "src/components/ProfilePage.tsx"

with open(p, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Contact Info Section
text = text.replace('''<Section onSave={handleSaveProfile} title="Contact Info" icon={Mail} colorTheme="primary">
                            <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">''', '''<Section onSave={handleSaveProfile} title="Contact Info" icon={Mail} colorTheme="primary">
                            <EditContextConsumer>
                            {isEditing => (
                            <>
                            <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">''')

text = text.replace('''                                    setEditForm={setEditForm}
                                />
                            </div>
                        </Section>

                        <div id="section-location" className="scroll-mt-6">''', '''                                    setEditForm={setEditForm}
                                />
                            </div>
                            </>
                            )}
                            </EditContextConsumer>
                        </Section>

                        <div id="section-location" className="scroll-mt-6">''')

# 2. Location Section
text = text.replace('''<Section onSave={handleSaveProfile} title="Location" icon={MapPin} colorTheme="secondary">
                                {isEditing && (''', '''<Section onSave={handleSaveProfile} title="Location" icon={MapPin} colorTheme="secondary">
                            <EditContextConsumer>
                            {isEditing => (
                            <>
                                {isEditing && (''')

text = text.replace('''                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Current City" value={editForm.currentCity} fieldKey="currentCity" setEditForm={setEditForm} />
                                    <Field label="Current Country" value={editForm.currentCountry} fieldKey="currentCountry" setEditForm={setEditForm} />
                                </div>
                            </Section>

                        <Section onSave={handleSaveProfile} title="Personal" icon={User} colorTheme="accent">''', '''                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Current City" value={editForm.currentCity} fieldKey="currentCity" setEditForm={setEditForm} />
                                    <Field label="Current Country" value={editForm.currentCountry} fieldKey="currentCountry" setEditForm={setEditForm} />
                                </div>
                            </>
                            )}
                            </EditContextConsumer>
                            </Section>

                        <Section onSave={handleSaveProfile} title="Personal" icon={User} colorTheme="accent">''')

# 3. Security Section
text = text.replace('''<Section onSave={handleSaveProfile} title="Security" icon={Lock} colorTheme="default">
                            {!isEditing && (''', '''<Section onSave={handleSaveProfile} title="Security" icon={Lock} colorTheme="default">
                            <EditContextConsumer>
                            {isEditing => (
                            <>
                            {!isEditing && (''')

text = text.replace('''                            {isEditing && <p className="text-muted-foreground text-sm italic">Finish editing profile to change password.</p>}
                        </Section>

                        <Section onSave={handleSaveProfile} title="Flashcard Management" icon={Book} colorTheme="default">''', '''                            {isEditing && <p className="text-muted-foreground text-sm italic">Finish editing profile to change password.</p>}
                            </>
                            )}
                            </EditContextConsumer>
                        </Section>

                        <Section onSave={handleSaveProfile} title="Flashcard Management" icon={Book} colorTheme="default">''')

with open(p, 'w', encoding='utf-8') as f:
    f.write(text)

print("Wrappers applied!")
