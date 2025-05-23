import { BaseComponent } from '../BaseComponent';
import { ExpandableContentContainer } from '../expandable-content';
import { 
  AdvancedFilterProps, 
  AdvancedFilterCallbacks,
  FilterGroup,
  FilterCondition,
  FilterFieldType,
  FilterOperator,
  LogicalOperator
} from './AdvancedFilterTypes';

/**
 * View component for the advanced filter
 * 
 * This component renders the UI for building complex filter queries
 * with multiple conditions and groups.
 */
export class AdvancedFilterView extends BaseComponent {
  private props: AdvancedFilterProps;
  private callbacks: AdvancedFilterCallbacks;
  
  // DOM references
  private filterContainer: HTMLElement | null = null;
  private conditionsContainer: HTMLElement | null = null;
  private presetsContainer: HTMLElement | null = null;
  private actionButtonsContainer: HTMLElement | null = null;
  
  // Subcomponents
  private expandablePresets: ExpandableContentContainer | null = null;
  
  /**
   * Constructor
   * @param props Initial props for the component
   * @param callbacks Event callbacks for the component
   */
  constructor(props: AdvancedFilterProps, callbacks: AdvancedFilterCallbacks = {}) {
    super();
    this.props = props;
    this.callbacks = callbacks;
  }
  
  /**
   * Called when the component is rendered
   */
  protected onRender(): void {
    if (!this.containerEl) return;
    
    // Create main container
    this.filterContainer = this.containerEl.createDiv({ cls: 'oom-advanced-filter' });
    
    // Create header
    const headerEl = this.filterContainer.createDiv({ cls: 'oom-advanced-filter-header' });
    headerEl.createEl('h3', { text: 'Advanced Filter', cls: 'oom-advanced-filter-title' });
    
    // Create presets section if there are presets
    if (this.props.presets.length > 0) {
      this.renderPresets();
    }
    
    // Create filter builder
    this.renderFilterBuilder();
    
    // Create action buttons
    this.renderActionButtons();
  }
  
  /**
   * Called when the component is updated
   * @param data New data for the component
   */
  protected onUpdate(data: Partial<AdvancedFilterProps>): void {
    // Update internal props
    this.props = { ...this.props, ...data };
    
    // Update presets if changed
    if (data.presets || data.selectedPresetId) {
      this.updatePresets();
    }
    
    // Update filter builder if filter group changed
    if (data.filterGroup) {
      this.updateFilterBuilder();
    }
  }
  
  /**
   * Clean up resources
   */
  protected onCleanup(): void {
    // Clean up expandable component
    this.expandablePresets?.cleanup();
    this.expandablePresets = null;
    
    // Clear DOM references
    this.filterContainer = null;
    this.conditionsContainer = null;
    this.presetsContainer = null;
    this.actionButtonsContainer = null;
  }
  
  /**
   * Render the presets section
   */
  private renderPresets(): void {
    if (!this.filterContainer) return;
    
    // Create presets container
    this.presetsContainer = this.filterContainer.createDiv({ cls: 'oom-advanced-filter-presets' });
    
    // Create expandable content for presets
    const presetsContent = document.createElement('div');
    presetsContent.addClass('oom-filter-presets-list');
    
    // Add presets to the content
    this.renderPresetsList(presetsContent);
    
    // Create expandable container
    const app = (window as any).app;
    this.expandablePresets = new ExpandableContentContainer(
      app,
      this.presetsContainer,
      {
        id: 'filter-presets',
        title: 'Saved Filters',
        subtitle: `${this.props.presets.length} presets available`,
        isExpanded: false,
        content: presetsContent,
        icon: 'oom-icon-preset'
      }
    );
  }
  
