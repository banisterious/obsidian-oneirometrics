import { Setting, SearchComponent } from "obsidian";

// TODO: Switch the Settings Icon Picker to use Obsidian's built-in icons instead of bundled lucide-static icons.

// Folder autocomplete
// @ts-expect-error Object is possibly 'undefined'.
if (this.plugin!.settings.selectionMode === 'folder') {
    // @ts-expect-error Object is possibly 'undefined'.
    const selectionSetting = new Setting(this.containerEl!)
        .setName("Folder")
        .setDesc("Choose a folder...");
    selectionSetting.addSearch((search: SearchComponent) => {
        search.setPlaceholder('Choose folder...');
        // @ts-expect-error Object is possibly 'undefined'.
        search.setValue(this.plugin!.settings.selectedFolder || '');
        // @ts-expect-error Object is possibly 'undefined'.
        const parentForSuggestions = search.inputEl?.parentElement ?? this.containerEl!;
        parentForSuggestions.createEl('div', {
            cls: 'oom-suggestion-container'
        });
    });
}

// Backup Folder Path (only shown when backups are enabled)
// @ts-expect-error Object is possibly 'undefined'.
if (this.plugin!.settings.backupEnabled) {
    // @ts-expect-error Object is possibly 'undefined'.
    const backupFolderSetting = new Setting(this.containerEl!)
        .setName('Backup Folder')
        .setDesc('Select an existing folder where backups will be stored')
        .addSearch((search: SearchComponent) => {
            search
                .setPlaceholder('Choose backup folder...')
                // @ts-expect-error Object is possibly 'undefined'.
                .setValue(this.plugin!.settings.backupFolderPath);
            // @ts-expect-error Object is possibly 'undefined'.
            const parentForSuggestions = search.inputEl?.parentElement ?? this.containerEl!;
            parentForSuggestions.createEl('div', {
                cls: 'oom-suggestion-container'
            });
        });
} 