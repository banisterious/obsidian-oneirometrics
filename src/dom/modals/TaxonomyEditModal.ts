/**
 * TaxonomyEditModal
 * 
 * Modal components for editing Dream Taxonomy entities (clusters, vectors, themes).
 * Provides full CRUD operations with validation and accessibility support.
 */

import { App, Modal, Setting, Notice, setIcon } from 'obsidian';
import { 
    TaxonomyCluster, 
    TaxonomyVector, 
    TaxonomyTheme 
} from '../../types/taxonomy';
import { getTaxonomyManager } from '../../state/TaxonomyManager';
import safeLogger from '../../logging/safe-logger';

/**
 * Base modal for taxonomy editing operations
 */
abstract class TaxonomyEditModalBase extends Modal {
    protected taxonomyManager = getTaxonomyManager();
    protected onSave: () => void;
    protected onCancel?: () => void;

    constructor(app: App, onSave: () => void, onCancel?: () => void) {
        super(app);
        this.onSave = onSave;
        this.onCancel = onCancel;
    }

    onClose(): void {
        if (this.onCancel) {
            this.onCancel();
        }
    }

    /**
     * Create the footer with action buttons
     */
    protected createFooter(container: HTMLElement): void {
        const footer = container.createDiv({ cls: 'oom-modal-footer' });
        
        const buttonContainer = footer.createDiv({ cls: 'oom-modal-buttons' });
        
        // Cancel button
        const cancelBtn = buttonContainer.createEl('button', {
            text: 'Cancel',
            cls: 'oom-button'
        });
        cancelBtn.addEventListener('click', () => {
            this.close();
        });
        
        // Save button
        const saveBtn = buttonContainer.createEl('button', {
            text: 'Save',
            cls: 'oom-button oom-primary'
        });
        saveBtn.addEventListener('click', () => {
            if (this.validate()) {
                this.save();
            }
        });
    }

    /**
     * Validate form inputs
     */
    protected abstract validate(): boolean;

    /**
     * Save the changes
     */
    protected abstract save(): void;
}

/**
 * Modal for editing cluster properties
 */
export class ClusterEditModal extends TaxonomyEditModalBase {
    private cluster?: TaxonomyCluster;
    private isNew: boolean;
    private nameInput: HTMLInputElement;
    private descriptionInput: HTMLTextAreaElement;
    private colorInput: HTMLInputElement;

    constructor(
        app: App,
        cluster: TaxonomyCluster | undefined,
        onSave: () => void,
        onCancel?: () => void
    ) {
        super(app, onSave, onCancel);
        this.cluster = cluster;
        this.isNew = !cluster;
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('oom-taxonomy-edit-modal');

        // Title
        const title = this.isNew ? 'Create New Cluster' : 'Edit Cluster';
        contentEl.createEl('h2', { text: title, cls: 'oom-modal-title' });

        // Description
        contentEl.createEl('p', {
            text: 'Clusters are the highest level of organization in the dream taxonomy.',
            cls: 'oom-modal-description'
        });

        // Form container
        const form = contentEl.createDiv({ cls: 'oom-modal-form' });

        // Name field
        new Setting(form)
            .setName('Name')
            .setDesc('The display name for this cluster')
            .addText(text => {
                this.nameInput = text.inputEl;
                text
                    .setPlaceholder('e.g., Action & Agency')
                    .setValue(this.cluster?.name || '')
                    .onChange(() => this.validateField(this.nameInput));
                
                // Add ARIA attributes
                text.inputEl.setAttribute('aria-label', 'Cluster name');
                text.inputEl.setAttribute('aria-required', 'true');
            });

        // Description field
        new Setting(form)
            .setName('Description')
            .setDesc('Optional description of what this cluster represents')
            .addTextArea(text => {
                this.descriptionInput = text.inputEl;
                text
                    .setPlaceholder('Describe the thematic focus of this cluster...')
                    .setValue(this.cluster?.description || '')
                    .onChange(() => this.validateField(this.descriptionInput));
                
                text.inputEl.setAttribute('aria-label', 'Cluster description');
                text.inputEl.rows = 3;
            });

        // Color field - using custom implementation
        const colorSetting = new Setting(form)
            .setName('Color')
            .setDesc('Visual color for this cluster');
        
        // Create custom color input
        const colorInputContainer = colorSetting.controlEl.createDiv({ cls: 'oom-color-input-container' });
        this.colorInput = colorInputContainer.createEl('input', {
            type: 'color',
            cls: 'oom-color-input',
            value: this.cluster?.color || '#3498db'
        }) as HTMLInputElement;
        
        this.colorInput.setAttribute('aria-label', 'Cluster color');
        this.colorInput.addEventListener('change', () => this.validateField(this.colorInput));

        // Color preview
        const colorPreview = form.createDiv({ cls: 'oom-color-preview' });
        const updatePreview = () => {
            colorPreview.style.backgroundColor = this.colorInput.value;
            colorPreview.textContent = `Preview: ${this.nameInput.value || 'Cluster Name'}`;
        };
        this.colorInput.addEventListener('input', updatePreview);
        this.nameInput.addEventListener('input', updatePreview);
        updatePreview();

        // Create footer
        this.createFooter(contentEl);

        // Focus first input
        this.nameInput.focus();
    }