  /**
   * Render the list of presets
   * @param container Element to render into
   */
  private renderPresetsList(container: HTMLElement): void {
    // Clear container
    container.empty();
    
    if (this.props.presets.length === 0) {
      container.createEl('p', { 
        text: 'No saved filters yet. Create a filter and click "Save" to create your first preset.',
        cls: 'oom-empty-state'
      });
      return;
    }
    
    // Create list
    const presetsList = container.createEl('ul', { cls: 'oom-presets-list' });
    
    // Add presets
    this.props.presets.forEach(preset => {
      const presetItem = presetsList.createEl('li', { 
        cls: `oom-preset-item ${this.props.selectedPresetId === preset.id ? 'oom-preset-item--selected' : ''}`
      });
      
      // Preset name and description
      const presetInfo = presetItem.createDiv({ cls: 'oom-preset-info' });
      presetInfo.createEl('span', { text: preset.name, cls: 'oom-preset-name' });
      
      if (preset.description) {
        presetInfo.createEl('span', { text: preset.description, cls: 'oom-preset-description' });
      }
      
      // Preset date
      const date = new Date(preset.modifiedAt);
      presetItem.createEl('span', {
        text: date.toLocaleDateString(),
        cls: 'oom-preset-date'
      });
      
      // Buttons
      const buttonsContainer = presetItem.createDiv({ cls: 'oom-preset-buttons' });
      
      const applyButton = buttonsContainer.createEl('button', {
        text: 'Apply',
        cls: 'oom-button oom-button--small'
      });
      
      const deleteButton = buttonsContainer.createEl('button', {
        text: 'Delete',
        cls: 'oom-button oom-button--small oom-button--danger'
      });
      
      // Event listeners
      presetItem.addEventListener('click', e => {
        // Ignore if click was on buttons
        if ((e.target as HTMLElement).closest('.oom-preset-buttons')) return;
        
        this.callbacks.onSelectPreset?.(preset.id);
      });
      
      applyButton.addEventListener('click', e => {
        e.stopPropagation();
        this.callbacks.onSelectPreset?.(preset.id);
        this.callbacks.onApplyFilter?.(preset.filter);
      });
      
      deleteButton.addEventListener('click', e => {
        e.stopPropagation();
        this.callbacks.onDeletePreset?.(preset.id);
      });
    });
  }
  
  /**
   * Update the presets section
   */
  private updatePresets(): void {
    if (!this.expandablePresets || !this.presetsContainer) return;
    
    // Update subtitle
    this.expandablePresets.update({
      subtitle: `${this.props.presets.length} presets available`
    });
    
    // Re-render presets list
    const presetsContent = document.createElement('div');
    presetsContent.addClass('oom-filter-presets-list');
    this.renderPresetsList(presetsContent);
    this.expandablePresets.setContent(presetsContent);
  }
  
  /**
   * Render the filter builder
   */
  private renderFilterBuilder(): void {
    if (!this.filterContainer) return;
    
    const builderContainer = this.filterContainer.createDiv({ cls: 'oom-filter-builder' });
    
    // Create root group container
    this.conditionsContainer = builderContainer.createDiv({ cls: 'oom-filter-conditions' });
    
    // Render the root filter group
    this.renderFilterGroup(this.conditionsContainer, this.props.filterGroup);
  }
  
  /**
   * Update the filter builder
   */
  private updateFilterBuilder(): void {
    if (!this.conditionsContainer) return;
    
    // Clear and re-render
    this.conditionsContainer.empty();
    this.renderFilterGroup(this.conditionsContainer, this.props.filterGroup);
  }
  
