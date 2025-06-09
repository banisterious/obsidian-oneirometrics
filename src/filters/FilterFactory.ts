/**
 * Filter Factory
 * 
 * Provides utilities for creating filter UI elements with consistent styling
 * and proper event handling.
 */

import { BaseComponent, EventableComponent } from '../templates/ui/BaseComponent';
import { createComponent2 as createComponent, createUIComponent } from '../templates/ui/ComponentFactory';
import { TimeFilter } from '../timeFilters';

export interface FilterElementProps {
    id?: string;
    className?: string;
    container?: HTMLElement;
    label?: string;
    placeholder?: string;
    options?: { value: string; label: string }[];
    defaultValue?: string;
    filters?: TimeFilter[];
    onChange?: (value: string) => void;
    onFilterChange?: (filter: TimeFilter) => void;
}

// Add custom properties to EventableComponent for our filters
interface FilterDropdown extends EventableComponent {
    getValue(): string;
    setValue(value: string): void;
}

interface DateRangeFilterComponent extends EventableComponent {
    getDateRange(): { start: Date, end: Date } | null;
    setDateRange(start: Date, end: Date): void;
}

/**
 * Creates a filter dropdown element
 * @param props Filter element properties
 * @returns The created filter element component
 */
export function createFilterDropdown(props: FilterElementProps): FilterDropdown {
    // Create base component
    const component = createComponent(EventableComponent, {
        id: props.id,
        className: `oom-filter-dropdown ${props.className || ''}`,
        container: props.container
    }) as FilterDropdown;

    // Create label if provided
    if (props.label) {
        const label = document.createElement('label');
        label.textContent = props.label;
        label.className = 'oom-filter-label';
        if (props.id) {
            label.setAttribute('for', `${props.id}-select`);
        }
        component.createElement('div').appendChild(label);
    }

    // Create select element
    const select = document.createElement('select');
    select.className = 'oom-filter-select dropdown';
    if (props.id) {
        select.id = `${props.id}-select`;
    }
    if (props.placeholder) {
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.textContent = props.placeholder;
        placeholderOption.disabled = true;
        placeholderOption.selected = !props.defaultValue;
        select.appendChild(placeholderOption);
    }

    // Add options
    if (props.options) {
        props.options.forEach(option => {
            const optionEl = document.createElement('option');
            optionEl.value = option.value;
            optionEl.textContent = option.label;
            if (props.defaultValue === option.value) {
                optionEl.selected = true;
            }
            select.appendChild(optionEl);
        });
    }

    // Add time filters if provided
    if (props.filters) {
        props.filters.forEach(filter => {
            const optionEl = document.createElement('option');
            optionEl.value = filter.id;
            optionEl.textContent = filter.name;
            if (props.defaultValue === filter.id) {
                optionEl.selected = true;
            }
            select.appendChild(optionEl);
        });
    }

    // Attach event listener
    select.addEventListener('change', () => {
        if (props.onChange) {
            props.onChange(select.value);
        }
        
        if (props.onFilterChange && props.filters) {
            const selectedFilter = props.filters.find(f => f.id === select.value);
            if (selectedFilter) {
                props.onFilterChange(selectedFilter);
            }
        }

        // Emit change event for component subscribers
        component.trigger('change', select.value);
    });

    component.createElement('div').appendChild(select);

    // Add methods to the component
    component.getValue = () => select.value;
    component.setValue = (value: string) => {
        select.value = value;
        // Trigger change event
        const event = new Event('change');
        select.dispatchEvent(event);
    };

    return component;
}

/**
 * Creates a date range filter element
 * @param props Filter element properties
 * @returns The created date range filter component
 */