    private validateField(input: HTMLElement): void {
        if (input === this.nameInput && !this.nameInput.value.trim()) {
            input.addClass('oom-invalid');
        } else {
            input.removeClass('oom-invalid');
        }
    }

    protected validate(): boolean {
        if (!this.nameInput.value.trim()) {
            new Notice('Cluster name is required');
            this.nameInput.focus();
            return false;
        }

        // Check for duplicate names
        const taxonomy = this.taxonomyManager?.getTaxonomy();
        if (taxonomy) {
            const duplicate = taxonomy.clusters.find(c => 
                c.name.toLowerCase() === this.nameInput.value.trim().toLowerCase() &&
                c.id !== this.cluster?.id
            );
            if (duplicate) {
                new Notice(`A cluster named "${this.nameInput.value}" already exists`);
                this.nameInput.focus();
                return false;
            }
        }

        return true;
    }

    protected save(): void {
        try {
            const clusterData = {
                id: this.cluster?.id || `cluster_${Date.now()}`,
                name: this.nameInput.value.trim(),
                description: this.descriptionInput.value.trim() || undefined,
                color: this.colorInput.value,
                vectors: this.cluster?.vectors || []
            };

            if (this.isNew) {
                // Add new cluster
                this.addCluster(clusterData);
            } else {
                // Update existing cluster
                this.updateCluster(clusterData);
            }

            this.onSave();
            this.close();
            new Notice(`Cluster "${clusterData.name}" ${this.isNew ? 'created' : 'updated'} successfully`);
        } catch (error) {
            safeLogger.error('ClusterEditModal', 'Error saving cluster', error);
            new Notice('Failed to save cluster. Please try again.');
        }
    }

    private addCluster(cluster: TaxonomyCluster): void {
        if (!this.taxonomyManager) return;
        
        const taxonomy = this.taxonomyManager.getTaxonomy();
        taxonomy.clusters.push(cluster);
        // Note: In production, we'd use proper state management methods
        safeLogger.info('ClusterEditModal', `Added cluster: ${cluster.name}`);
    }

    private updateCluster(cluster: TaxonomyCluster): void {
        if (!this.taxonomyManager) return;
        
        const taxonomy = this.taxonomyManager.getTaxonomy();
        const index = taxonomy.clusters.findIndex(c => c.id === cluster.id);
        if (index !== -1) {
            taxonomy.clusters[index] = { ...taxonomy.clusters[index], ...cluster };
            safeLogger.info('ClusterEditModal', `Updated cluster: ${cluster.name}`);
        }
    }
}

/**
 * Modal for editing vector properties
 */
export class VectorEditModal extends TaxonomyEditModalBase {
    private vector?: TaxonomyVector;
    private clusterId: string;
    private isNew: boolean;
    private nameInput: HTMLInputElement;
    private descriptionInput: HTMLTextAreaElement;
    private iconInput: HTMLInputElement;
    private clusterSelect: HTMLSelectElement;