  /**
   * Render a filter group
   * @param container Container element
   * @param group Filter group to render
   * @param parentGroup Parent group (if any)
   * @param groupIndex Index in parent group (if applicable)
   */
  private renderFilterGroup(
    container: HTMLElement, 
    group: FilterGroup,
    parentGroup?: FilterGroup,
    groupIndex?: number
  ): void {
    const groupEl = container.createDiv({ cls: 'oom-filter-group' });
    
    // Group header with operator selector
    const groupHeader = groupEl.createDiv({ cls: 'oom-filter-group-header' });
    
    // Create operator selector
    const operatorContainer = groupHeader.createDiv({ cls: 'oom-filter-operator' });
    operatorContainer.createSpan({ text: 'Match', cls: 'oom-filter-operator-label' });
    
    const operatorSelect = operatorContainer.createEl('select', { cls: 'oom-filter-operator-select' });
    operatorSelect.createEl('option', { text: 'ALL conditions (AND)', value: LogicalOperator.AND });
    operatorSelect.createEl('option', { text: 'ANY condition (OR)', value: LogicalOperator.OR });
    
    // Set selected operator
    operatorSelect.value = group.operator;
    
    // Enable/disable checkbox
    const enabledContainer = groupHeader.createDiv({ cls: 'oom-filter-enabled' });
    const enabledCheckbox = enabledContainer.createEl('input', { 
      type: 'checkbox',
      cls: 'oom-filter-enabled-checkbox'
    });
    enabledCheckbox.checked = group.enabled;
    enabledContainer.createSpan({ text: 'Enabled', cls: 'oom-filter-enabled-label' });
    
    // Only show remove button if this is a nested group
    if (parentGroup && groupIndex !== undefined) {
      const removeButton = groupHeader.createEl('button', {
        text: 'Remove Group',
        cls: 'oom-button oom-button--small oom-button--danger'
      });
      
      removeButton.addEventListener('click', () => {
        this.callbacks.onRemoveGroup?.(groupIndex, parentGroup);
      });
    }
    
    // Group conditions container
    const conditionsEl = groupEl.createDiv({ cls: 'oom-filter-group-conditions' });
    
    // Render each condition or nested group
    group.conditions.forEach((condition, index) => {
      if ('conditions' in condition) {
        // This is a nested group
        this.renderFilterGroup(conditionsEl, condition, group, index);
      } else {
        // This is a filter condition
        this.renderFilterCondition(conditionsEl, condition, group, index);
      }
    });
    
    // Add condition button
    const addConditionButton = groupEl.createEl('button', {
      text: '+ Add Condition',
      cls: 'oom-button oom-button--small oom-button--primary'
    });
    
    // Add group button
    const addGroupButton = groupEl.createEl('button', {
      text: '+ Add Group',
      cls: 'oom-button oom-button--small'
    });
    
    // Event listeners
    operatorSelect.addEventListener('change', () => {
      const newOperator = operatorSelect.value as LogicalOperator;
      this.callbacks.onChangeOperator?.(group, newOperator);
    });
    
    enabledCheckbox.addEventListener('change', () => {
      group.enabled = enabledCheckbox.checked;
      
      // Update visual state
      if (enabledCheckbox.checked) {
        groupEl.removeClass('oom-filter-group--disabled');
      } else {
        groupEl.addClass('oom-filter-group--disabled');
      }
    });
    
    addConditionButton.addEventListener('click', () => {
      // Create a default text condition
      const newCondition: FilterCondition = {
        field: Object.keys(this.props.availableFields)[0] || 'title',
        fieldType: FilterFieldType.TEXT,
        operator: FilterOperator.CONTAINS,
        value: '',
        enabled: true
      };
      
      this.callbacks.onAddCondition?.(newCondition, group);
    });
    
    addGroupButton.addEventListener('click', () => {
      // Create a default nested group
      const newGroup: FilterGroup = {
        operator: LogicalOperator.AND,
        conditions: [],
        enabled: true
      };
      
      this.callbacks.onAddGroup?.(newGroup, group);
    });
    
    // Set initial disabled state
    if (!group.enabled) {
      groupEl.addClass('oom-filter-group--disabled');
    }
  }
  
