import os

old_p_path = "old_p.tsx"
profile_path = "src/components/ProfilePage.tsx"

with open(old_p_path, 'r', encoding='utf-8') as f:
    old_content = f.read()

with open(profile_path, 'r', encoding='utf-8') as f:
    new_content = f.read()

tabs_marker = "            {/* Tabs */}"
old_tabs_idx = old_content.find(tabs_marker)
rest_of_old = old_content[old_tabs_idx:]

new_tabs_idx = new_content.find(tabs_marker)
base_new_content = new_content[:new_tabs_idx]

# Remove the global save/cancel block properly
# It spans from "            {isEditing && (" to "            )}\n"
# It is exactly right before "            {/* --- Modals (Email/Password) --- */}"
modals_idx = rest_of_old.find("            {/* --- Modals (Email/Password) --- */}")
save_block_start = rest_of_old.rfind("            {isEditing && (", 0, modals_idx)
save_block_end = rest_of_old.find("            )}\n", save_block_start) + len("            )}\n\n")

if save_block_start != -1 and save_block_end != -1:
    rest_of_old = rest_of_old[:save_block_start] + rest_of_old[save_block_end:]

final_content = base_new_content + rest_of_old

with open(profile_path, 'w', encoding='utf-8') as f:
    f.write(final_content)
print("Restored exact base from old_p.tsx!")