    constructor(
        app: App,
        vector: TaxonomyVector | undefined,
        clusterId: string,
        onSave: () => void,
        onCancel?: () => void
    ) {
        super(app, onSave, onCancel);
        this.vector = vector;
        this.clusterId = clusterId;
        this.isNew = !vector;
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('oom-taxonomy-edit-modal');

        // Title
        const title = this.isNew ? 'Create New Vector' : 'Edit Vector';
        contentEl.createEl('h2', { text: title, cls: 'oom-modal-title' });

        // Description
        contentEl.createEl('p', {
            text: 'Vectors group related themes within a cluster.',
            cls: 'oom-modal-description'
        });

        // Form container
        const form = contentEl.createDiv({ cls: 'oom-modal-form' });

        // Name field
        new Setting(form)
            .setName('Name')
            .setDesc('The display name for this vector')
            .addText(text => {
                this.nameInput = text.inputEl;
                text
                    .setPlaceholder('e.g., Mission & Strategy')
                    .setValue(this.vector?.name || '')
                    .onChange(() => this.validateField(this.nameInput));
                
                text.inputEl.setAttribute('aria-label', 'Vector name');
                text.inputEl.setAttribute('aria-required', 'true');
            });

        // Description field
        new Setting(form)
            .setName('Description')
            .setDesc('Optional description of this vector\'s focus')
            .addTextArea(text => {
                this.descriptionInput = text.inputEl;
                text
                    .setPlaceholder('Describe what themes belong in this vector...')
                    .setValue(this.vector?.description || '')
                    .onChange(() => this.validateField(this.descriptionInput));
                
                text.inputEl.setAttribute('aria-label', 'Vector description');
                text.inputEl.rows = 3;
            });

        // Icon field
        new Setting(form)
            .setName('Icon')
            .setDesc('Lucide icon name for visual representation')
            .addText(text => {
                this.iconInput = text.inputEl;
                text
                    .setPlaceholder('e.g., folder, tag, star')
                    .setValue(this.vector?.icon || 'folder')
                    .onChange(() => this.updateIconPreview());
                
                text.inputEl.setAttribute('aria-label', 'Vector icon');
            });

        // Icon preview
        const iconPreview = form.createDiv({ cls: 'oom-icon-preview' });
        const updateIconPreview = () => {
            iconPreview.empty();
            const iconEl = iconPreview.createDiv({ cls: 'oom-icon-preview-icon' });
            try {
                setIcon(iconEl, this.iconInput.value || 'folder');
                iconPreview.createSpan({ text: 'Icon preview', cls: 'oom-icon-preview-label' });
            } catch {
                iconPreview.createSpan({ text: 'Invalid icon name', cls: 'oom-icon-preview-error' });
            }
        };
        this.iconInput.addEventListener('input', updateIconPreview);
        updateIconPreview();

        // Parent cluster field
        new Setting(form)
            .setName('Parent Cluster')
            .setDesc('The cluster this vector belongs to')
            .addDropdown(dropdown => {
                this.clusterSelect = dropdown.selectEl;
                
                const taxonomy = this.taxonomyManager?.getTaxonomy();
                if (taxonomy) {
                    taxonomy.clusters.forEach(cluster => {
                        dropdown.addOption(cluster.id, cluster.name);
                    });
                }
                
                dropdown.setValue(this.vector?.parentClusterId || this.clusterId);
                dropdown.selectEl.setAttribute('aria-label', 'Parent cluster');
            });

        // Create footer
        this.createFooter(contentEl);

        // Focus first input
        this.nameInput.focus();
    }

    private validateField(input: HTMLElement): void {
        if (input === this.nameInput && !this.nameInput.value.trim()) {
            input.addClass('oom-invalid');
        } else {
            input.removeClass('oom-invalid');
        }
    }

    private updateIconPreview(): void {
        // Trigger icon preview update
        this.iconInput.dispatchEvent(new Event('input'));
    }

    protected validate(): boolean {
        if (!this.nameInput.value.trim()) {
            new Notice('Vector name is required');
            this.nameInput.focus();
            return false;
        }

        // Check for duplicate names within the same cluster
        const taxonomy = this.taxonomyManager?.getTaxonomy();
        if (taxonomy) {
            const cluster = taxonomy.clusters.find(c => c.id === this.clusterSelect.value);
            if (cluster) {
                const duplicate = cluster.vectors.find(v => 
                    v.name.toLowerCase() === this.nameInput.value.trim().toLowerCase() &&
                    v.id !== this.vector?.id
                );
                if (duplicate) {
                    new Notice(`A vector named "${this.nameInput.value}" already exists in this cluster`);
                    this.nameInput.focus();
                    return false;
                }
            }
        }

        return true;
    }