  /**
   * Render a single filter condition
   * @param container Container element
   * @param condition Filter condition to render
   * @param parentGroup Parent group
   * @param conditionIndex Index in the parent group
   */
  private renderFilterCondition(
    container: HTMLElement,
    condition: FilterCondition,
    parentGroup: FilterGroup,
    conditionIndex: number
  ): void {
    const conditionEl = container.createDiv({ 
      cls: `oom-filter-condition ${!condition.enabled ? 'oom-filter-condition--disabled' : ''}`
    });
    
    // Field selector
    const fieldContainer = conditionEl.createDiv({ cls: 'oom-filter-field' });
    const fieldSelect = fieldContainer.createEl('select', { cls: 'oom-filter-field-select' });
    
    // Add regular fields
    const fieldsGroup = fieldSelect.createEl('optgroup', { label: 'Fields' });
    Object.entries(this.props.availableFields).forEach(([key, field]) => {
      fieldsGroup.createEl('option', { 
        text: field.name, 
        value: key 
      });
    });
    
    // Add metrics fields
    const metricsGroup = fieldSelect.createEl('optgroup', { label: 'Metrics' });
    Object.entries(this.props.availableMetrics).forEach(([key, metric]) => {
      metricsGroup.createEl('option', { 
        text: metric.name, 
        value: `metric:${key}` 
      });
    });
    
    // Set selected field
    fieldSelect.value = condition.field;
    
    // Operator selector
    const operatorContainer = conditionEl.createDiv({ cls: 'oom-filter-operator' });
    const operatorSelect = operatorContainer.createEl('select', { cls: 'oom-filter-operator-select' });
    
    // Add operators based on field type
    this.populateOperatorOptions(operatorSelect, condition.fieldType);
    
    // Set selected operator
    operatorSelect.value = condition.operator;
    
    // Value input area
    const valueContainer = conditionEl.createDiv({ cls: 'oom-filter-value' });
    
    // Create appropriate value input based on field type and operator
    this.createValueInput(valueContainer, condition);
    
    // Enable/disable checkbox
    const enabledContainer = conditionEl.createDiv({ cls: 'oom-filter-enabled' });
    const enabledCheckbox = enabledContainer.createEl('input', { 
      type: 'checkbox',
      cls: 'oom-filter-enabled-checkbox'
    });
    enabledCheckbox.checked = condition.enabled;
    
    // Remove button
    const removeButton = conditionEl.createEl('button', {
      text: 'Remove',
      cls: 'oom-button oom-button--small oom-button--danger oom-filter-remove'
    });
    
    // Event listeners
    fieldSelect.addEventListener('change', () => {
      const fieldKey = fieldSelect.value;
      let fieldType = FilterFieldType.TEXT;
      
      // Check if this is a metric field
      if (fieldKey.startsWith('metric:')) {
        const metricKey = fieldKey.substring(7);
        fieldType = FilterFieldType.METRIC;
      } else {
        // Regular field
        fieldType = this.props.availableFields[fieldKey]?.type || FilterFieldType.TEXT;
      }
      
      // Update operators based on new field type
      operatorSelect.innerHTML = '';
      this.populateOperatorOptions(operatorSelect, fieldType);
      
      // Get appropriate default operator for this field type
      const defaultOperator = this.getDefaultOperator(fieldType);
      operatorSelect.value = defaultOperator;
      
      // Create updated condition
      const updatedCondition = {
        ...condition,
        field: fieldKey,
        fieldType,
        operator: defaultOperator
      };
      
      // Clear and recreate value input
      valueContainer.empty();
      this.createValueInput(valueContainer, updatedCondition);
      
      // Notify of update
      this.callbacks.onUpdateCondition?.(conditionIndex, updatedCondition as FilterCondition, parentGroup);
    });
    
    operatorSelect.addEventListener('change', () => {
      const operator = operatorSelect.value as FilterOperator;
      
      // Create updated condition
      const updatedCondition = {
        ...condition,
        operator
      };
      
      // Clear and recreate value input if the operator changed to/from BETWEEN
      if (
        (condition.operator === FilterOperator.BETWEEN && operator !== FilterOperator.BETWEEN) ||
        (condition.operator !== FilterOperator.BETWEEN && operator === FilterOperator.BETWEEN)
      ) {
        valueContainer.empty();
        this.createValueInput(valueContainer, updatedCondition);
      }
      
      // Notify of update
      this.callbacks.onUpdateCondition?.(conditionIndex, updatedCondition as FilterCondition, parentGroup);
    });
    
    enabledCheckbox.addEventListener('change', () => {
      // Create updated condition
      const updatedCondition = {
        ...condition,
        enabled: enabledCheckbox.checked
      };
      
      // Update visual state
      if (enabledCheckbox.checked) {
        conditionEl.removeClass('oom-filter-condition--disabled');
      } else {
        conditionEl.addClass('oom-filter-condition--disabled');
      }
      
      // Notify of update
      this.callbacks.onUpdateCondition?.(conditionIndex, updatedCondition as FilterCondition, parentGroup);
    });
    
    removeButton.addEventListener('click', () => {
      this.callbacks.onRemoveCondition?.(conditionIndex, parentGroup);
    });
  }
  