export function createDateRangeFilter(props: FilterElementProps): DateRangeFilterComponent {
    // Create container component
    const component = createComponent(EventableComponent, {
        id: props.id,
        className: `oom-date-range-filter ${props.className || ''}`,
        container: props.container
    }) as DateRangeFilterComponent;

    // Create label if provided
    if (props.label) {
        const label = document.createElement('label');
        label.textContent = props.label;
        label.className = 'oom-filter-label';
        component.createElement('div').appendChild(label);
    }

    // Create filter inputs container
    const inputsContainer = document.createElement('div');
    inputsContainer.className = 'oom-date-range-inputs';
    component.createElement('div').appendChild(inputsContainer);

    // Create start date input
    const startContainer = document.createElement('div');
    startContainer.className = 'oom-date-input-container';
    const startLabel = document.createElement('label');
    startLabel.textContent = 'Start';
    startLabel.className = 'oom-date-label';
    startContainer.appendChild(startLabel);

    const startInput = document.createElement('input');
    startInput.type = 'date';
    startInput.className = 'oom-date-input';
    startInput.id = props.id ? `${props.id}-start` : 'date-range-start';
    startContainer.appendChild(startInput);
    inputsContainer.appendChild(startContainer);

    // Create end date input
    const endContainer = document.createElement('div');
    endContainer.className = 'oom-date-input-container';
    const endLabel = document.createElement('label');
    endLabel.textContent = 'End';
    endLabel.className = 'oom-date-label';
    endContainer.appendChild(endLabel);

    const endInput = document.createElement('input');
    endInput.type = 'date';
    endInput.className = 'oom-date-input';
    endInput.id = props.id ? `${props.id}-end` : 'date-range-end';
    endContainer.appendChild(endInput);
    inputsContainer.appendChild(endContainer);

    // Create apply button
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'oom-date-range-buttons';
    
    const applyButton = document.createElement('button');
    applyButton.className = 'oom-button oom-button--primary';
    applyButton.textContent = 'Apply';
    buttonContainer.appendChild(applyButton);

    // Create clear button
    const clearButton = document.createElement('button');
    clearButton.className = 'oom-button oom-button--secondary';
    clearButton.textContent = 'Clear';
    buttonContainer.appendChild(clearButton);

    component.createElement('div').appendChild(buttonContainer);

    // Attach event listeners
    applyButton.addEventListener('click', () => {
        const startDate = startInput.value ? new Date(startInput.value) : null;
        const endDate = endInput.value ? new Date(endInput.value) : null;
        
        if (startDate && endDate) {
            component.trigger('apply', { start: startDate, end: endDate });
        }
    });

    clearButton.addEventListener('click', () => {
        startInput.value = '';
        endInput.value = '';
        component.trigger('clear');
    });

    // Add methods to the component
    component.getDateRange = () => {
        const start = startInput.value ? new Date(startInput.value) : null;
        const end = endInput.value ? new Date(endInput.value) : null;
        if (start && end) {
            return { start, end };
        }
        return null;
    };

    component.setDateRange = (start: Date, end: Date) => {
        startInput.value = start.toISOString().substring(0, 10);
        endInput.value = end.toISOString().substring(0, 10);
    };

    return component;
}

/**
 * Creates a filter button element
 * @param props Filter element properties
 * @returns The created filter button component
 */
export function createFilterButton(props: FilterElementProps): EventableComponent {
    // Create button component
    const component = createComponent(EventableComponent, {
        id: props.id,
        className: `oom-filter-button u-padding--sm ${props.className || ''}`,
        container: props.container
    });

    // Create button element
    const button = document.createElement('button');
    button.className = 'oom-button';
    button.textContent = props.label || 'Filter';
    component.createElement('div').appendChild(button);

    // Attach event listener
    button.addEventListener('click', () => {
        component.trigger('click');
    });

    return component;
}

/**
 * Creates a filter group containing multiple filter elements
 * @param props Filter group properties
 * @returns The created filter group component
 */
export function createFilterGroup(props: FilterElementProps): EventableComponent {
    // Create filter group component
    const component = createComponent(EventableComponent, {
        id: props.id,
        className: `oom-filter-group ${props.className || ''}`,
        container: props.container
    });

    return component;
} 