    protected save(): void {
        try {
            const vectorData: TaxonomyVector = {
                id: this.vector?.id || `vector_${Date.now()}`,
                name: this.nameInput.value.trim(),
                description: this.descriptionInput.value.trim() || undefined,
                icon: this.iconInput.value.trim() || 'folder',
                parentClusterId: this.clusterSelect.value,
                themes: this.vector?.themes || []
            };

            if (this.isNew) {
                this.addVector(vectorData);
            } else {
                this.updateVector(vectorData);
            }

            this.onSave();
            this.close();
            new Notice(`Vector "${vectorData.name}" ${this.isNew ? 'created' : 'updated'} successfully`);
        } catch (error) {
            safeLogger.error('VectorEditModal', 'Error saving vector', error);
            new Notice('Failed to save vector. Please try again.');
        }
    }

    private addVector(vector: TaxonomyVector): void {
        if (!this.taxonomyManager) return;
        
        const taxonomy = this.taxonomyManager.getTaxonomy();
        const cluster = taxonomy.clusters.find(c => c.id === vector.parentClusterId);
        if (cluster) {
            cluster.vectors.push(vector);
            safeLogger.info('VectorEditModal', `Added vector: ${vector.name}`);
        }
    }

    private updateVector(vector: TaxonomyVector): void {
        if (!this.taxonomyManager) return;
        
        const taxonomy = this.taxonomyManager.getTaxonomy();
        
        // Handle cluster change
        if (this.vector && vector.parentClusterId !== this.vector.parentClusterId) {
            // Remove from old cluster
            const oldCluster = taxonomy.clusters.find(c => c.id === this.vector!.parentClusterId);
            if (oldCluster) {
                const index = oldCluster.vectors.findIndex(v => v.id === vector.id);
                if (index !== -1) {
                    oldCluster.vectors.splice(index, 1);
                }
            }
            
            // Add to new cluster
            const newCluster = taxonomy.clusters.find(c => c.id === vector.parentClusterId);
            if (newCluster) {
                newCluster.vectors.push(vector);
            }
        } else {
            // Update in place
            const cluster = taxonomy.clusters.find(c => c.id === vector.parentClusterId);
            if (cluster) {
                const index = cluster.vectors.findIndex(v => v.id === vector.id);
                if (index !== -1) {
                    cluster.vectors[index] = { ...cluster.vectors[index], ...vector };
                }
            }
        }
        
        safeLogger.info('VectorEditModal', `Updated vector: ${vector.name}`);
    }
}

/**
 * Modal for editing theme properties
 */
export class ThemeEditModal extends TaxonomyEditModalBase {
    private theme?: TaxonomyTheme;
    private vectorId: string;
    private isNew: boolean;
    private nameInput: HTMLInputElement;
    private aliasesInput: HTMLTextAreaElement;
    private descriptionInput: HTMLTextAreaElement;
    private vectorSelects: Map<string, HTMLInputElement> = new Map();

    constructor(
        app: App,
        theme: TaxonomyTheme | undefined,
        vectorId: string,
        onSave: () => void,
        onCancel?: () => void
    ) {
        super(app, onSave, onCancel);
        this.theme = theme;
        this.vectorId = vectorId;
        this.isNew = !theme;
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('oom-taxonomy-edit-modal');

        // Title
        const title = this.isNew ? 'Create New Theme' : 'Edit Theme';
        contentEl.createEl('h2', { text: title, cls: 'oom-modal-title' });

        // Description
        contentEl.createEl('p', {
            text: 'Themes are the individual dream elements that can be tagged in entries.',
            cls: 'oom-modal-description'
        });

        // Form container
        const form = contentEl.createDiv({ cls: 'oom-modal-form' });

        // Name field
        new Setting(form)
            .setName('Name')
            .setDesc('The primary name for this theme')
            .addText(text => {
                this.nameInput = text.inputEl;
                text
                    .setPlaceholder('e.g., Ambition, Challenge, Choice')
                    .setValue(this.theme?.name || '')
                    .onChange(() => this.validateField(this.nameInput));
                
                text.inputEl.setAttribute('aria-label', 'Theme name');
                text.inputEl.setAttribute('aria-required', 'true');
            });

        // Aliases field
        new Setting(form)
            .setName('Aliases')
            .setDesc('Alternative names or synonyms (one per line)')
            .addTextArea(text => {
                this.aliasesInput = text.inputEl;
                text
                    .setPlaceholder('Enter synonyms...\nOne per line')
                    .setValue(this.theme?.aliases?.join('\n') || '');
                
                text.inputEl.setAttribute('aria-label', 'Theme aliases');
                text.inputEl.rows = 3;
            });

        // Description field
        new Setting(form)
            .setName('Description')
            .setDesc('Optional description or examples of this theme')
            .addTextArea(text => {
                this.descriptionInput = text.inputEl;
                text
                    .setPlaceholder('Describe when this theme applies...')
                    .setValue(this.theme?.description || '');
                
                text.inputEl.setAttribute('aria-label', 'Theme description');
                text.inputEl.rows = 3;
            });

        // Vector assignment section
        this.createVectorAssignment(form);

        // Create footer
        this.createFooter(contentEl);

        // Focus first input
        this.nameInput.focus();
    }