  /**
   * Populate operator options based on field type
   * @param select Select element to populate
   * @param fieldType Field type
   */
  private populateOperatorOptions(select: HTMLSelectElement, fieldType: FilterFieldType): void {
    // Clear existing options
    select.innerHTML = '';
    
    // Add appropriate operators based on field type
    switch (fieldType) {
      case FilterFieldType.TEXT:
      case FilterFieldType.TAG:
        select.createEl('option', { text: 'Contains', value: FilterOperator.CONTAINS });
        select.createEl('option', { text: 'Does not contain', value: FilterOperator.NOT_CONTAINS });
        select.createEl('option', { text: 'Equals', value: FilterOperator.EQUALS });
        select.createEl('option', { text: 'Does not equal', value: FilterOperator.NOT_EQUALS });
        select.createEl('option', { text: 'Starts with', value: FilterOperator.STARTS_WITH });
        select.createEl('option', { text: 'Ends with', value: FilterOperator.ENDS_WITH });
        break;
        
      case FilterFieldType.NUMBER:
      case FilterFieldType.METRIC:
        select.createEl('option', { text: 'Equals', value: FilterOperator.EQUALS });
        select.createEl('option', { text: 'Does not equal', value: FilterOperator.NOT_EQUALS });
        select.createEl('option', { text: 'Greater than', value: FilterOperator.GREATER_THAN });
        select.createEl('option', { text: 'Less than', value: FilterOperator.LESS_THAN });
        select.createEl('option', { text: 'Between', value: FilterOperator.BETWEEN });
        break;
        
      case FilterFieldType.DATE:
        select.createEl('option', { text: 'On', value: FilterOperator.EQUALS });
        select.createEl('option', { text: 'Not on', value: FilterOperator.NOT_EQUALS });
        select.createEl('option', { text: 'After', value: FilterOperator.GREATER_THAN });
        select.createEl('option', { text: 'Before', value: FilterOperator.LESS_THAN });
        select.createEl('option', { text: 'Between', value: FilterOperator.BETWEEN });
        break;
        
      case FilterFieldType.BOOLEAN:
        select.createEl('option', { text: 'Is', value: FilterOperator.EQUALS });
        break;
    }
  }
  
  /**
   * Get default operator for a field type
   * @param fieldType Field type
   * @returns Default operator
   */
  private getDefaultOperator(fieldType: FilterFieldType): FilterOperator {
    switch (fieldType) {
      case FilterFieldType.TEXT:
      case FilterFieldType.TAG:
        return FilterOperator.CONTAINS;
      case FilterFieldType.NUMBER:
      case FilterFieldType.METRIC:
      case FilterFieldType.DATE:
      case FilterFieldType.BOOLEAN:
        return FilterOperator.EQUALS;
      default:
        return FilterOperator.CONTAINS;
    }
  }
  
  /**
   * Create appropriate value input based on condition
   * @param container Container element
   * @param condition Filter condition
   */
  private createValueInput(container: HTMLElement, condition: Partial<FilterCondition>): void {
    const fieldType = condition.fieldType;
    const operator = condition.operator;
    
    if (!fieldType || !operator) return;
    
    switch (fieldType) {
      case FilterFieldType.TEXT:
      case FilterFieldType.TAG:
        // Text input
        const textInput = container.createEl('input', {
          type: 'text',
          cls: 'oom-filter-text-input',
          placeholder: 'Enter text value'
        });
        
        if ('value' in condition && typeof condition.value === 'string') {
          textInput.value = condition.value;
        }
        
        textInput.addEventListener('input', () => {
          if (condition && 'field' in condition) {
            const updatedCondition = {
              ...condition,
              value: textInput.value
            };
            
            const index = this.findConditionIndex(condition as FilterCondition);
            if (index !== -1) {
              this.callbacks.onUpdateCondition?.(
                index, 
                updatedCondition as FilterCondition, 
                this.props.filterGroup
              );
            }
          }
        });
        break;
        
      case FilterFieldType.NUMBER:
      case FilterFieldType.METRIC:
        if (operator === FilterOperator.BETWEEN) {
          // Two number inputs for between
          const rangeContainer = container.createDiv({ cls: 'oom-filter-range' });
          
          const minInput = rangeContainer.createEl('input', {
            type: 'number',
            cls: 'oom-filter-number-input',
            placeholder: 'Min'
          });
          
          rangeContainer.createSpan({ text: 'and', cls: 'oom-filter-range-separator' });
          
          const maxInput = rangeContainer.createEl('input', {
            type: 'number',
            cls: 'oom-filter-number-input',
            placeholder: 'Max'
          });
          
          if ('value' in condition && typeof condition.value === 'number') {
            minInput.value = String(condition.value);
          }
          
          if ('secondValue' in condition && typeof condition.secondValue === 'number') {
            maxInput.value = String(condition.secondValue);
          }
          
          const updateRangeValues = () => {
            if (condition && 'field' in condition) {
              const updatedCondition = {
                ...condition,
                value: parseFloat(minInput.value) || 0,
                secondValue: parseFloat(maxInput.value) || 0
              };
              
              const index = this.findConditionIndex(condition as FilterCondition);
              if (index !== -1) {
                this.callbacks.onUpdateCondition?.(
                  index, 
                  updatedCondition as FilterCondition, 
                  this.props.filterGroup
                );
              }
            }
          };
          
          minInput.addEventListener('change', updateRangeValues);
          maxInput.addEventListener('change', updateRangeValues);
        } else {
          // Single number input
          const numberInput = container.createEl('input', {
            type: 'number',
            cls: 'oom-filter-number-input',
            placeholder: 'Enter number'
          });
          
          if ('value' in condition && typeof condition.value === 'number') {
            numberInput.value = String(condition.value);
          }
          
          numberInput.addEventListener('change', () => {
            if (condition && 'field' in condition) {
              const updatedCondition = {
                ...condition,
                value: parseFloat(numberInput.value) || 0
              };
              
              const index = this.findConditionIndex(condition as FilterCondition);
              if (index !== -1) {
                this.callbacks.onUpdateCondition?.(
                  index, 
                  updatedCondition as FilterCondition, 
                  this.props.filterGroup
                );
              }
            }
          });
        }
        break;
        
      case FilterFieldType.DATE:
        if (operator === FilterOperator.BETWEEN) {
          // Two date inputs for between
          const rangeContainer = container.createDiv({ cls: 'oom-filter-range' });
          
          const startInput = rangeContainer.createEl('input', {
            type: 'date',
            cls: 'oom-filter-date-input'
          });
          
          rangeContainer.createSpan({ text: 'and', cls: 'oom-filter-range-separator' });
          
          const endInput = rangeContainer.createEl('input', {
            type: 'date',
            cls: 'oom-filter-date-input'
          });
          
          if ('value' in condition && typeof condition.value === 'string') {
            startInput.value = condition.value;
          }
          
          if ('secondValue' in condition && typeof condition.secondValue === 'string') {
            endInput.value = condition.secondValue;
          }
          
          const updateDateRange = () => {
            if (condition && 'field' in condition) {
              const updatedCondition = {
                ...condition,
                value: startInput.value,
                secondValue: endInput.value
              };
              
              const index = this.findConditionIndex(condition as FilterCondition);
              if (index !== -1) {
                this.callbacks.onUpdateCondition?.(
                  index, 
                  updatedCondition as FilterCondition, 
                  this.props.filterGroup
                );
              }
            }
          };
          
          startInput.addEventListener('change', updateDateRange);
          endInput.addEventListener('change', updateDateRange);
        } else {
          // Single date input
          const dateInput = container.createEl('input', {
            type: 'date',
            cls: 'oom-filter-date-input'
          });
          
          if ('value' in condition && typeof condition.value === 'string') {
            dateInput.value = condition.value;
          }
          
          dateInput.addEventListener('change', () => {
            if (condition && 'field' in condition) {
              const updatedCondition = {
                ...condition,
                value: dateInput.value
              };
              
              const index = this.findConditionIndex(condition as FilterCondition);
              if (index !== -1) {
                this.callbacks.onUpdateCondition?.(
                  index, 
                  updatedCondition as FilterCondition, 
                  this.props.filterGroup
                );
              }
            }
          });
        }
        break;
        
      case FilterFieldType.BOOLEAN:
        // Boolean select
        const boolSelect = container.createEl('select', { cls: 'oom-filter-bool-select' });
        boolSelect.createEl('option', { text: 'True', value: 'true' });
        boolSelect.createEl('option', { text: 'False', value: 'false' });
        
        if ('value' in condition && typeof condition.value === 'boolean') {
          boolSelect.value = condition.value ? 'true' : 'false';
        }
        
        boolSelect.addEventListener('change', () => {
          if (condition && 'field' in condition) {
            const updatedCondition = {
              ...condition,
              value: boolSelect.value === 'true'
            };
            
            const index = this.findConditionIndex(condition as FilterCondition);
            if (index !== -1) {
              this.callbacks.onUpdateCondition?.(
                index, 
                updatedCondition as FilterCondition, 
                this.props.filterGroup
              );
            }
          }
        });
        break;
    }
  }
  