    private createVectorAssignment(container: HTMLElement): void {
        const section = container.createDiv({ cls: 'oom-vector-assignment' });
        section.createEl('h3', { text: 'Vector Assignment', cls: 'oom-section-title' });
        section.createEl('p', { 
            text: 'Assign this theme to one or more vectors:', 
            cls: 'oom-section-description' 
        });

        const vectorList = section.createDiv({ cls: 'oom-vector-list' });
        
        const taxonomy = this.taxonomyManager?.getTaxonomy();
        if (!taxonomy) return;

        taxonomy.clusters.forEach(cluster => {
            if (cluster.vectors.length === 0) return;
            
            const clusterGroup = vectorList.createDiv({ cls: 'oom-cluster-group' });
            clusterGroup.createEl('h4', { 
                text: cluster.name, 
                cls: 'oom-cluster-group-title' 
            });
            
            const vectorContainer = clusterGroup.createDiv({ cls: 'oom-vector-checkboxes' });
            
            cluster.vectors.forEach(vector => {
                const vectorItem = vectorContainer.createDiv({ cls: 'oom-vector-item' });
                
                const checkbox = vectorItem.createEl('input', {
                    type: 'checkbox',
                    cls: 'oom-vector-checkbox'
                });
                checkbox.id = `vector-${vector.id}`;
                checkbox.checked = this.theme?.vectorIds.includes(vector.id) || 
                                  vector.id === this.vectorId;
                
                const label = vectorItem.createEl('label', {
                    text: vector.name,
                    cls: 'oom-vector-label'
                });
                label.setAttribute('for', checkbox.id);
                
                this.vectorSelects.set(vector.id, checkbox);
            });
        });
    }

    private validateField(input: HTMLElement): void {
        if (input === this.nameInput && !this.nameInput.value.trim()) {
            input.addClass('oom-invalid');
        } else {
            input.removeClass('oom-invalid');
        }
    }

    protected validate(): boolean {
        if (!this.nameInput.value.trim()) {
            new Notice('Theme name is required');
            this.nameInput.focus();
            return false;
        }

        // Check that at least one vector is selected
        const selectedVectors = Array.from(this.vectorSelects.entries())
            .filter(([_, checkbox]) => checkbox.checked);
        
        if (selectedVectors.length === 0) {
            new Notice('Please assign the theme to at least one vector');
            return false;
        }

        // Check for duplicate names
        const taxonomy = this.taxonomyManager?.getTaxonomy();
        if (taxonomy) {
            for (const cluster of taxonomy.clusters) {
                for (const vector of cluster.vectors) {
                    const duplicate = vector.themes.find(t => 
                        t.name.toLowerCase() === this.nameInput.value.trim().toLowerCase() &&
                        t.id !== this.theme?.id
                    );
                    if (duplicate) {
                        new Notice(`A theme named "${this.nameInput.value}" already exists`);
                        this.nameInput.focus();
                        return false;
                    }
                }
            }
        }

        return true;
    }

    protected save(): void {
        try {
            const selectedVectorIds = Array.from(this.vectorSelects.entries())
                .filter(([_, checkbox]) => checkbox.checked)
                .map(([vectorId, _]) => vectorId);

            const aliases = this.aliasesInput.value
                .split('\n')
                .map(a => a.trim())
                .filter(a => a.length > 0);

            const themeData: TaxonomyTheme = {
                id: this.theme?.id || `theme_${Date.now()}`,
                name: this.nameInput.value.trim(),
                aliases: aliases.length > 0 ? aliases : undefined,
                description: this.descriptionInput.value.trim() || undefined,
                vectorIds: selectedVectorIds,
                usageCount: this.theme?.usageCount || 0
            };

            if (this.isNew) {
                this.addTheme(themeData);
            } else {
                this.updateTheme(themeData);
            }

            this.onSave();
            this.close();
            new Notice(`Theme "${themeData.name}" ${this.isNew ? 'created' : 'updated'} successfully`);
        } catch (error) {
            safeLogger.error('ThemeEditModal', 'Error saving theme', error);
            new Notice('Failed to save theme. Please try again.');
        }
    }