  /**
   * Render action buttons
   */
  private renderActionButtons(): void {
    if (!this.filterContainer) return;
    
    this.actionButtonsContainer = this.filterContainer.createDiv({ cls: 'oom-filter-actions' });
    
    // Apply button
    const applyButton = this.actionButtonsContainer.createEl('button', {
      text: 'Apply Filter',
      cls: 'oom-button oom-button--primary'
    });
    
    // Reset button
    const resetButton = this.actionButtonsContainer.createEl('button', {
      text: 'Reset',
      cls: 'oom-button'
    });
    
    // Save preset button
    const saveButton = this.actionButtonsContainer.createEl('button', {
      text: 'Save as Preset',
      cls: 'oom-button'
    });
    
    // Event listeners
    applyButton.addEventListener('click', () => {
      this.callbacks.onApplyFilter?.(this.props.filterGroup);
    });
    
    resetButton.addEventListener('click', () => {
      this.callbacks.onResetFilter?.();
    });
    
    saveButton.addEventListener('click', () => {
      this.showSavePresetDialog();
    });
  }
  
  /**
   * Show dialog to save the current filter as a preset
   */
  private showSavePresetDialog(): void {
    if (!this.containerEl) return;
    
    // Create modal container
    const modalOverlay = document.createElement('div');
    modalOverlay.addClass('oom-modal-overlay');
    
    const modal = modalOverlay.createDiv({ cls: 'oom-modal oom-save-preset-modal' });
    
    // Modal header
    const header = modal.createDiv({ cls: 'oom-modal-header' });
    header.createEl('h3', { text: 'Save Filter Preset', cls: 'oom-modal-title' });
    
    const closeButton = header.createEl('button', { cls: 'oom-modal-close' });
    closeButton.innerHTML = '&times;';
    
    // Modal content
    const content = modal.createDiv({ cls: 'oom-modal-content' });
    
    // Name field
    const nameContainer = content.createDiv({ cls: 'oom-form-group' });
    nameContainer.createEl('label', { text: 'Preset Name:', for: 'preset-name' });
    const nameInput = nameContainer.createEl('input', {
      type: 'text',
      cls: 'oom-input',
      placeholder: 'Enter a name for this preset',
      id: 'preset-name'
    });
    
    // Description field
    const descContainer = content.createDiv({ cls: 'oom-form-group' });
    descContainer.createEl('label', { text: 'Description (optional):', for: 'preset-desc' });
    const descInput = descContainer.createEl('textarea', {
      cls: 'oom-textarea',
      placeholder: 'Enter a description for this preset',
      id: 'preset-desc'
    });
    
    // Modal footer
    const footer = modal.createDiv({ cls: 'oom-modal-footer' });
    
    const cancelButton = footer.createEl('button', {
      text: 'Cancel',
      cls: 'oom-button'
    });
    
    const saveButton = footer.createEl('button', {
      text: 'Save Preset',
      cls: 'oom-button oom-button--primary'
    });
    
    // Initial focus
    nameInput.focus();
    
    // Event listeners
    const closeModal = () => {
      modalOverlay.remove();
    };
    
    closeButton.addEventListener('click', closeModal);
    cancelButton.addEventListener('click', closeModal);
    
    // Handle click outside modal
    modalOverlay.addEventListener('click', e => {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });
    
    saveButton.addEventListener('click', () => {
      const name = nameInput.value.trim();
      
      if (!name) {
        nameInput.addClass('oom-input--error');
        return;
      }
      
      // Create preset
      const preset: FilterPreset = {
        id: this.generateId(),
        name,
        description: descInput.value.trim() || undefined,
        filter: { ...this.props.filterGroup },
        dateRange: this.props.dateRange ? { ...this.props.dateRange } : undefined,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString()
      };
      
      // Save preset
      this.callbacks.onSavePreset?.(preset);
      
      // Close modal
      closeModal();
    });
    
    // Add to DOM
    this.containerEl.appendChild(modalOverlay);
  }
  
  /**
   * Find the index of a condition in the filter group
   * @param condition Condition to find
   * @returns Index of the condition or -1 if not found
   */
  private findConditionIndex(condition: FilterCondition): number {
    return this.props.filterGroup.conditions.findIndex(c => 
      !('conditions' in c) && c.field === condition.field && c.operator === condition.operator
    );
  }
  
  /**
   * Generate a unique ID for presets
   * @returns Unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
} 