    private addTheme(theme: TaxonomyTheme): void {
        if (!this.taxonomyManager) return;
        
        const taxonomy = this.taxonomyManager.getTaxonomy();
        
        // Add to each selected vector
        theme.vectorIds.forEach(vectorId => {
            for (const cluster of taxonomy.clusters) {
                const vector = cluster.vectors.find(v => v.id === vectorId);
                if (vector) {
                    vector.themes.push(theme);
                }
            }
        });
        
        safeLogger.info('ThemeEditModal', `Added theme: ${theme.name}`);
    }

    private updateTheme(theme: TaxonomyTheme): void {
        if (!this.taxonomyManager) return;
        
        const taxonomy = this.taxonomyManager.getTaxonomy();
        
        // Remove theme from all vectors first
        taxonomy.clusters.forEach(cluster => {
            cluster.vectors.forEach(vector => {
                const index = vector.themes.findIndex(t => t.id === theme.id);
                if (index !== -1) {
                    vector.themes.splice(index, 1);
                }
            });
        });
        
        // Add to selected vectors
        theme.vectorIds.forEach(vectorId => {
            for (const cluster of taxonomy.clusters) {
                const vector = cluster.vectors.find(v => v.id === vectorId);
                if (vector) {
                    vector.themes.push(theme);
                }
            }
        });
        
        safeLogger.info('ThemeEditModal', `Updated theme: ${theme.name}`);
    }
}

/**
 * Modal for confirming deletion of taxonomy entities
 */
export class TaxonomyDeleteModal extends Modal {
    private entityType: 'cluster' | 'vector' | 'theme';
    private entityName: string;
    private childrenCount: number;
    private onConfirm: () => void;
    private onCancel?: () => void;

    constructor(
        app: App,
        entityType: 'cluster' | 'vector' | 'theme',
        entityName: string,
        _entityId: string,  // Prefixed with _ to indicate it's intentionally unused
        childrenCount: number,
        onConfirm: () => void,
        onCancel?: () => void
    ) {
        super(app);
        this.entityType = entityType;
        this.entityName = entityName;
        // entityId is passed but not used in this modal
        this.childrenCount = childrenCount;
        this.onConfirm = onConfirm;
        this.onCancel = onCancel;
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('oom-taxonomy-delete-modal');

        // Title
        contentEl.createEl('h2', { 
            text: `Delete ${this.entityType.charAt(0).toUpperCase() + this.entityType.slice(1)}`, 
            cls: 'oom-modal-title' 
        });

        // Warning icon
        const warningContainer = contentEl.createDiv({ cls: 'oom-warning-container' });
        const warningIcon = warningContainer.createDiv({ cls: 'oom-warning-icon' });
        setIcon(warningIcon, 'alert-triangle');

        // Warning message
        const message = warningContainer.createDiv({ cls: 'oom-warning-message' });
        message.createEl('p', { 
            text: `Are you sure you want to delete the ${this.entityType} "${this.entityName}"?`,
            cls: 'oom-warning-text'
        });

        if (this.childrenCount > 0) {
            const childrenText = this.entityType === 'cluster' 
                ? `${this.childrenCount} vector(s) and all their themes`
                : `${this.childrenCount} theme(s)`;
            
            message.createEl('p', {
                text: `This will also delete ${childrenText}.`,
                cls: 'oom-warning-children'
            });
        }

        message.createEl('p', {
            text: 'This action cannot be undone.',
            cls: 'oom-warning-permanent'
        });

        // Footer with buttons
        const footer = contentEl.createDiv({ cls: 'oom-modal-footer' });
        const buttonContainer = footer.createDiv({ cls: 'oom-modal-buttons' });
        
        // Cancel button
        const cancelBtn = buttonContainer.createEl('button', {
            text: 'Cancel',
            cls: 'oom-button'
        });
        cancelBtn.addEventListener('click', () => {
            if (this.onCancel) this.onCancel();
            this.close();
        });
        
        // Delete button
        const deleteBtn = buttonContainer.createEl('button', {
            text: 'Delete',
            cls: 'oom-button oom-danger'
        });
        deleteBtn.addEventListener('click', () => {
            this.onConfirm();
            this.close();
        });

        // Focus cancel button for safety
        cancelBtn.focus();
    }

    onClose(): void {
        if (this.onCancel) {
            this.onCancel();
        }
    }
}